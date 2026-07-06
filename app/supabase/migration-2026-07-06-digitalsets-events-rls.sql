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
