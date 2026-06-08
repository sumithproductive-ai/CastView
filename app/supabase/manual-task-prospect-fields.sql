-- Prospect measurements, notes, and consent audit fields
ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS bust text,
  ADD COLUMN IF NOT EXISTS waist text,
  ADD COLUMN IF NOT EXISTS hips text,
  ADD COLUMN IF NOT EXISTS shoe text,
  ADD COLUMN IF NOT EXISTS hair text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_by uuid;

-- Allow approved waitlist users to read their own entry at signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'waitlist'
      AND policyname = 'User can read own waitlist entry'
  ) THEN
    CREATE POLICY "User can read own waitlist entry"
      ON public.waitlist
      FOR SELECT
      USING (lower(email) = lower(auth.jwt() ->> 'email'));
  END IF;
END $$;
