import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export type AuthedAgency = {
  userId: string;
  agencyId: string;
  email: string;
};

export type AuthFailure = { status: 401 | 403 };

function bearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * Verifies the Supabase access token and resolves agency_id from profiles.
 * Returns null on missing/invalid token (401). Returns { status: 403 } when
 * the user is valid but has no agency_id on their profile.
 */
export async function getAuthedAgency(
  req: VercelRequest,
): Promise<AuthedAgency | AuthFailure | null> {
  const token = bearerToken(req);
  if (!token) return null;

  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = createClient(url, anonKey, {
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

  return {
    userId: user.id,
    agencyId: profile.agency_id,
    email: user.email ?? '',
  };
}

export function isAuthFailure(
  result: AuthedAgency | AuthFailure | null,
): result is AuthFailure {
  return result !== null && 'status' in result;
}
