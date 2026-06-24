export type StoredDevelopmentPathway = {
  sections: { label: string; items: string[] }[];
  summary: string;
  agentNote: string;
  generatedAt: string;
};

function storageKey(evaluationId: string): string {
  return `castview_pathways_${evaluationId}`;
}

function normalizeContext(context: string): string {
  return context.trim().toLowerCase();
}

export function loadPathwaysForEvaluation(
  evaluationId: string,
): Record<string, StoredDevelopmentPathway> {
  if (!evaluationId) return {};

  try {
    const raw = localStorage.getItem(storageKey(evaluationId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredDevelopmentPathway>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function savePathwayForContext(
  evaluationId: string,
  context: string,
  pathway: StoredDevelopmentPathway,
): void {
  if (!evaluationId) return;

  const existing = loadPathwaysForEvaluation(evaluationId);
  existing[normalizeContext(context)] = pathway;
  localStorage.setItem(storageKey(evaluationId), JSON.stringify(existing));
}

export function getPathwayForContext(
  pathways: Record<string, StoredDevelopmentPathway>,
  context: string,
): StoredDevelopmentPathway | null {
  return pathways[normalizeContext(context)] ?? null;
}
