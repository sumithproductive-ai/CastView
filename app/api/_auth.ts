import type { IncomingMessage } from 'http';
import type { VercelRequest } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const ENTITLEMENT_ERROR =
  'Trial ended or subscription inactive. Please choose a plan to continue.';

export type AuthedAgency = {
  userId: string;
  agencyId: string;
  email: string;
  plan: string;
  plan_status: string;
  trial_ends_at: string | null;
};

export type AuthFailure = { status: 401 | 403; error: string };

type HeadersCarrier = VercelRequest | IncomingMessage | { headers?: Record<string, string | string[] | undefined> };

type SupabaseEnv = {
  url: string | undefined;
  serviceKey: string | undefined;
  anonKey: string | undefined;
};

function resolveSupabaseEnv(): SupabaseEnv {
  return {
    url:
      process.env.SUPABASE_URL ??
      process.env.VITE_SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey:
      process.env.SUPABASE_ANON_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function bearerTokenFromHeaders(headers?: Record<string, string | string[] | undefined>): string | null {
  const raw = headers?.authorization ?? headers?.Authorization;
  if (!raw) return null;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export function isEntitled(
  agency: Pick<AuthedAgency, 'plan_status' | 'trial_ends_at'>,
): boolean {
  if (agency.plan_status === 'active') return true;
  if (agency.plan_status === 'trialing') {
    if (!agency.trial_ends_at) return false;
    return new Date(agency.trial_ends_at).getTime() > Date.now();
  }
  return false;
}

function createDbClient(env: SupabaseEnv, token: string): SupabaseClient | null {
  if (!env.url) return null;

  if (env.serviceKey) {
    return createClient(env.url, env.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  if (env.anonKey) {
    return createClient(env.url, env.anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return null;
}

/**
 * Verifies the Supabase access token and resolves agency + billing fields.
 */
export async function getAuthedAgency(
  req: HeadersCarrier,
): Promise<AuthedAgency | AuthFailure> {
  const headers = req.headers as Record<string, string | string[] | undefined>;
  const authHeader = headers?.authorization ?? headers?.Authorization;
  console.log('[API auth] authorization header exists:', Boolean(authHeader));

  const token = bearerTokenFromHeaders(headers);
  console.log('[API auth] token extracted:', Boolean(token), {
    tokenPrefix: token ? `${token.slice(0, 12)}...` : null,
  });
  if (!token) {
    console.log('[API auth] 401: missing bearer token');
    return { status: 401, error: 'Missing authorization token' };
  }

  const env = resolveSupabaseEnv();
  const verifyKey = env.serviceKey ?? env.anonKey;

  console.log('[API auth] env resolved', {
    hasSupabaseUrl: Boolean(env.url),
    hasServiceRoleKey: Boolean(env.serviceKey),
    hasAnonKey: Boolean(env.anonKey),
    verifyWith: env.serviceKey ? 'service_role' : env.anonKey ? 'anon' : 'none',
  });

  if (!env.url || !verifyKey) {
    console.error('[API auth] 401: missing server env', {
      hasSupabaseUrl: Boolean(env.url),
      hasServiceRoleKey: Boolean(env.serviceKey),
      hasAnonKey: Boolean(env.anonKey),
    });
    return { status: 401, error: 'Server authentication is not configured' };
  }

  const authClient = createClient(env.url, verifyKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  console.log('[API auth] user verified:', Boolean(user), {
    error: userError?.message ?? null,
    userId: user?.id ?? null,
  });
  if (userError || !user) {
    console.log('[API auth] 401: invalid or expired token');
    return { status: 401, error: 'Invalid or expired session' };
  }

  const db = createDbClient(env, token);
  if (!db) {
    return { status: 401, error: 'Server authentication is not configured' };
  }

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[API auth] profile lookup failed:', profileError.message);
  }

  if (!profile?.agency_id) {
    return { status: 403, error: 'No agency associated with this account' };
  }

  const { data: agency, error: agencyError } = await db
    .from('agencies')
    .select('plan, plan_status, trial_ends_at')
    .eq('id', profile.agency_id)
    .maybeSingle();

  if (agencyError) {
    console.error('[API auth] agency lookup failed:', agencyError.message);
  }

  return {
    userId: user.id,
    agencyId: profile.agency_id,
    email: user.email ?? '',
    plan: agency?.plan ?? 'trial',
    plan_status: agency?.plan_status ?? 'trialing',
    trial_ends_at: agency?.trial_ends_at ?? null,
  };
}

export function isAuthFailure(
  result: AuthedAgency | AuthFailure,
): result is AuthFailure {
  return 'status' in result && 'error' in result;
}

export type EntitlementResult =
  | { ok: true; auth: AuthedAgency }
  | { ok: false; status: 401 | 403 | 402; error: string };

export async function requireEntitledAgency(req: HeadersCarrier): Promise<EntitlementResult> {
  const auth = await getAuthedAgency(req);
  if (isAuthFailure(auth)) {
    return { ok: false, status: auth.status, error: auth.error };
  }
  if (!isEntitled(auth)) {
    return { ok: false, status: 402, error: ENTITLEMENT_ERROR };
  }
  return { ok: true, auth };
}
