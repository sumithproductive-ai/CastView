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
  plan: string;
  planStatus: string;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  agencyId: null,
  plan: 'trial',
  planStatus: 'trialing',
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>('trial');
  const [planStatus, setPlanStatus] = useState<string>('trialing');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAgencyId(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchAgencyId(session.user.id);
        } else {
          setAgencyId(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchAgencyId = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', userId)
      .single();
    if (data?.agency_id) {
      setAgencyId(data.agency_id);
      const { data: agency } = await supabase
        .from('agencies')
        .select('plan, plan_status')
        .eq('id', data.agency_id)
        .single();
      if (agency) {
        setPlan(agency.plan ?? 'trial');
        setPlanStatus(agency.plan_status ?? 'trialing');
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAgencyId(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, agencyId, plan, planStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
