import { supabase } from './supabase';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch the current authenticated user's profile.
 * RLS ensures only the user's own row is returned.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // PGRST116 = no rows found (profile doesn't exist yet)
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return data as Profile;
}

/**
 * Update the current user's profile (only their own row, enforced by RLS).
 */
export async function updateProfile(
  userId: string,
  updates: { full_name?: string }
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data as Profile;
}
