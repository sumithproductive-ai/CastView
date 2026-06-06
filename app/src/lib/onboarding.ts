import type { NavigateFunction } from 'react-router';
import { supabase } from './supabase';

export const ONBOARDING_SKIPPED_KEY = 'onboarding-skipped';

const DEFAULT_SKIPPED_AGENCY_NAME = 'My Agency';

export function isOnboardingSkipped(): boolean {
  return sessionStorage.getItem(ONBOARDING_SKIPPED_KEY) === '1';
}

export function markOnboardingSkipped(): void {
  sessionStorage.setItem(ONBOARDING_SKIPPED_KEY, '1');
}

export function clearOnboardingSkipped(): void {
  sessionStorage.removeItem(ONBOARDING_SKIPPED_KEY);
}

export function needsOnboarding(
  agencyName: string | null | undefined,
  prospectCount = 0,
  rosterCount = 0,
): boolean {
  if (isOnboardingSkipped()) return false;
  if (agencyName?.trim()) return false;
  if (prospectCount > 0 || rosterCount > 0) return false;
  return true;
}

export async function skipOnboarding(
  navigate: NavigateFunction,
  agencyId: string | null,
  agencyName: string | null | undefined,
  setAgencyName?: (name: string) => void,
): Promise<void> {
  markOnboardingSkipped();

  if (agencyId && !agencyName?.trim()) {
    await supabase
      .from('agencies')
      .update({ name: DEFAULT_SKIPPED_AGENCY_NAME })
      .eq('id', agencyId);
    setAgencyName?.(DEFAULT_SKIPPED_AGENCY_NAME);
  }

  navigate('/', { replace: true });
}
