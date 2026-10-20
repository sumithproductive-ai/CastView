const NEW_PROSPECT_DIGITALS_KEY = 'castview_new_prospect_digitals';

export type NewProspectDigitalsPayload = {
  front: string;
  profile: string;
  threeQuarter: string;
  fullBody: string;
};

export function saveNewProspectDigitals(payload: NewProspectDigitalsPayload): void {
  sessionStorage.setItem(NEW_PROSPECT_DIGITALS_KEY, JSON.stringify(payload));
}

export function loadNewProspectDigitals(): NewProspectDigitalsPayload | null {
  try {
    const raw = sessionStorage.getItem(NEW_PROSPECT_DIGITALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NewProspectDigitalsPayload>;
    return {
      front: parsed.front ?? '',
      profile: parsed.profile ?? '',
      threeQuarter: parsed.threeQuarter ?? '',
      fullBody: parsed.fullBody ?? '',
    };
  } catch {
    return null;
  }
}

export function clearNewProspectDigitals(): void {
  sessionStorage.removeItem(NEW_PROSPECT_DIGITALS_KEY);
}
