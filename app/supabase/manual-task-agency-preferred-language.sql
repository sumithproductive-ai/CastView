-- Global-first: lets an agency set a preferred language for AI-generated
-- content (evaluation reasoning, brief-match reasoning, email-intake
-- extraction notes). UI labels/buttons stay English — this only affects
-- text content the AI writes. Purely additive.

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'English';
