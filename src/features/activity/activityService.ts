import { supabase } from '../../lib/supabaseClient';
import type { Database } from '../../types/database';

type ActivityLogRow = Database['public']['Tables']['activity_log']['Row'];
type ClientRow = Database['public']['Tables']['clients']['Row'];
type PlanRow = Database['public']['Tables']['plans']['Row'];
type CutRow = Database['public']['Tables']['cuts']['Row'];

export interface ActivityItem extends ActivityLogRow {
  client: Pick<ClientRow, 'id' | 'full_name' | 'phone'> | null;
  plan: Pick<PlanRow, 'id' | 'status' | 'token'> | null;
  cut: Pick<CutRow, 'id' | 'cut_number' | 'scheduled_date'> | null;
}

export async function listActivityLog(limit = 50): Promise<ActivityItem[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select(
      `
      *,
      client:clients (
        id,
        full_name,
        phone
      ),
      plan:plans (
        id,
        status,
        token
      ),
      cut:cuts (
        id,
        cut_number,
        scheduled_date
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as ActivityItem[];
}