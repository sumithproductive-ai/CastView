import { supabase } from './supabase';

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

/** Resolve a fresh Supabase session and access token for protected API routes. */
export async function requireAuthSession(
  debugLabel = 'api',
): Promise<AuthSessionResult> {
  let { data: { session } } = await supabase.auth.getSession();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  const needsRefresh =
    Boolean(userError) ||
    !user ||
    !session?.access_token ||
    isSessionExpired(session);

  if (needsRefresh) {
    console.log(`[CastView auth:${debugLabel}] refreshing session`, {
      getUserError: userError?.message ?? null,
      hasAccessToken: Boolean(session?.access_token),
      expired: isSessionExpired(session),
    });
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session?.access_token) {
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
  });

  if (!session?.access_token || !session.user) {
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

/** JSON fetch to a protected API route with the current Supabase session token. */
export async function authFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const auth = await requireAuthSession('fetch');
  if (!auth.ok) {
    throw new Error(auth.message);
  }
  const token = auth.accessToken;

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...init, headers });
  if (response.status === 402) {
    handlePaymentRequired();
  }
  return response;
}
