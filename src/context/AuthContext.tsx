import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getProfile, type Profile } from '../lib/profileApi';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  profileError: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const user = session?.user ?? null;

  // Load the user's profile from Supabase
  const loadProfile = useCallback(async (userId: string) => {
    try {
      setProfileError(null);
      const p = await getProfile(userId);
      setProfile(p);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setProfileError(message);
      setProfile(null);
    }
  }, []);

  // Exposed method to manually refresh the profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  // Sign out: clear local state and Supabase session
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setProfileError(null);
  }, []);

  useEffect(() => {
    // 1. Restore existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          loadProfile(newSession.user.id);
        } else {
          setProfile(null);
          setProfileError(null);
        }
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, profileError, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
