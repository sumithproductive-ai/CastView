const NEW_MODEL_DIGITALS_KEY = 'castview_new_model_digitals';

export type NewModelDigitalsPayload = {
  front: string;
  profile: string;
  threeQuarter: string;
  fullBody: string;
};

export function saveNewModelDigitals(payload: NewModelDigitalsPayload): void {
  sessionStorage.setItem(NEW_MODEL_DIGITALS_KEY, JSON.stringify(payload));
}

export function loadNewModelDigitals(): NewModelDigitalsPayload | null {
  try {
    const raw = sessionStorage.getItem(NEW_MODEL_DIGITALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NewModelDigitalsPayload>;
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

export function clearNewModelDigitals(): void {
  sessionStorage.removeItem(NEW_MODEL_DIGITALS_KEY);
}
