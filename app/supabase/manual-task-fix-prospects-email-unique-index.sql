-- Corrects the partial unique index created by
-- manual-task-prospect-email-source.sql, which is already live in
-- production. Supabase's upsert(..., { onConflict }) can't target a
-- partial index (WHERE clause) without repeating the same predicate on
-- the conflict resolution, which the JS client doesn't support — every
-- email-intake upsert was failing with "there is no unique or exclusion
-- constraint matching the ON CONFLICT specification". A plain index has
-- the same practical effect since NULL is never equal to NULL in a
-- unique index.

DROP INDEX IF EXISTS public.prospects_source_email_message_unique;

CREATE UNIQUE INDEX IF NOT EXISTS prospects_source_email_message_unique
  ON public.prospects (agency_id, source_email_message_id);
