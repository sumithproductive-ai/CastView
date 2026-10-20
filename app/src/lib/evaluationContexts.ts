/** Canonical list of evaluation contexts — must match the prompt definitions in app/api/evaluate.ts. */
export const EVALUATION_CONTEXTS = [
  'Fragrance',
  'Editorial',
  'Runway',
  'Campaign',
  'Beauty',
  'Sportswear',
  'Swimwear',
  'Couture',
  'Street',
] as const;

export type EvaluationContext = (typeof EVALUATION_CONTEXTS)[number];

/** Default contexts for a first-time user, and the target of the one-click "Quick Read" shortcut. */
export const QUICK_READ_CONTEXTS: EvaluationContext[] = ['Fragrance', 'Editorial'];

function storageKey(scope: string): string {
  return `castview.lastEvaluationContexts.${scope}`;
}

/** Reads the booker's last-used context selection for a given flow (e.g. "profile", "compare"). */
export function readLastContexts(scope: string): string[] | null {
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 && parsed.every((c) => typeof c === 'string')
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/** Remembers the booker's context selection so their next evaluation in this flow starts pre-selected. */
export function writeLastContexts(scope: string, contexts: string[]): void {
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(contexts));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded) — safe to ignore, falls back to default next time
  }
}
