-- Manual Task 4: Booker override text on evaluations
-- Run in Supabase SQL Editor if booker_override does not exist yet.

ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS booker_override text;

COMMENT ON COLUMN public.evaluations.booker_override IS
  'Written assessment when the booker overrides AI alignment judgment';
