import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthedAgency, isAuthFailure } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const headers = req.headers;
  const envCheck = {
    hasSupabaseUrl: Boolean(
      process.env.SUPABASE_URL ??
        process.env.VITE_SUPABASE_URL ??
        process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasAnonKey: Boolean(
      process.env.SUPABASE_ANON_KEY ??
        process.env.VITE_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };

  const requestCheck = {
    hasAuthorizationHeader: Boolean(headers.authorization),
    hasApiKeyHeader: Boolean(headers.apikey),
    hasClientSupabaseUrlHeader: Boolean(headers['x-supabase-url']),
  };

  const auth = await getAuthedAgency(req);

  return res.status(200).json({
    request: requestCheck,
    env: envCheck,
    auth: isAuthFailure(auth)
      ? { ok: false, status: auth.status, error: auth.error, reason: auth.reason }
      : { ok: true, userId: auth.userId, agencyId: auth.agencyId },
  });
}
