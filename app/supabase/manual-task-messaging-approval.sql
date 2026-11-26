-- Messaging approval gate.
-- New agencies can't send email through CastView until the founder unlocks
-- them from /admin/requests after an onboarding call. NULL = locked.
-- Run this in the Supabase SQL editor BEFORE deploying the matching code.

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS messaging_enabled_at timestamptz;

-- Same as migration-2026-07-08-trial-reminders.sql, plus messaging_enabled_at,
-- so agencies can't unlock themselves from the browser.
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
    OR NEW.trial_reminder_3d_sent_at IS DISTINCT FROM OLD.trial_reminder_3d_sent_at
    OR NEW.trial_reminder_1d_sent_at IS DISTINCT FROM OLD.trial_reminder_1d_sent_at
    OR NEW.trial_ended_email_sent_at IS DISTINCT FROM OLD.trial_ended_email_sent_at
    OR NEW.messaging_enabled_at IS DISTINCT FROM OLD.messaging_enabled_at
  THEN
    RAISE EXCEPTION 'Billing and identity fields can only be changed by the server';
  END IF;

  RETURN NEW;
END;
$$;
