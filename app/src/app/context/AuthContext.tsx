import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearOnboardingSkipped } from '../../lib/onboarding';
import { supabase } from '../../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export type SignUpResult = {
  error: string | null;
  needsConfirmation?: boolean;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, agencyName: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  agencyId: string | null;
  agencyName: string | null;
  plan: string;
  planStatus: string;
  trialEndsAt: string | null;
  setAgencyName: (name: string) => void;
};

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

function agencyNameFromUser(user: User): string {
  const meta = user.user_metadata?.agency_name;
  if (typeof meta === 'string' && meta.trim()) return meta.trim();
  const email = user.email ?? 'agency';
  const local = email.split('@')[0] ?? 'agency';
  const derived = local.replace(/[._-]/g, ' ').trim();
  return derived || 'My Agency';
}

async function getProfileAgencyId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', userId)
    .maybeSingle();
  return data?.agency_id ?? null;
}

async function provisionAgencyForUser(user: User): Promise<{ error: string | null }> {
  const existingAgencyId = await getProfileAgencyId(user.id);
  if (existingAgencyId) return { error: null };

  const agencyName = agencyNameFromUser(user);
  const trialEndsAt = new Date(Date.now() + TRIAL_MS).toISOString();

  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .insert({
      name: agencyName,
      plan: 'trial',
      plan_status: 'trialing',
      trial_ends_at: trialEndsAt,
    })
    .select()
    .single();

  if (agencyError || !agency) {
    const retryAgencyId = await getProfileAgencyId(user.id);
    if (retryAgencyId) return { error: null };
    return { error: 'Could not create agency' };
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email ?? '',
    agency_id: agency.id,
    role: 'owner',
  });

  if (profileError) {
    const retryAgencyId = await getProfileAgencyId(user.id);
    if (retryAgencyId) return { error: null };
    return { error: 'Could not create profile' };
  }

  return { error: null };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  agencyId: null,
  agencyName: null,
  plan: 'trial',
  planStatus: 'trialing',
  trialEndsAt: null,
  setAgencyName: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>('trial');
  const [planStatus, setPlanStatus] = useState<string>('trialing');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  const applyAgencyPlan = async (resolvedAgencyId: string) => {
    setAgencyId(resolvedAgencyId);
    const { data: agency } = await supabase
      .from('agencies')
      .select('name, plan, plan_status, trial_ends_at')
      .eq('id', resolvedAgencyId)
      .single();
    if (agency) {
      setAgencyName(agency.name ?? null);
      setPlan(agency.plan ?? 'trial');
      setPlanStatus(agency.plan_status ?? 'trialing');
      setTrialEndsAt(agency.trial_ends_at ?? null);
    }
  };

  const fetchAgencyId = async (authUser: User | null | undefined) => {
    if (!authUser) {
      setLoading(false);
      return;
    }

    try {
      let resolvedAgencyId = await getProfileAgencyId(authUser.id);

      if (!resolvedAgencyId) {
        const { error: provisionError } = await provisionAgencyForUser(authUser);
        if (provisionError) {
          console.error('[AuthContext] agency provisioning failed:', provisionError);
          return;
        }
        resolvedAgencyId = await getProfileAgencyId(authUser.id);
      }

      if (resolvedAgencyId) {
        await applyAgencyPlan(resolvedAgencyId);
      }
    } catch (err) {
      console.error('[AuthContext] fetchAgencyId failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const safetyTimeout = setTimeout(() => setLoading(false), 5000);

    void supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          await fetchAgencyId(initialSession.user);
        } else {
          setLoading(false);
        }
        clearTimeout(safetyTimeout);
      })
      .catch((err) => {
        console.error('[AuthContext] getSession failed:', err);
        setLoading(false);
        clearTimeout(safetyTimeout);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          setLoading(true);
          const loginSafety = setTimeout(() => setLoading(false), 5000);
          // Defer Supabase queries to avoid onAuthStateChange deadlock after sign-in.
          setTimeout(() => {
            void fetchAgencyId(nextSession.user).finally(() => {
              clearTimeout(loginSafety);
            });
          }, 0);
        } else {
          setAgencyId(null);
          setAgencyName(null);
          setPlan('trial');
          setPlanStatus('trialing');
          setTrialEndsAt(null);
          clearOnboardingSkipped();
          setLoading(false);
        }
      },
    );

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    agencyName: string,
  ): Promise<SignUpResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { agency_name: agencyName },
          emailRedirectTo: 'https://app.castview.org/login',
        },
      });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Signup failed' };

      if (!data.session) {
        return { error: null, needsConfirmation: true };
      }

      const { error: provisionError } = await provisionAgencyForUser(data.user);
      if (provisionError) return { error: provisionError };

      setLoading(true);
      await fetchAgencyId(data.user);
      return { error: null };
    } catch (err: unknown) {
      setLoading(false);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { error: message };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAgencyId(null);
    setAgencyName(null);
    setTrialEndsAt(null);
    clearOnboardingSkipped();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        agencyId,
        agencyName,
        plan,
        planStatus,
        trialEndsAt,
        setAgencyName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
