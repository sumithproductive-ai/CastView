-- Sprint 2 of the email intake agent: traceability + dedup columns on
-- prospects for cron-drafted rows. Purely additive.

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS source_email_message_id text,
  ADD COLUMN IF NOT EXISTS source_email_connection_id uuid REFERENCES public.email_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS possible_duplicate_of uuid REFERENCES public.prospects(id) ON DELETE SET NULL;

-- One draft per source email, per agency (a re-synced/re-processed message
-- should update the existing draft, not create a duplicate row).
CREATE UNIQUE INDEX IF NOT EXISTS prospects_source_email_message_unique
  ON public.prospects (agency_id, source_email_message_id)
  WHERE source_email_message_id IS NOT NULL;
