-- Moves the "has this agency seen the tutorial" flag from localStorage
-- (per-browser, race-prone against prospect count) to the database
-- (per-agency, set once, durable across devices).
-- Run in Supabase SQL Editor after backup.

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS tutorial_shown_at timestamptz;

-- Not added to protect_agency_billing_fields()'s guarded column list on
-- purpose — same as name/primary_market, this is safe for a client to set
-- on its own agency row (self-serve only, no cross-tenant or billing impact).
