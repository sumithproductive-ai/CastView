export const EVALUATION_RESULTS_KEY = 'castview_evaluation_results';
export const EVALUATION_ERROR_KEY = 'castview_evaluation_error';
export const EVALUATION_CURRENT_KEY = 'castview_current_evaluation';

export type StoredContextEvaluation = {
  context: string;
  alignmentScore: number;
  fitLabel: string;
  reasoning: string;
  strengths: string[];
  risks: string[];
  marketSignals: string[];
  suggestedNextSteps: string[];
};

export type StoredEvaluationReport = {
  evaluationId: string;
  prospectName: string;
  prospectId: string;
  contextsParam: string;
  profileType: string;
  contextEvaluations: StoredContextEvaluation[];
  unavailableContexts: string[];
  updatedAt: string;
  agentNotes?: string;
};

export function createEvaluationId(): string {
  return crypto.randomUUID();
}

export function saveEvaluationReport(report: StoredEvaluationReport): void {
  const json = JSON.stringify(report);
  sessionStorage.setItem(EVALUATION_RESULTS_KEY, json);
  sessionStorage.setItem(EVALUATION_CURRENT_KEY, json);
  localStorage.setItem(EVALUATION_CURRENT_KEY, json);
  localStorage.setItem(`castview_eval_${report.evaluationId}`, json);
}

export function saveEvaluationError(message: string): void {
  sessionStorage.removeItem(EVALUATION_RESULTS_KEY);
  sessionStorage.setItem(EVALUATION_ERROR_KEY, message);
}

export function loadEvaluationReport(
  evaluationId?: string | null,
): StoredEvaluationReport | null {
  const candidates: string[] = [];

  if (evaluationId) {
    candidates.push(`castview_eval_${evaluationId}`);
  }
  candidates.push(EVALUATION_RESULTS_KEY, EVALUATION_CURRENT_KEY);

  for (const key of candidates) {
    const fromSession = sessionStorage.getItem(key);
    if (fromSession) {
      try {
        return JSON.parse(fromSession) as StoredEvaluationReport;
      } catch {
        // try next source
      }
    }

    const fromLocal = localStorage.getItem(key);
    if (fromLocal) {
      try {
        return JSON.parse(fromLocal) as StoredEvaluationReport;
      } catch {
        // try next source
      }
    }
  }

  return null;
}

export function clearHandoffStorage(): void {
  sessionStorage.removeItem(EVALUATION_RESULTS_KEY);
  sessionStorage.removeItem(EVALUATION_ERROR_KEY);
}

export function updateEvaluationNotes(
  evaluationId: string,
  agentNotes: string,
): boolean {
  const key = `castview_eval_${evaluationId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  try {
    const report = JSON.parse(raw) as StoredEvaluationReport;
    report.agentNotes = agentNotes;
    report.updatedAt = new Date().toISOString();
    const updated = JSON.stringify(report);
    localStorage.setItem(key, updated);
    localStorage.setItem(EVALUATION_CURRENT_KEY, updated);
    return true;
  } catch {
    return false;
  }
}
