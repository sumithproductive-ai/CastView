import type { IncomingMessage } from 'http';
import type { VercelRequest } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { hasPermanentAccess, isPaidPlan } from '../src/lib/admin';

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

export type AuthFailure = { status: 401 | 403; error: string; reason?: string };

type HeadersCarrier = VercelRequest | IncomingMessage | { headers?: Record<string, string | string[] | undefined> };

type SupabaseEnv = {
  url: string | undefined;
  serviceKey: string | undefined;
  anonKey: string | undefined;
};

function getRequestHeaders(
  req: HeadersCarrier,
): Record<string, string | string[] | undefined> {
  return (req.headers ?? {}) as Record<string, string | string[] | undefined>;
}

function serverSupabaseUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

function serverSupabaseAnonKey(): string | undefined {
  return (
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function normalizeSupabaseHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

type JwtDebugInfo = {
  sub: string | null;
  exp: number | null;
  expiresInSec: number | null;
  issHost: string | null;
  expired: boolean | null;
};

function decodeJwtDebugInfo(token: string): JwtDebugInfo | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as { sub?: string; exp?: number; iss?: string };
    const exp = typeof payload.exp === 'number' ? payload.exp : null;
    const now = Math.floor(Date.now() / 1000);
    return {
      sub: payload.sub ?? null,
      exp,
      expiresInSec: exp !== null ? exp - now : null,
      issHost: normalizeSupabaseHost(payload.iss),
      expired: exp !== null ? exp <= now : null,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve Supabase project for JWT verification.
 * SECURITY: this must never honor a client-supplied Supabase URL/key. Doing so
 * previously let a caller point verification at a Supabase project they control,
 * mint their own JWT + profiles/agencies rows, and impersonate any agency_id.
 * Always verify against this server's own configured project.
 */
function resolveSupabaseEnv(): SupabaseEnv {
  return {
    url: serverSupabaseUrl(),
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: serverSupabaseAnonKey(),
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
  agency: Pick<AuthedAgency, 'email' | 'plan' | 'plan_status' | 'trial_ends_at'>,
): boolean {
  if (hasPermanentAccess(agency.email)) return true;
  if (agency.plan_status === 'active' && isPaidPlan(agency.plan)) return true;
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

type VerifiedUser = { id: string; email: string };

async function verifyUserToken(
  env: SupabaseEnv,
  token: string,
): Promise<VerifiedUser | null> {
  const verifyKey = env.serviceKey ?? env.anonKey;
  if (!env.url || !verifyKey) return null;

  const authClient = createClient(env.url, verifyKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (user && !userError) {
    return { id: user.id, email: user.email ?? '' };
  }

  if (userError) {
    console.log('[API auth] getUser error:', userError.message);
  }

  const base = env.url.replace(/\/$/, '');
  try {
    const response = await fetch(`${base}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: verifyKey,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.log('[API auth] REST /auth/v1/user failed:', {
        status: response.status,
        body: body.slice(0, 300),
      });
      return null;
    }

    const data = (await response.json()) as { id?: string; email?: string };
    if (!data?.id) return null;
    return { id: data.id, email: data.email ?? '' };
  } catch (error) {
    console.error('[API auth] REST verify exception:', error);
    return null;
  }
}

/**
 * Verifies the Supabase access token and resolves agency + billing fields.
 */
export async function getAuthedAgency(
  req: HeadersCarrier,
): Promise<AuthedAgency | AuthFailure> {
  const headers = getRequestHeaders(req);
  const debug = process.env.CASTVIEW_DEBUG_AUTH === '1';

  const token = bearerTokenFromHeaders(headers);
  if (!token) {
    return { status: 401, error: 'Missing authorization token', reason: 'missing_header' };
  }

  const env = resolveSupabaseEnv();
  const jwtInfo = decodeJwtDebugInfo(token);
  const projectMismatch =
    Boolean(jwtInfo?.issHost) &&
    Boolean(env.url) &&
    jwtInfo!.issHost !== normalizeSupabaseHost(env.url);

  if (debug) {
    console.log('[API auth] env resolved', {
      hasSupabaseUrl: Boolean(env.url),
      jwtIssHost: jwtInfo?.issHost ?? null,
      projectMismatch,
      hasServiceRoleKey: Boolean(env.serviceKey),
      hasAnonKey: Boolean(env.anonKey),
      verifyWith: env.serviceKey ? 'service_role' : env.anonKey ? 'anon' : 'none',
      jwtExpired: jwtInfo?.expired ?? null,
    });
  }

  if (!env.url || (!env.serviceKey && !env.anonKey)) {
    console.error('[API auth] 401: missing server env', {
      hasSupabaseUrl: Boolean(env.url),
      hasServiceRoleKey: Boolean(env.serviceKey),
      hasAnonKey: Boolean(env.anonKey),
    });
    return {
      status: 401,
      error: 'Server authentication is not configured',
      reason: 'missing_env',
    };
  }

  const verifiedUser = await verifyUserToken(env, token);
  if (debug) {
    console.log('[API auth] user verified:', Boolean(verifiedUser), {
      userId: verifiedUser?.id ?? null,
    });
  }
  if (!verifiedUser) {
    const reason = projectMismatch ? 'project_mismatch' : 'invalid_token';
    console.log('[API auth] 401: invalid or expired token', { reason });
    return {
      status: 401,
      error: projectMismatch
        ? 'Session was issued by a different Supabase project. Log out and sign in again on this site.'
        : 'Invalid or expired session',
      reason,
    };
  }

  const db = createDbClient(env, token);
  if (!db) {
    return {
      status: 401,
      error: 'Server authentication is not configured',
      reason: 'missing_env',
    };
  }

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('agency_id')
    .eq('id', verifiedUser.id)
    .maybeSingle();

  if (profileError) {
    console.error('[API auth] profile lookup failed:', profileError.message);
    return {
      status: 401,
      error: 'Could not load user profile',
      reason: 'profile_lookup_failed',
    };
  }

  if (!profile?.agency_id) {
    return { status: 403, error: 'No agency associated with this account', reason: 'no_agency' };
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
    userId: verifiedUser.id,
    agencyId: profile.agency_id,
    email: verifiedUser.email,
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
  | { ok: false; status: 401 | 403 | 402; error: string; reason?: string };

export async function requireEntitledAgency(req: HeadersCarrier): Promise<EntitlementResult> {
  const auth = await getAuthedAgency(req);
  if (isAuthFailure(auth)) {
    return { ok: false, status: auth.status, error: auth.error, reason: auth.reason };
  }
  if (!isEntitled(auth)) {
    return { ok: false, status: 402, error: ENTITLEMENT_ERROR, reason: 'not_entitled' };
  }
  return { ok: true, auth };
}
