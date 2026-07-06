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
-- Tenant isolation for core tables the browser queries directly with the anon key.
-- Run in Supabase SQL Editor after backup.
--
-- Context: evaluations/context_evaluations/waitlist already had RLS (see
-- migration-context-evaluations-full-data.sql and migration-2026-06-09-fix-signup-and-platform.sql).
-- prospects, models, messages, agencies, profiles did not have committed RLS policies,
-- even though ProspectsContext, RosterContext, MessageThread, Dashboard, Settings,
-- ClientPortal, Sidebar, and Notifications all query them directly from the browser.
-- Without this, any authenticated user could read/write another agency's data by
-- changing an id in a request.

-- 0. Ensure the agency-scoping helper exists (idempotent — already created by
--    migration-context-evaluations-full-data.sql, redefined here so this file
--    can also be run standalone).
CREATE OR REPLACE FUNCTION public.current_user_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_user_agency_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_agency_id() TO authenticated;

-- =====================================================================
-- 1. profiles — read-only for clients. All writes go through the
--    provision_agency_for_user() SECURITY DEFINER function (signup) or
--    the service-role key (server routes). No INSERT/UPDATE/DELETE
--    policy is added on purpose: default-deny for the authenticated role.
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile or teammates" ON public.profiles;
CREATE POLICY "Users can read own profile or teammates"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR agency_id = public.current_user_agency_id());

-- =====================================================================
-- 2. agencies — agency members can read their own agency row and update
--    non-billing fields (name, primary_market). Billing/identity fields
--    (plan, plan_status, trial_ends_at, stripe_customer_id, owner_email,
--    seat_count) must only ever change via the service-role key (Stripe
--    webhook, provisioning) — enforced below with a trigger, since RLS
--    policies alone can't restrict which columns an UPDATE touches.
-- =====================================================================
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency members can read own agency" ON public.agencies;
CREATE POLICY "Agency members can read own agency"
  ON public.agencies FOR SELECT
  USING (id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can update own agency" ON public.agencies;
CREATE POLICY "Agency members can update own agency"
  ON public.agencies FOR UPDATE
  USING (id = public.current_user_agency_id())
  WITH CHECK (id = public.current_user_agency_id());

CREATE OR REPLACE FUNCTION public.protect_agency_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
    OR NEW.plan_status IS DISTINCT FROM OLD.plan_status
    OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
    OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
    OR NEW.owner_email IS DISTINCT FROM OLD.owner_email
    OR NEW.seat_count IS DISTINCT FROM OLD.seat_count
  THEN
    RAISE EXCEPTION 'Billing and identity fields can only be changed by the server';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_agency_billing_fields_trigger ON public.agencies;
CREATE TRIGGER protect_agency_billing_fields_trigger
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_agency_billing_fields();

-- =====================================================================
-- 3. prospects — full CRUD scoped to the caller's agency.
-- =====================================================================
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency members can read prospects" ON public.prospects;
CREATE POLICY "Agency members can read prospects"
  ON public.prospects FOR SELECT
  USING (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can insert prospects" ON public.prospects;
CREATE POLICY "Agency members can insert prospects"
  ON public.prospects FOR INSERT
  WITH CHECK (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can update prospects" ON public.prospects;
CREATE POLICY "Agency members can update prospects"
  ON public.prospects FOR UPDATE
  USING (agency_id = public.current_user_agency_id())
  WITH CHECK (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can delete prospects" ON public.prospects;
CREATE POLICY "Agency members can delete prospects"
  ON public.prospects FOR DELETE
  USING (agency_id = public.current_user_agency_id());

-- =====================================================================
-- 4. models — full CRUD scoped to the caller's agency.
-- =====================================================================
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency members can read models" ON public.models;
CREATE POLICY "Agency members can read models"
  ON public.models FOR SELECT
  USING (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can insert models" ON public.models;
CREATE POLICY "Agency members can insert models"
  ON public.models FOR INSERT
  WITH CHECK (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can update models" ON public.models;
CREATE POLICY "Agency members can update models"
  ON public.models FOR UPDATE
  USING (agency_id = public.current_user_agency_id())
  WITH CHECK (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can delete models" ON public.models;
CREATE POLICY "Agency members can delete models"
  ON public.models FOR DELETE
  USING (agency_id = public.current_user_agency_id());

-- =====================================================================
-- 5. messages — clients only ever read and mark read_at (see
--    NotificationsPanel.tsx, Notifications.tsx, MessageThread.tsx).
--    All sends happen server-side via send-message.ts / inbound-email.ts
--    with the service-role key, so no INSERT/DELETE policy is added for
--    authenticated (default-deny). UPDATE is scoped to the agency and
--    restricted by trigger to the read_at column only.
-- =====================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency members can read messages" ON public.messages;
CREATE POLICY "Agency members can read messages"
  ON public.messages FOR SELECT
  USING (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can mark messages read" ON public.messages;
CREATE POLICY "Agency members can mark messages read"
  ON public.messages FOR UPDATE
  USING (agency_id = public.current_user_agency_id())
  WITH CHECK (agency_id = public.current_user_agency_id());

CREATE OR REPLACE FUNCTION public.protect_message_integrity_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.body IS DISTINCT FROM OLD.body
    OR NEW.subject IS DISTINCT FROM OLD.subject
    OR NEW.direction IS DISTINCT FROM OLD.direction
    OR NEW.from_email IS DISTINCT FROM OLD.from_email
    OR NEW.to_email IS DISTINCT FROM OLD.to_email
    OR NEW.prospect_id IS DISTINCT FROM OLD.prospect_id
    OR NEW.agency_id IS DISTINCT FROM OLD.agency_id
  THEN
    RAISE EXCEPTION 'Only read_at can be updated by a client';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_message_integrity_fields_trigger ON public.messages;
CREATE TRIGGER protect_message_integrity_fields_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_message_integrity_fields();
-- Same tenant-isolation gap as migration-2026-07-06-core-table-rls.sql, found
-- afterward: digital_sets and events are also queried directly from the
-- browser with the anon key and had no committed RLS policy.
-- Run in Supabase SQL Editor after backup, after the other 2026-07-06 migrations.

-- =====================================================================
-- 1. digital_sets — full CRUD scoped to the caller's agency. Every write
--    from the client (ProspectsContext.tsx, RosterContext.tsx) already
--    sets agency_id, so this matches existing behavior exactly.
-- =====================================================================
ALTER TABLE public.digital_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency members can read digital_sets" ON public.digital_sets;
CREATE POLICY "Agency members can read digital_sets"
  ON public.digital_sets FOR SELECT
  USING (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can insert digital_sets" ON public.digital_sets;
CREATE POLICY "Agency members can insert digital_sets"
  ON public.digital_sets FOR INSERT
  WITH CHECK (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can update digital_sets" ON public.digital_sets;
CREATE POLICY "Agency members can update digital_sets"
  ON public.digital_sets FOR UPDATE
  USING (agency_id = public.current_user_agency_id())
  WITH CHECK (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can delete digital_sets" ON public.digital_sets;
CREATE POLICY "Agency members can delete digital_sets"
  ON public.digital_sets FOR DELETE
  USING (agency_id = public.current_user_agency_id());

-- =====================================================================
-- 2. events — activity/notification log. Client inserts events directly
--    (Results.tsx, MessageThread.tsx, ProspectRenderHistory.tsx, etc.) and
--    only ever updates read_at afterward (Notifications.tsx,
--    NotificationsPanel.tsx, Sidebar.tsx) — never event_type/metadata.
-- =====================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency members can read events" ON public.events;
CREATE POLICY "Agency members can read events"
  ON public.events FOR SELECT
  USING (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can insert events" ON public.events;
CREATE POLICY "Agency members can insert events"
  ON public.events FOR INSERT
  WITH CHECK (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can mark events read" ON public.events;
CREATE POLICY "Agency members can mark events read"
  ON public.events FOR UPDATE
  USING (agency_id = public.current_user_agency_id())
  WITH CHECK (agency_id = public.current_user_agency_id());

CREATE OR REPLACE FUNCTION public.protect_event_integrity_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.event_type IS DISTINCT FROM OLD.event_type
    OR NEW.metadata IS DISTINCT FROM OLD.metadata
    OR NEW.agency_id IS DISTINCT FROM OLD.agency_id
  THEN
    RAISE EXCEPTION 'Only read_at can be updated by a client';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_event_integrity_fields_trigger ON public.events;
CREATE TRIGGER protect_event_integrity_fields_trigger
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_event_integrity_fields();
