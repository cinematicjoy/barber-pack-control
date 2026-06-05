import { supabase } from '../../lib/supabaseClient';
import type { Database } from '../../types/database';

export type ClientRow = Database['public']['Tables']['clients']['Row'];
type PlanRow = Database['public']['Tables']['plans']['Row'];

export interface ClientWithPlans extends ClientRow {
  plans: {
    id: string;
    status: string;
    total_cuts: number;
    remaining_cuts: number;
    paid: boolean;
    start_date: string;
    created_at: string;
  }[];
}

export interface ClientDetail {
  client: ClientRow;
  plans: PlanRow[];
}

export async function listClients(searchTerm = ''): Promise<ClientWithPlans[]> {
  let query = supabase
    .from('clients')
    .select(
      `
      *,
      plans (
        id,
        status,
        total_cuts,
        remaining_cuts,
        paid,
        start_date,
        created_at
      )
    `
    )
    .order('created_at', { ascending: false });

  if (searchTerm.trim()) {
    query = query.ilike('full_name', `%${searchTerm.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ClientWithPlans[];
}

export async function getClientDetail(clientId: string): Promise<ClientDetail> {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    throw new Error(clientError?.message || 'No se encontró el cliente.');
  }

  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (plansError || !plans) {
    throw new Error(plansError?.message || 'No se pudieron cargar los paquetes.');
  }

  return {
    client,
    plans,
  };
}