import type { DigitalSet } from '../app/types/talent';

export const CONTEXT_FILTER_CODE_MAP: Record<string, string> = {
  fragrance: 'FR',
  editorial: 'ED',
  runway: 'RW',
  campaign: 'CA',
  beauty: 'BE',
  sportswear: 'SP',
  couture: 'CO',
  swimwear: 'SW',
  streetwear: 'ST',
  'e-commerce': 'EC',
};

export function contextNameToCode(contextName: string): string {
  const normalized = contextName.trim().toLowerCase();
  return CONTEXT_FILTER_CODE_MAP[normalized] ?? contextName.trim().toUpperCase().slice(0, 2);
}

export function deriveRenderedContexts(digitalSets: DigitalSet[]): string[] {
  const codes = new Set<string>();
  for (const digitalSet of digitalSets) {
    for (const evaluation of digitalSet.evaluations ?? []) {
      for (const contextEval of evaluation.contexts ?? []) {
        if (contextEval.context?.trim()) {
          codes.add(contextNameToCode(contextEval.context));
        }
      }
    }
  }
  return [...codes];
}
