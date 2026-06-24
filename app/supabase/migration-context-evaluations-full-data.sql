-- Full evaluation payload on context_evaluations + agency-scoped RLS
-- Run in Supabase SQL Editor after backup.

-- 1. Ensure context_evaluations stores full per-context evaluation data
ALTER TABLE public.context_evaluations
  ADD COLUMN IF NOT EXISTS alignment_score integer,
  ADD COLUMN IF NOT EXISTS fit_label text,
  ADD COLUMN IF NOT EXISTS reasoning text,
  ADD COLUMN IF NOT EXISTS strengths jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS risks jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS market_signals jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS suggested_next_steps jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.context_evaluations.alignment_score IS 'AI alignment score 0-100 for this context';
COMMENT ON COLUMN public.context_evaluations.reasoning IS 'Full evaluation reasoning text';

-- 2. One row per (evaluation, context)
CREATE UNIQUE INDEX IF NOT EXISTS context_evaluations_evaluation_id_context_key
  ON public.context_evaluations (evaluation_id, context);

-- 3. Helper: current user agency (used by RLS)
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

-- 4. RLS on evaluations (agency members only)
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency members can read evaluations" ON public.evaluations;
CREATE POLICY "Agency members can read evaluations"
  ON public.evaluations FOR SELECT
  USING (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can insert evaluations" ON public.evaluations;
CREATE POLICY "Agency members can insert evaluations"
  ON public.evaluations FOR INSERT
  WITH CHECK (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can update evaluations" ON public.evaluations;
CREATE POLICY "Agency members can update evaluations"
  ON public.evaluations FOR UPDATE
  USING (agency_id = public.current_user_agency_id())
  WITH CHECK (agency_id = public.current_user_agency_id());

DROP POLICY IF EXISTS "Agency members can delete evaluations" ON public.evaluations;
CREATE POLICY "Agency members can delete evaluations"
  ON public.evaluations FOR DELETE
  USING (agency_id = public.current_user_agency_id());

-- 5. RLS on context_evaluations (via parent evaluation agency)
ALTER TABLE public.context_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency members can read context_evaluations" ON public.context_evaluations;
CREATE POLICY "Agency members can read context_evaluations"
  ON public.context_evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = context_evaluations.evaluation_id
        AND e.agency_id = public.current_user_agency_id()
    )
  );

DROP POLICY IF EXISTS "Agency members can insert context_evaluations" ON public.context_evaluations;
CREATE POLICY "Agency members can insert context_evaluations"
  ON public.context_evaluations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = context_evaluations.evaluation_id
        AND e.agency_id = public.current_user_agency_id()
    )
  );

DROP POLICY IF EXISTS "Agency members can update context_evaluations" ON public.context_evaluations;
CREATE POLICY "Agency members can update context_evaluations"
  ON public.context_evaluations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = context_evaluations.evaluation_id
        AND e.agency_id = public.current_user_agency_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = context_evaluations.evaluation_id
        AND e.agency_id = public.current_user_agency_id()
    )
  );

DROP POLICY IF EXISTS "Agency members can delete context_evaluations" ON public.context_evaluations;
CREATE POLICY "Agency members can delete context_evaluations"
  ON public.context_evaluations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = context_evaluations.evaluation_id
        AND e.agency_id = public.current_user_agency_id()
    )
  );
