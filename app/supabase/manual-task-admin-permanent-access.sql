-- Permanent access for CastView admin owner only (sumithproductive@gmail.com).
-- Run in Supabase SQL Editor when needed.
--
-- This is optional for the admin account: the app also grants permanent access
-- in code via ADMIN_EMAIL in src/lib/admin.ts. These values keep Settings/DB
-- consistent and remove trial messaging.
--
-- FUTURE ACCOUNTS (everyone else):
--   Default signup: plan = trial or founding_beta, plan_status = trialing,
--   trial_ends_at = now + 14 days (see provision_agency_for_user).
--   After trial: they must subscribe via Stripe (plan -> solo/studio/agency,
--   plan_status -> active) OR you manually update their agencies row.
--   Do NOT set trial_ends_at = NULL for non-admin agencies unless you intend
--   to grant extended access manually.

UPDATE public.agencies
SET
  plan = 'founding_beta',
  plan_status = 'active',
  trial_ends_at = NULL
WHERE lower(owner_email) = lower('sumithproductive@gmail.com')
RETURNING id, name, owner_email, plan, plan_status, trial_ends_at;

-- Example: extend a founding pilot agency by 45 days (not permanent)
-- UPDATE public.agencies
-- SET trial_ends_at = now() + interval '45 days', plan_status = 'trialing'
-- WHERE lower(owner_email) = lower('agency@example.com');

-- Example: grant paid-tier access after manual comp (without Stripe)
-- UPDATE public.agencies
-- SET plan = 'solo', plan_status = 'active', trial_ends_at = NULL
-- WHERE lower(owner_email) = lower('agency@example.com');
