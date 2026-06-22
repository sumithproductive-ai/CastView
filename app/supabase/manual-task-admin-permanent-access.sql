-- Grant permanent admin access for CastView owner account.
-- Run in Supabase SQL Editor (Production).

UPDATE public.agencies
SET
  plan = 'founding_beta',
  plan_status = 'active',
  trial_ends_at = NULL
WHERE lower(owner_email) = lower('sumithproductive@gmail.com')
RETURNING id, name, owner_email, plan, plan_status, trial_ends_at;
