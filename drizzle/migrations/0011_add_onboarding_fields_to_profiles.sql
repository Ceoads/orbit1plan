ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS onboarding_current_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_skipped_at timestamptz;

-- Existing users (accounts created before this feature) must never be forced
-- through onboarding: mark them completed.
UPDATE public.profiles SET onboarding_status = 'completed', onboarding_completed_at = now()
WHERE onboarding_status = 'not_started';