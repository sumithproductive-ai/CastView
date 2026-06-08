import { supabase, supabaseAnonKey, supabaseUrl } from './supabase';

export const UPGRADE_REQUIRED_KEY = 'castview_upgrade_required';
export const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please log in again.';

export type AuthSessionResult =
  | { ok: true; accessToken: string; userId: string }
  | { ok: false; message: string };

function isSessionExpired(session: { expires_at?: number } | null | undefined): boolean {
  if (!session?.expires_at) return false;
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at <= now + 30;
}

async function verifyAccessTokenWithSupabase(
  accessToken: string,
): Promise<{ ok: boolean; status?: number }> {
  const base = supabaseUrl.replace(/\/$/, '');
  try {
    const response = await fetch(`${base}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    console.warn('[CastView auth] client token verify failed:', error);
    return { ok: false };
  }
}

async function refreshStoredSession(
  debugLabel: string,
  reason: string,
): Promise<{ session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']; refreshError?: string }> {
  console.log(`[CastView auth:${debugLabel}] refreshing session`, { reason });
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  return {
    session: refreshed.session ?? null,
    refreshError: refreshError?.message,
  };
}

/** Resolve a fresh Supabase session and access token for protected API routes. */
export async function requireAuthSession(
  debugLabel = 'api',
  options: { forceRefresh?: boolean } = {},
): Promise<AuthSessionResult> {
  let { data: { session } } = await supabase.auth.getSession();

  if (session?.refresh_token && (options.forceRefresh || session.access_token)) {
    const refreshed = await refreshStoredSession(
      debugLabel,
      options.forceRefresh ? 'forced' : 'pre_request',
    );
    if (refreshed.session?.access_token) {
      session = refreshed.session;
    } else if (refreshed.refreshError) {
      console.warn(`[CastView auth:${debugLabel}] refresh error:`, refreshed.refreshError);
    }
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || !session?.access_token || isSessionExpired(session)) {
    const refreshed = await refreshStoredSession(debugLabel, 'getUser_or_expired');
    if (refreshed.session?.access_token) {
      session = refreshed.session;
    }
  }

  console.log(`[CastView auth:${debugLabel}] session check`, {
    sessionExists: Boolean(session),
    accessTokenExists: Boolean(session?.access_token),
    userId: session?.user?.id ?? null,
    expiresAt: session?.expires_at ?? null,
    expiresInSec: session?.expires_at
      ? session.expires_at - Math.floor(Date.now() / 1000)
      : null,
    tokenPrefix: session?.access_token
      ? `${session.access_token.slice(0, 12)}...`
      : null,
    supabaseHost: supabaseUrl ? new URL(supabaseUrl).host : null,
  });

  if (!session?.access_token || !session.user) {
    return { ok: false, message: SESSION_EXPIRED_MESSAGE };
  }

  const verified = await verifyAccessTokenWithSupabase(session.access_token);
  if (!verified.ok) {
    console.warn(`[CastView auth:${debugLabel}] token rejected by Supabase`, {
      status: verified.status ?? null,
    });
    const retry = await refreshStoredSession(debugLabel, 'client_verify_failed');
    if (retry.session?.access_token) {
      const retryVerified = await verifyAccessTokenWithSupabase(retry.session.access_token);
      if (retryVerified.ok) {
        return {
          ok: true,
          accessToken: retry.session.access_token,
          userId: retry.session.user!.id,
        };
      }
    }
    return { ok: false, message: SESSION_EXPIRED_MESSAGE };
  }

  return {
    ok: true,
    accessToken: session.access_token,
    userId: session.user.id,
  };
}

/** Read the current Supabase access token for protected API routes. */
export async function getSessionAccessToken(): Promise<string | null> {
  const auth = await requireAuthSession('token');
  return auth.ok ? auth.accessToken : null;
}

/** Show trial/upgrade UI (Layout overlay) after a 402 from a protected API. */
export function handlePaymentRequired(): void {
  try {
    sessionStorage.setItem(UPGRADE_REQUIRED_KEY, '1');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('castview:upgrade-required'));
  const onHomeWithUpgrade =
    window.location.pathname === '/' && window.location.search.includes('upgrade=');
  if (!onHomeWithUpgrade) {
    window.location.assign('/?upgrade=studio');
  }
}

/** Headers every protected API route needs to verify the Supabase session. */
export function buildApiAuthHeaders(accessToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    apikey: supabaseAnonKey,
    'X-Supabase-Url': supabaseUrl,
  };
}

/** JSON fetch to a protected API route with the current Supabase session token. */
export async function authFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const auth = await requireAuthSession('fetch');
  if (!auth.ok) {
    throw new Error(auth.message);
  }

  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(buildApiAuthHeaders(auth.accessToken))) {
    headers.set(key, value);
  }

  const response = await fetch(url, { ...init, headers });
  if (response.status === 402) {
    handlePaymentRequired();
  }
  return response;
}
