import type { DigitalSet, Evaluation } from '../types/talent';
import type { Prospect } from '../context/ProspectsContext';
import type { RosterModel } from '../context/RosterContext';
import type { StoredContextEvaluation } from './evaluationStorage';
import {
  upsertEvaluationWithContexts,
} from '../../lib/supabase';

export const EVALUATION_SYNC_FAILED_MSG =
  'Saved locally — sync failed, will retry.';

async function fetchEntityDigitalSets(entityId: string): Promise<DigitalSet[]> {
  const { supabase } = await import('../../lib/supabase');
  const { data: freshSets, error } = await supabase
    .from('digital_sets')
    .select('*')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (freshSets ?? []).map((ds) => ({
    id: ds.id,
    title: ds.title ?? '',
    uploadedAt: ds.uploaded_at ?? '',
    front: ds.front ?? null,
    profile: ds.profile ?? null,
    threeQuarter: ds.three_quarter ?? null,
    fullBody: ds.full_body ?? null,
    additionalImages: [],
    notes: ds.notes ?? '',
    tags: ds.tags ?? [],
    evaluations: [],
  }));
}

export function buildEvaluationFromContextResults(
  evaluationId: string,
  contextEvaluations: StoredContextEvaluation[],
  agentNotes = '',
): Evaluation {
  return {
    id: evaluationId,
    completedAt: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    agentNotes,
    contexts: contextEvaluations.map((ce) => ({
      context: ce.context,
      alignmentScore: ce.alignmentScore,
      fitLabel: ce.fitLabel,
      reasoning: ce.reasoning,
      strengths: ce.strengths ?? [],
      risks: ce.risks ?? [],
      marketSignals: ce.marketSignals ?? [],
      suggestedNextSteps: ce.suggestedNextSteps ?? [],
    })),
  };
}

export function mergeEvaluationIntoDigitalSets(
  digitalSets: DigitalSet[],
  targetSetId: string,
  evaluation: Evaluation,
): DigitalSet[] {
  return digitalSets.map((ds) =>
    ds.id === targetSetId
      ? {
          ...ds,
          evaluations: [
            evaluation,
            ...(ds.evaluations ?? []).filter((e) => e.id !== evaluation.id),
          ],
        }
      : ds,
  );
}

export type PersistEvaluationParams = {
  agencyId: string;
  profileType: string;
  entityId: string;
  evaluationId: string;
  contextEvaluations: StoredContextEvaluation[];
  targetDigitalSetId?: string;
  agentNotes?: string;
  getProspectById: (id: string) => Prospect | undefined;
  updateProspect: (id: string, updates: Partial<Prospect>) => Promise<void>;
  getModelById: (id: string) => RosterModel | undefined;
  updateModel: (id: string, updates: Partial<RosterModel>) => Promise<void>;
};

export async function persistEvaluationToSupabase(
  params: PersistEvaluationParams,
): Promise<boolean> {
  const {
    agencyId,
    profileType,
    entityId,
    evaluationId,
    contextEvaluations,
    targetDigitalSetId,
    agentNotes = '',
    getProspectById,
    updateProspect,
    getModelById,
    updateModel,
  } = params;

  const persistedKey = `castview_persisted_${evaluationId}`;

  if (!agencyId || !entityId || contextEvaluations.length === 0) return false;

  const evaluation = buildEvaluationFromContextResults(
    evaluationId,
    contextEvaluations,
    agentNotes,
  );

  let digitalSets =
    profileType === 'model'
      ? getModelById(entityId)?.digitalSets ?? []
      : getProspectById(entityId)?.digitalSets ?? [];

  if (digitalSets.length === 0) {
    digitalSets = await fetchEntityDigitalSets(entityId);
  }
  if (digitalSets.length === 0) return false;

  const targetSetId = targetDigitalSetId || digitalSets[0].id;

  await upsertEvaluationWithContexts({
    agencyId,
    entityId,
    evaluationId,
    digitalSetId: targetSetId,
    contextEvaluations,
    agentNotes,
    completedAt: new Date().toISOString(),
  });

  const updatedSets = mergeEvaluationIntoDigitalSets(
    digitalSets,
    targetSetId,
    evaluation,
  );

  if (profileType === 'model') {
    await updateModel(entityId, { digitalSets: updatedSets });
  } else {
    await updateProspect(entityId, { digitalSets: updatedSets });
  }

  localStorage.setItem(persistedKey, '1');
  return true;
}

export function isEvaluationPersisted(
  digitalSets: DigitalSet[] | undefined,
  evaluationId: string,
): boolean {
  return (
    digitalSets?.some((ds) =>
      (ds.evaluations ?? []).some((e) => e.id === evaluationId),
    ) ?? false
  );
}

export { fetchEvaluationReportFromSupabase } from '../../lib/supabase';
