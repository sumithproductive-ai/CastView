import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  agencyId: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  agencyId: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  const fetchAgencyId = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', userId)
        .single();
      if (data?.agency_id) setAgencyId(data.agency_id);
    } catch {
      // fail silently
    }
  };

  useEffect(() => {
    // Step 1: get session once on mount, set loading false immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // fetch agencyId in background — does not block loading
      if (session?.user) {
        fetchAgencyId(session.user.id);
      }
    });

    // Step 2: listen for future auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          setAgencyId(null);
        } else {
          // fetch agencyId in background — never await inside this listener
          fetchAgencyId(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAgencyId(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, agencyId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
