import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export type RateLimitResult = { allowed: boolean; count: number };

/**
 * Fixed-window rate limit backed by Postgres (see migration-2026-07-06-rate-limits.sql).
 * Fails open on a DB/RPC error — a rate-limiter outage should not take the app down,
 * only real abuse should be blocked.
 */
export async function checkRateLimit(
  key: string,
  windowSeconds: number,
  max: number,
): Promise<RateLimitResult> {
  const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  });

  if (error) {
    console.error('[rate-limit] check failed, failing open:', error.message);
    return { allowed: true, count: 0 };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(row?.allowed),
    count: Number(row?.current_count ?? 0),
  };
}

type HeadersCarrier = { headers?: Record<string, string | string[] | undefined> };

export function clientIp(req: HeadersCarrier): string {
  const headers = req.headers ?? {};
  const forwarded = headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (forwardedValue) return forwardedValue.split(',')[0].trim();

  const real = headers['x-real-ip'];
  const realValue = Array.isArray(real) ? real[0] : real;
  return realValue ?? 'unknown';
}
