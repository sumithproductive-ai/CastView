import type { DigitalSet } from '../types/talent';

export const SUMITH_PROSPECT_ID = 'sumith-chittimalla';
export const SUMITH_PROSPECT_NAME = 'Sumith Chittimalla';

export function isSumithProspect(prospectId?: string | null, name?: string | null) {
  if (prospectId === SUMITH_PROSPECT_ID) return true;
  if (!name) return false;
  return name.trim().toLowerCase() === SUMITH_PROSPECT_NAME.toLowerCase();
}

let devDigitalSetPromise: Promise<DigitalSet | null> | null = null;

/** Loads founder demo digitals only in local DEV (dynamic import — excluded from production bundle). */
export function getSumithDigitalSetV1(): Promise<DigitalSet | null> {
  if (import.meta.env.DEV) {
    if (!devDigitalSetPromise) {
      devDigitalSetPromise = import('./sumithProspect.dev').then(
        (mod) => mod.SUMITH_DIGITAL_SET_V1,
      );
    }
    return devDigitalSetPromise;
  }
  return Promise.resolve(null);
}
