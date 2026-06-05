import { supabase } from '../../lib/supabaseClient';
import type { Database } from '../../types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface SettingsProfile {
  email: string;
  fullName: string | null;
  profile: ProfileRow | null;
}

export async function getSettingsProfile(): Promise<SettingsProfile> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!userData.user) {
    throw new Error('No hay usuario autenticado.');
  }

  const user = userData.user;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    email: user.email ?? '',
    fullName: profile?.full_name ?? null,
    profile,
  };
}