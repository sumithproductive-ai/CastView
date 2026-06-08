const CONSENT_STORAGE_KEY = 'castview-pending-prospect-consent';

export type PendingProspectConsent = {
  confirmedAt: string;
  prospectName: string;
  agentUserId: string;
  agentEmail: string;
};

export function savePendingProspectConsent(consent: PendingProspectConsent): void {
  try {
    sessionStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    /* ignore */
  }
}

export function readPendingProspectConsent(): PendingProspectConsent | null {
  try {
    const raw = sessionStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingProspectConsent;
  } catch {
    return null;
  }
}

export function clearPendingProspectConsent(): void {
  try {
    sessionStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
