import { supabase } from './supabase';

export const UPGRADE_REQUIRED_KEY = 'castview_upgrade_required';

/** Read the current Supabase access token for protected API routes. */
export async function getSessionAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
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
  const token = await getSessionAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...init, headers });
  if (response.status === 402) {
    handlePaymentRequired();
  }
  return response;
}
