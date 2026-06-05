import { addWeeks } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';
import { generateFourWeeklyDates } from '../../lib/dateUtils';
import { generateSecureToken } from '../../lib/token';
import type { Database } from '../../types/database';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

type PlanRow = Database['public']['Tables']['plans']['Row'];
type PlanInsert = Database['public']['Tables']['plans']['Insert'];

type CutRow = Database['public']['Tables']['cuts']['Row'];
type CutInsert = Database['public']['Tables']['cuts']['Insert'];

type RescheduleInsert =
  Database['public']['Tables']['reschedules']['Insert'];

type ActivityLogInsert =
  Database['public']['Tables']['activity_log']['Insert'];

export interface PlanDetail {
  plan: PlanRow;
  client: ClientRow;
  cuts: CutRow[];
  reschedulesUsed: number;
}

interface CreateClientWithPlanInput {
  clientFullName: string;
  clientPhone: string;
  clientNotes: string;
  startDateIso: string;
  paid: boolean;
  paymentAmount: number | null;
  firstCutCompleted: boolean;
}

interface CreateClientWithPlanResult {
  client: ClientRow;
  plan: PlanRow;
  cuts: CutRow[];
}

interface RescheduleCutInput {
  cutId: string;
  reason?: string;
  moveFollowingCuts?: boolean;
}

async function getCurrentBarberId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('No hay usuario autenticado.');
  }

  return data.user.id;
}

async function getReschedulesUsed(planId: string): Promise<number> {
  const { count, error } = await supabase
    .from('reschedules')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', planId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function createClientWithPlan(
  input: CreateClientWithPlanInput
): Promise<CreateClientWithPlanResult> {
  const barberId = await getCurrentBarberId();

  const token = generateSecureToken();
  const cutDates = generateFourWeeklyDates(input.startDateIso);

  const clientInsert: ClientInsert = {
    barber_id: barberId,
    full_name: input.clientFullName.trim(),
    phone: input.clientPhone.trim() || null,
    notes: input.clientNotes.trim() || null,
  };

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert(clientInsert)
    .select()
    .single();

  if (clientError || !client) {
    throw new Error(clientError?.message || 'No se pudo crear el cliente.');
  }

  const remainingCuts: number = input.firstCutCompleted ? 3 : 4;

  const planInsert: PlanInsert = {
    client_id: client.id,
    barber_id: barberId,
    token,
    status: 'active',
    total_cuts: 4,
    remaining_cuts: remainingCuts,
    paid: input.paid,
    payment_amount: input.paymentAmount,
    payment_date: input.paid ? new Date().toISOString() : null,
    start_date: input.startDateIso,
  };

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .insert(planInsert)
    .select()
    .single();

  if (planError || !plan) {
    await supabase.from('clients').delete().eq('id', client.id);
    throw new Error(planError?.message || 'No se pudo crear el paquete.');
  }

  const cutsToInsert: CutInsert[] = cutDates.map((scheduledDate, index) => {
    const cutNumber = index + 1;
    const isFirstCut = cutNumber === 1;
    const shouldMarkCompleted = input.firstCutCompleted && isFirstCut;

    return {
      plan_id: plan.id,
      client_id: client.id,
      barber_id: barberId,
      cut_number: cutNumber,
      scheduled_date: scheduledDate,
      original_scheduled_date: scheduledDate,
      status: shouldMarkCompleted ? 'completed' : 'pending',
      completed_at: shouldMarkCompleted ? new Date().toISOString() : null,
      reschedule_count_applied: 0,
      notes: null,
    };
  });

  const { data: cuts, error: cutsError } = await supabase
    .from('cuts')
    .insert(cutsToInsert)
    .select()
    .order('cut_number', { ascending: true });

  if (cutsError || !cuts) {
    await supabase.from('plans').delete().eq('id', plan.id);
    await supabase.from('clients').delete().eq('id', client.id);
    throw new Error(cutsError?.message || 'No se pudieron crear los cortes.');
  }

  const descriptions = [
    `Se creó el cliente ${client.full_name}.`,
    `Se creó un paquete de 4 cortes para ${client.full_name}.`,
  ];

  if (input.firstCutCompleted) {
    descriptions.push(
      'El corte #1 fue marcado como realizado al crear el paquete.'
    );
  }

  const activityRows: ActivityLogInsert[] = descriptions.map((description) => ({
    barber_id: barberId,
    client_id: client.id,
    plan_id: plan.id,
    cut_id: null,
    action_type: 'create_plan',
    description,
  }));

  await supabase.from('activity_log').insert(activityRows);

  return {
    client,
    plan,
    cuts,
  };
}

export async function getPlanDetail(planId: string): Promise<PlanDetail> {
  const { data: planWithClient, error: planError } = await supabase
    .from('plans')
    .select(
      `
      *,
      client:clients (*)
    `
    )
    .eq('id', planId)
    .single();

  if (planError || !planWithClient) {
    throw new Error(planError?.message || 'No se encontró el paquete.');
  }

  const { data: cuts, error: cutsError } = await supabase
    .from('cuts')
    .select('*')
    .eq('plan_id', planId)
    .order('cut_number', { ascending: true });

  if (cutsError || !cuts) {
    throw new Error(cutsError?.message || 'No se pudieron cargar los cortes.');
  }

  const reschedulesUsed = await getReschedulesUsed(planId);

  const typedPlan = planWithClient as unknown as PlanRow & {
    client: ClientRow;
  };

  return {
    plan: typedPlan,
    client: typedPlan.client,
    cuts,
    reschedulesUsed,
  };
}

export async function getPlanDetailByToken(token: string): Promise<PlanDetail> {
  const { data: plan, error } = await supabase
    .from('plans')
    .select('id')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!plan) {
    throw new Error('No se encontró ningún paquete con este token.');
  }

  return getPlanDetail(plan.id);
}

export async function confirmCut(cutId: string): Promise<PlanDetail> {
  const barberId = await getCurrentBarberId();

  const { data: cut, error: cutError } = await supabase
    .from('cuts')
    .select('*')
    .eq('id', cutId)
    .single();

  if (cutError || !cut) {
    throw new Error(cutError?.message || 'No se encontró el corte.');
  }

  if (cut.barber_id !== barberId) {
    throw new Error('No tenés permiso para modificar este corte.');
  }

  if (cut.status === 'completed' || cut.completed_at) {
    throw new Error(
      'Este corte ya fue confirmado. No se puede confirmar dos veces.'
    );
  }

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', cut.plan_id)
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message || 'No se encontró el paquete.');
  }

  if (plan.status !== 'active') {
    throw new Error('El paquete no está activo.');
  }

  const completedAt = new Date().toISOString();

  const { error: updateCutError } = await supabase
    .from('cuts')
    .update({
      status: 'completed',
      completed_at: completedAt,
    })
    .eq('id', cut.id);

  if (updateCutError) {
    throw new Error(updateCutError.message);
  }

  const { data: updatedCuts, error: updatedCutsError } = await supabase
    .from('cuts')
    .select('*')
    .eq('plan_id', cut.plan_id)
    .order('cut_number', { ascending: true });

  if (updatedCutsError || !updatedCuts) {
    throw new Error(
      updatedCutsError?.message || 'No se pudieron recalcular los cortes.'
    );
  }

  const completedCuts = updatedCuts.filter(
    (item) => item.status === 'completed'
  ).length;

  const remainingCuts = Math.max(0, 4 - completedCuts);
  const nextPlanStatus: PlanRow['status'] =
    remainingCuts === 0 ? 'completed' : 'active';

  const { error: updatePlanError } = await supabase
    .from('plans')
    .update({
      remaining_cuts: remainingCuts,
      status: nextPlanStatus,
    })
    .eq('id', cut.plan_id);

  if (updatePlanError) {
    throw new Error(updatePlanError.message);
  }

  const activityInsert: ActivityLogInsert = {
    barber_id: barberId,
    client_id: cut.client_id,
    plan_id: cut.plan_id,
    cut_id: cut.id,
    action_type: 'confirm_cut',
    description: `Se confirmó el corte #${cut.cut_number}. Cortes restantes: ${remainingCuts}.`,
  };

  await supabase.from('activity_log').insert(activityInsert);

  return getPlanDetail(cut.plan_id);
}

export async function rescheduleCutAndFollowing({
  cutId,
  reason = '',
  moveFollowingCuts = true,
}: RescheduleCutInput): Promise<PlanDetail> {
  const barberId = await getCurrentBarberId();

  const { data: cut, error: cutError } = await supabase
    .from('cuts')
    .select('*')
    .eq('id', cutId)
    .single();

  if (cutError || !cut) {
    throw new Error(cutError?.message || 'No se encontró el corte.');
  }

  if (cut.barber_id !== barberId) {
    throw new Error('No tenés permiso para reprogramar este corte.');
  }

  if (cut.status === 'completed' || cut.completed_at) {
    throw new Error('No se puede reprogramar un corte ya realizado.');
  }

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', cut.plan_id)
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message || 'No se encontró el paquete.');
  }

  if (plan.status !== 'active') {
    throw new Error('El paquete no está activo.');
  }

  const reschedulesUsed = await getReschedulesUsed(plan.id);

  if (reschedulesUsed >= 2) {
    throw new Error('Este paquete ya usó las 2 reprogramaciones permitidas.');
  }

  let affectedCutsQuery = supabase
    .from('cuts')
    .select('*')
    .eq('plan_id', plan.id)
    .in('status', ['pending', 'rescheduled'])
    .order('cut_number', { ascending: true });

  if (moveFollowingCuts) {
    affectedCutsQuery = affectedCutsQuery.gte('cut_number', cut.cut_number);
  } else {
    affectedCutsQuery = affectedCutsQuery.eq('id', cut.id);
  }

  const { data: affectedCuts, error: affectedCutsError } =
    await affectedCutsQuery;

  if (affectedCutsError || !affectedCuts || affectedCuts.length === 0) {
    throw new Error(
      affectedCutsError?.message || 'No se encontraron cortes para reprogramar.'
    );
  }

  const oldDate = cut.scheduled_date;
  const newDate = addWeeks(new Date(cut.scheduled_date), 1).toISOString();

  for (const affectedCut of affectedCuts) {
    const movedDate = addWeeks(
      new Date(affectedCut.scheduled_date),
      1
    ).toISOString();

    const nextStatus: CutRow['status'] =
      affectedCut.id === cut.id ? 'rescheduled' : affectedCut.status;

    const { error: updateCutError } = await supabase
      .from('cuts')
      .update({
        scheduled_date: movedDate,
        status: nextStatus,
        reschedule_count_applied: affectedCut.reschedule_count_applied + 1,
      })
      .eq('id', affectedCut.id);

    if (updateCutError) {
      throw new Error(updateCutError.message);
    }
  }

  const rescheduleInsert: RescheduleInsert = {
    plan_id: plan.id,
    cut_id: cut.id,
    barber_id: barberId,
    old_date: oldDate,
    new_date: newDate,
    reason: reason.trim() || null,
  };

  const { error: rescheduleError } = await supabase
    .from('reschedules')
    .insert(rescheduleInsert);

  if (rescheduleError) {
    throw new Error(rescheduleError.message);
  }

  const nextUsedCount = reschedulesUsed + 1;

  const activityInsert: ActivityLogInsert = {
    barber_id: barberId,
    client_id: cut.client_id,
    plan_id: cut.plan_id,
    cut_id: cut.id,
    action_type: 'reschedule_cut',
    description: `Se reprogramó el corte #${cut.cut_number}. Nueva fecha: ${newDate}. Reprogramaciones usadas: ${nextUsedCount}/2.`,
  };

  await supabase.from('activity_log').insert(activityInsert);

  return getPlanDetail(plan.id);
}

export function getNextPendingCut(cuts: CutRow[]): CutRow | null {
  return (
    cuts
      .filter((cut) => cut.status !== 'completed')
      .sort((a, b) => a.cut_number - b.cut_number)[0] ?? null
  );
}