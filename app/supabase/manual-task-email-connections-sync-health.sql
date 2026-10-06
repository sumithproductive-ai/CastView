-- Sprint 5 of the email intake agent: lets Settings surface "N emails
-- failed to process last run" next to the existing last-synced timestamp.
-- Purely additive.

ALTER TABLE public.email_connections
  ADD COLUMN IF NOT EXISTS last_sync_failed_count integer NOT NULL DEFAULT 0;
