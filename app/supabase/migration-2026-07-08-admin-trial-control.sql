-- Lets the admin control trial length per agency:
-- 1. At waitlist approval time (waitlist.trial_days, read by provisioning)
-- 2. After the fact, for an existing agency (via the new admin API routes,
--    which use the service-role key — trial_ends_at stays locked down from
--    direct client writes per protect_agency_billing_fields()).
-- Run in Supabase SQL Editor after backup.

ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS trial_days integer;

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
  v_trial_days integer;
  v_trial_ends_at timestamptz;
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
  v_trial_days := NULL;

  IF v_email IS NOT NULL THEN
    SELECT w.trial_days INTO v_trial_days
    FROM public.waitlist w
    WHERE lower(w.email) = lower(v_email) AND w.approved_at IS NOT NULL
    LIMIT 1;

    IF FOUND THEN
      v_plan := 'founding_beta';
      v_plan_status := 'trialing';
    END IF;
  END IF;

  v_trial_ends_at := now() + (COALESCE(v_trial_days, 14) || ' days')::interval;

  INSERT INTO public.agencies (name, owner_email, plan, plan_status, trial_ends_at)
  VALUES (v_name, COALESCE(v_email, ''), v_plan, v_plan_status, v_trial_ends_at)
  RETURNING id INTO v_agency_id;

  INSERT INTO public.profiles (id, email, agency_id, role)
  VALUES (v_user_id, COALESCE(v_email, ''), v_agency_id, 'owner');

  RETURN v_agency_id;
END;
$$;
