import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthedAgency, isAuthFailure } from './_auth';

function hostFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function decodeJwtClaims(token: string | undefined) {
  if (!token) return null;
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
      issHost: hostFromUrl(payload.iss),
      exp,
      expiresInSec: exp !== null ? exp - now : null,
      expired: exp !== null ? exp <= now : null,
    };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (process.env.NODE_ENV === 'production' && process.env.CASTVIEW_ENABLE_DEBUG !== '1') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const headers = req.headers;
  const serverUrl =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clientUrlHeader = headers['x-supabase-url'];
  const clientUrl = Array.isArray(clientUrlHeader) ? clientUrlHeader[0] : clientUrlHeader;
  const authHeader = headers.authorization;
  const bearer = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const token = bearer?.startsWith('Bearer ') ? bearer.slice(7).trim() : undefined;
  const jwt = decodeJwtClaims(token);

  const envCheck = {
    hasSupabaseUrl: Boolean(serverUrl),
    serverUrlHost: hostFromUrl(serverUrl),
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
    hasClientSupabaseUrlHeader: Boolean(clientUrl),
    clientUrlHost: hostFromUrl(clientUrl),
    jwtIssHost: jwt?.issHost ?? null,
    jwtExpired: jwt?.expired ?? null,
    jwtExpiresInSec: jwt?.expiresInSec ?? null,
    projectMismatch:
      Boolean(jwt?.issHost) &&
      Boolean(clientUrl) &&
      jwt!.issHost !== hostFromUrl(clientUrl),
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
