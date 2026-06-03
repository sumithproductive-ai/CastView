import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, agencyName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  agencyId: string | null;
  plan: string;
  planStatus: string;
  trialEndsAt: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  agencyId: null,
  plan: 'trial',
  planStatus: 'trialing',
  trialEndsAt: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>('trial');
  const [planStatus, setPlanStatus] = useState<string>('trialing');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchAgencyId(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          setAgencyId(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchAgencyId = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', userId)
        .single();
      if (data?.agency_id) {
        setAgencyId(data.agency_id);
        const { data: agency } = await supabase
          .from('agencies')
          .select('plan, plan_status, trial_ends_at')
          .eq('id', data.agency_id)
          .single();
        if (agency) {
          setPlan(agency.plan ?? 'trial');
          setPlanStatus(agency.plan_status ?? 'trialing');
          if (agency?.trial_ends_at) {
            setTrialEndsAt(agency.trial_ends_at);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, agencyName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Signup failed' };

      const userId = data.user.id;

      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name: agencyName,
          plan: 'trial',
          plan_status: 'trialing',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (agencyError || !agency) return { error: 'Could not create agency' };

      await supabase.from('profiles').insert({
        id: userId,
        email,
        agency_id: agency.id,
        role: 'owner',
      });

      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'Unknown error' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAgencyId(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, agencyId, plan, planStatus, trialEndsAt }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
