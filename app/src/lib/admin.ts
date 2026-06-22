/** Paid subscription tiers — Stripe checkout sets plan + plan_status active. */
export const PAID_PLAN_IDS = new Set(['solo', 'studio', 'agency']);

export const ADMIN_EMAIL = 'sumithproductive@gmail.com';

export function isAdminUser(email: string | undefined | null): boolean {
  return email === ADMIN_EMAIL;
}

/** Only the admin account bypasses trial and billing gates in code. */
export function hasPermanentAccess(email: string | undefined | null): boolean {
  return isAdminUser(email);
}

export function isPaidPlan(plan: string | undefined | null): boolean {
  return PAID_PLAN_IDS.has((plan ?? '').toLowerCase());
}
