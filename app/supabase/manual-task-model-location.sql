-- Add location (home city/market) to models — captured on intake but never persisted until now
ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS location text;
