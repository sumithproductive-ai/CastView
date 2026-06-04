import { supabase } from './supabase';

/** JSON fetch to a protected API route with the current Supabase session token. */
export async function authFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(url, { ...init, headers });
}
