import type { IncomingMessage } from 'http';
import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

export type AuthFailure = { status: 401 | 403 };

type HeadersCarrier = VercelRequest | IncomingMessage | { headers?: Record<string, string | string[] | undefined> };

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

/**
 * Verifies the Supabase access token and resolves agency + billing fields.
 * Returns null on missing/invalid token (401). Returns { status: 403 } when
 * the user is valid but has no agency_id on their profile.
 */
export async function getAuthedAgency(
  req: HeadersCarrier,
): Promise<AuthedAgency | AuthFailure | null> {
  const token = bearerTokenFromHeaders(req.headers as Record<string, string | string[] | undefined>);
  if (!token) return null;

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.agency_id) {
    return { status: 403 };
  }

  const { data: agency } = await supabase
    .from('agencies')
    .select('plan, plan_status, trial_ends_at')
    .eq('id', profile.agency_id)
    .maybeSingle();

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
  result: AuthedAgency | AuthFailure | null,
): result is AuthFailure {
  return result !== null && 'status' in result;
}

export type EntitlementResult =
  | { ok: true; auth: AuthedAgency }
  | { ok: false; status: 401 | 403 | 402; error: string };

export async function requireEntitledAgency(req: HeadersCarrier): Promise<EntitlementResult> {
  const auth = await getAuthedAgency(req);
  if (auth === null) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  if (isAuthFailure(auth)) {
    return { ok: false, status: 403, error: 'No agency associated with this account' };
  }
  if (!isEntitled(auth)) {
    return { ok: false, status: 402, error: ENTITLEMENT_ERROR };
  }
  return { ok: true, auth };
}
