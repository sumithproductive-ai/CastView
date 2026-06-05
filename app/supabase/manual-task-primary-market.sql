-- Add primary_market to agencies if missing (required for Settings agency form)
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS primary_market text;
