-- Shared fixed-window rate limiter, backed by Postgres (no Redis dependency).
-- Used by API routes (evaluate, brief-match, pathway, send-message, waitlist)
-- via the service-role client. Only service_role can call check_rate_limit.
-- Run in Supabase SQL Editor after backup.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies added on purpose: default-deny for anon/authenticated.
-- Only the service-role client (which bypasses RLS) touches this table.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_window_seconds int,
  p_max int
)
RETURNS TABLE(allowed boolean, current_count int)
LANGUAGE plpgsql
AS $$
DECLARE
  v_window_start timestamptz;
  v_count int;
BEGIN
  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limits (key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING public.rate_limits.count INTO v_count;

  -- Opportunistic cleanup so this table doesn't grow forever — cheap, no cron needed.
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits WHERE window_start < now() - interval '2 days';
  END IF;

  RETURN QUERY SELECT (v_count <= p_max), v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM anon;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int, int) TO service_role;
