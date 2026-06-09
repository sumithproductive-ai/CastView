const COMPARISON_STORAGE_PREFIX = 'castview_comparison_results';

export type ComparisonDirection = 'improved' | 'declined' | 'stable';

export type ComparisonResultItem = {
  context: string;
  oldScore: number;
  newScore: number;
  direction: ComparisonDirection;
  reasoning: string;
  nextStep: string;
  strengths?: string[];
  risks?: string[];
};

export type ComparisonStorageData = {
  results: ComparisonResultItem[];
  previousSet: { title: string; date: string };
  currentSet: { title: string; date: string };
  improvedCount: number;
  stableCount: number;
  declinedCount: number;
};

export function comparisonStorageKey(prospectId: string): string {
  const suffix = prospectId.trim() || 'latest';
  return `${COMPARISON_STORAGE_PREFIX}_${suffix}`;
}

export function saveComparisonResults(
  prospectId: string,
  data: ComparisonStorageData,
): void {
  const serialized = JSON.stringify(data);
  try {
    sessionStorage.setItem(COMPARISON_STORAGE_PREFIX, serialized);
    localStorage.setItem(comparisonStorageKey(prospectId), serialized);
  } catch {
    /* ignore */
  }
}

export function loadComparisonResults(prospectId: string): ComparisonStorageData | null {
  const candidates = [
    sessionStorage.getItem(COMPARISON_STORAGE_PREFIX),
    localStorage.getItem(comparisonStorageKey(prospectId)),
    localStorage.getItem(comparisonStorageKey('')),
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    try {
      return JSON.parse(raw) as ComparisonStorageData;
    } catch {
      /* try next */
    }
  }
  return null;
}
