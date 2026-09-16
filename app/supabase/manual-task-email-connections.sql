-- Sprint 1 of the email intake agent: one Gmail connection per agency.
-- Tokens are stored encrypted at the application layer (see api/_emailCrypto.ts),
-- not via pgcrypto, matching how every other secret in this app lives in an
-- env var rather than relying on DB-level encryption.

CREATE TABLE IF NOT EXISTS public.email_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  label_name text NOT NULL,
  access_token_enc text NOT NULL,
  refresh_token_enc text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  last_synced_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'needs_reauth', 'disconnected')),
  connected_by uuid REFERENCES public.profiles(id),
  connected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id)
);

ALTER TABLE public.email_connections ENABLE ROW LEVEL SECURITY;

-- Agency members can see their own connection's status/label, never the token
-- columns (the app never selects those columns from the client, only the
-- service-role cron does — RLS here is a defense-in-depth backstop).
DROP POLICY IF EXISTS "Agency members can read own email connection" ON public.email_connections;
CREATE POLICY "Agency members can read own email connection"
  ON public.email_connections FOR SELECT
  USING (agency_id = public.current_user_agency_id());

-- No INSERT/UPDATE/DELETE policy for the authenticated role on purpose:
-- connecting/disconnecting Gmail goes through api/gmail-oauth-*.ts, which use
-- the service-role key. Default-deny for direct client writes.
