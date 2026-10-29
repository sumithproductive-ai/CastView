// Plan picked on the landing page's pricing section (castview.org links to
// /login or /signup with ?upgrade=<tier>). Stored so it survives the Google
// OAuth round-trip, email confirmation, and /welcome agency setup, then
// consumed by Layout to start Stripe checkout once the user is signed in.

const PENDING_PLAN_KEY = 'castview_pending_plan';
const VALID_PLANS = ['solo', 'studio', 'agency'];

function isValidPlan(plan: string | null | undefined): plan is string {
  return !!plan && VALID_PLANS.includes(plan);
}

/** Save ?upgrade=<tier> from the current URL, if present and valid. */
export function rememberPlanFromUrl() {
  const plan = new URLSearchParams(window.location.search).get('upgrade');
  if (!isValidPlan(plan)) return;
  try {
    localStorage.setItem(PENDING_PLAN_KEY, plan);
  } catch {
    // storage unavailable — the plan is simply not carried through
  }
}

/** Return the pending plan (URL param wins over storage) and clear it. */
export function takePendingPlan(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get('upgrade');
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(PENDING_PLAN_KEY);
    localStorage.removeItem(PENDING_PLAN_KEY);
  } catch {
    // ignore
  }
  if (isValidPlan(fromUrl)) return fromUrl;
  return isValidPlan(stored) ? stored : null;
}
