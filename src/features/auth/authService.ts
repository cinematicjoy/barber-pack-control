import { supabase } from '../../lib/supabaseClient';

interface LoginParams {
  email: string;
  password: string;
}

export async function loginWithEmail({ email, password }: LoginParams) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function logout() {
  return supabase.auth.signOut();
}