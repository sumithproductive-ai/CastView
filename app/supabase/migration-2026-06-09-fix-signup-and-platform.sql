-- CastView platform fixes (2026-06-09)
-- Run in Supabase SQL Editor or via supabase db push after linking migrations.

-- 1. Signup provisioning (bypasses RLS safely for new users)
CREATE OR REPLACE FUNCTION public.provision_agency_for_user(
  p_agency_name text DEFAULT NULL,
  p_plan text DEFAULT 'trial',
  p_plan_status text DEFAULT 'trialing'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_agency_id uuid;
  v_name text;
  v_meta_name text;
  v_plan text;
  v_plan_status text;
  v_trial_ends_at timestamptz := now() + interval '14 days';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT agency_id INTO v_agency_id FROM public.profiles WHERE id = v_user_id;
  IF v_agency_id IS NOT NULL THEN
    RETURN v_agency_id;
  END IF;

  SELECT email, raw_user_meta_data->>'agency_name'
  INTO v_email, v_meta_name
  FROM auth.users WHERE id = v_user_id;

  v_name := COALESCE(
    NULLIF(trim(p_agency_name), ''),
    NULLIF(trim(v_meta_name), ''),
    NULLIF(trim(replace(replace(replace(split_part(COALESCE(v_email, 'agency'), '@', 1), '.', ' '), '_', ' '), '-', ' ')), ''),
    'My Agency'
  );

  v_plan := COALESCE(NULLIF(trim(p_plan), ''), 'trial');
  v_plan_status := COALESCE(NULLIF(trim(p_plan_status), ''), 'trialing');

  IF v_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.waitlist w
    WHERE lower(w.email) = lower(v_email) AND w.approved_at IS NOT NULL
  ) THEN
    v_plan := 'founding_beta';
    v_plan_status := 'trialing';
  END IF;

  INSERT INTO public.agencies (name, owner_email, plan, plan_status, trial_ends_at)
  VALUES (v_name, COALESCE(v_email, ''), v_plan, v_plan_status, v_trial_ends_at)
  RETURNING id INTO v_agency_id;

  INSERT INTO public.profiles (id, email, agency_id, role)
  VALUES (v_user_id, COALESCE(v_email, ''), v_agency_id, 'owner');

  RETURN v_agency_id;
END;
$$;

DROP FUNCTION IF EXISTS public.provision_agency_for_user(text);
REVOKE ALL ON FUNCTION public.provision_agency_for_user(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_agency_for_user(text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.provision_agency_for_user(text, text, text) TO authenticated;

-- 2. Backfill confirmed users missing profiles/agencies
DO $$
DECLARE
  r record;
  v_agency_id uuid;
  v_name text;
BEGIN
  FOR r IN
    SELECT u.id, u.email, u.raw_user_meta_data->>'agency_name' AS meta_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.id IS NULL AND u.email_confirmed_at IS NOT NULL
  LOOP
    v_name := COALESCE(
      NULLIF(trim(r.meta_name), ''),
      NULLIF(trim(replace(replace(replace(split_part(r.email, '@', 1), '.', ' '), '_', ' '), '-', ' ')), ''),
      'My Agency'
    );

    INSERT INTO public.agencies (name, owner_email, plan, plan_status, trial_ends_at)
    VALUES (v_name, r.email, 'trial', 'trialing', now() + interval '14 days')
    RETURNING id INTO v_agency_id;

    INSERT INTO public.profiles (id, email, agency_id, role)
    VALUES (r.id, r.email, v_agency_id, 'owner');
  END LOOP;
END $$;

-- 3. Waitlist admin policies
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read waitlist" ON public.waitlist;
CREATE POLICY "Admin can read waitlist"
  ON public.waitlist
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'sumithproductive@gmail.com');

DROP POLICY IF EXISTS "Admin can update waitlist" ON public.waitlist;
CREATE POLICY "Admin can update waitlist"
  ON public.waitlist
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'sumithproductive@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'sumithproductive@gmail.com');

-- 4. Settings seat_count column
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS seat_count integer;

-- 5. Realtime for notification badges
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 6. Remove duplicate messages RLS policy
DROP POLICY IF EXISTS "Agency members can manage their messages" ON public.messages;
