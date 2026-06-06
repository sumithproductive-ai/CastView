import type { NavigateFunction } from 'react-router';

export const ONBOARDING_SKIPPED_KEY = 'castview-onboarding-skipped';

export function isOnboardingSkipped(): boolean {
  return sessionStorage.getItem(ONBOARDING_SKIPPED_KEY) === '1';
}

export function markOnboardingSkipped(): void {
  sessionStorage.setItem(ONBOARDING_SKIPPED_KEY, '1');
}

export function clearOnboardingSkipped(): void {
  sessionStorage.removeItem(ONBOARDING_SKIPPED_KEY);
}

export function needsOnboarding(agencyName: string | null | undefined): boolean {
  if (agencyName?.trim()) return false;
  if (isOnboardingSkipped()) return false;
  return true;
}

export function skipOnboarding(navigate: NavigateFunction): void {
  markOnboardingSkipped();
  navigate('/', { replace: true });
}
