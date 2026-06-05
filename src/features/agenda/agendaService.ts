import { supabase } from '../../lib/supabaseClient';
import type { Database } from '../../types/database';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type PlanRow = Database['public']['Tables']['plans']['Row'];
type CutRow = Database['public']['Tables']['cuts']['Row'];
type ActivityLogInsert =
  Database['public']['Tables']['activity_log']['Insert'];

export interface AgendaCut extends CutRow {
  client: ClientRow;
  plan: PlanRow;
}

export interface ReminderCut extends AgendaCut {
  reminderSent: boolean;
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

export async function listAgendaCutsBetween(
  startIso: string,
  endIso: string
): Promise<AgendaCut[]> {
  const { data, error } = await supabase
    .from('cuts')
    .select(
      `
      *,
      client:clients (*),
      plan:plans (*)
    `
    )
    .gte('scheduled_date', startIso)
    .lte('scheduled_date', endIso)
    .in('status', ['pending', 'rescheduled'])
    .order('scheduled_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as AgendaCut[];
}

export async function listTomorrowReminderCuts(): Promise<ReminderCut[]> {
  const { getTomorrowRange } = await import('../../lib/dateUtils');
  const { startIso, endIso } = getTomorrowRange();

  const cuts = await listAgendaCutsBetween(startIso, endIso);

  if (cuts.length === 0) {
    return [];
  }

  const cutIds = cuts.map((cut) => cut.id);

  const { data: sentLogs, error: logsError } = await supabase
    .from('activity_log')
    .select('cut_id')
    .in('cut_id', cutIds)
    .eq('action_type', 'reminder_sent');

  if (logsError) {
    throw new Error(logsError.message);
  }

  const sentCutIds = new Set(
    (sentLogs ?? [])
      .map((log) => log.cut_id)
      .filter((cutId): cutId is string => Boolean(cutId))
  );

  return cuts.map((cut) => ({
    ...cut,
    reminderSent: sentCutIds.has(cut.id),
  }));
}

export async function markReminderSent(cut: ReminderCut): Promise<void> {
  const barberId = await getCurrentBarberId();

  const activityInsert: ActivityLogInsert = {
    barber_id: barberId,
    client_id: cut.client_id,
    plan_id: cut.plan_id,
    cut_id: cut.id,
    action_type: 'reminder_sent',
    description: `Se marcó como enviado el recordatorio del corte #${cut.cut_number} para ${cut.client.full_name}.`,
  };

  const { error } = await supabase.from('activity_log').insert(activityInsert);

  if (error) {
    throw new Error(error.message);
  }
}