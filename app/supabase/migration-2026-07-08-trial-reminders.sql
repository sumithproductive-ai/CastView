-- Tracking columns for trial-expiry reminder emails (sent by the
-- /api/cron/trial-reminders Vercel Cron job). Nullable timestamps, same
-- pattern as waitlist.approved_at / messages.read_at elsewhere in this repo.
-- Run in Supabase SQL Editor after backup.

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS trial_reminder_3d_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_reminder_1d_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ended_email_sent_at timestamptz;

-- Extend the existing billing-field protection trigger (see
-- migration-2026-07-06-core-table-rls.sql) so a client can't self-suppress
-- its own reminder emails by writing to these columns directly.
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
  THEN
    RAISE EXCEPTION 'Billing and identity fields can only be changed by the server';
  END IF;

  RETURN NEW;
END;
$$;
