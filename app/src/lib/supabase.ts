import { createClient } from '@supabase/supabase-js';
import type { DigitalSet } from '../app/types/talent';
import type { StoredContextEvaluation } from '../app/utils/evaluationStorage';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const DIGITALS_BUCKET = 'digitals';
const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 3600;

/** Extract storage object path from a public URL, signed URL, or raw path. */
export function extractDigitalStoragePath(stored: string): string | null {
  if (!stored || stored.startsWith('data:')) return null;
  if (!stored.startsWith('http')) return stored.replace(/^\//, '');

  const markers = [
    '/object/sign/digitals/',
    '/object/public/digitals/',
    '/storage/v1/object/public/digitals/',
    '/storage/v1/object/sign/digitals/',
    '/digitals/',
  ];

  for (const marker of markers) {
    const index = stored.indexOf(marker);
    if (index >= 0) {
      return stored.slice(index + marker.length).split('?')[0] ?? null;
    }
  }

  return null;
}

/** Normalize a DB value to a storage path before persisting (never store signed/public URLs). */
export function storagePathForPersist(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith('data:')) return value;
  return extractDigitalStoragePath(value) ?? value;
}

/**
 * Uploads a base64 data URL to the private "digitals" bucket and returns the storage path.
 */
export async function uploadDigitalImage(
  base64DataUrl: string,
  path: string,
): Promise<string | null> {
  if (!base64DataUrl || !base64DataUrl.startsWith('data:')) return null;

  const [header, data] = base64DataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg';

  const byteChars = atob(data);
  const byteNums = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNums[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([byteNums], { type: mimeType });

  const ext = mimeType.split('/')[1]?.split('+')[0] ?? 'jpg';
  const fullPath = `${path}.${ext}`;

  const { error } = await supabase.storage
    .from(DIGITALS_BUCKET)
    .upload(fullPath, blob, { upsert: true, contentType: mimeType });

  if (error) {
    console.error('[CastView] uploadDigitalImage error:', error);
    return null;
  }

  return fullPath;
}

export async function getSignedDigitalUrl(
  path: string,
  expiresInSeconds = DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
): Promise<string | null> {
  const storagePath = extractDigitalStoragePath(path) ?? path;
  if (!storagePath) return null;

  const { data, error } = await supabase.storage
    .from(DIGITALS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    console.error('[CastView] getSignedDigitalUrl error:', error);
    return null;
  }

  return data?.signedUrl ?? null;
}

export async function getSignedDigitalUrls(
  paths: string[],
  expiresInSeconds = DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  if (paths.length === 0) return result;

  const uniquePaths = [...new Set(paths.map((p) => extractDigitalStoragePath(p) ?? p).filter(Boolean))];

  const { data, error } = await supabase.storage
    .from(DIGITALS_BUCKET)
    .createSignedUrls(uniquePaths, expiresInSeconds);

  if (error) {
    console.error('[CastView] getSignedDigitalUrls error:', error);
    uniquePaths.forEach((p) => result.set(p, null));
    return result;
  }

  for (const item of data ?? []) {
    const key = item.path ?? '';
    result.set(key, item.signedUrl ?? null);
    for (const original of paths) {
      if ((extractDigitalStoragePath(original) ?? original) === key) {
        result.set(original, item.signedUrl ?? null);
      }
    }
  }

  return result;
}

/** Resolve a stored path or legacy URL to a displayable src (signed URL or data: URL). */
export async function resolveDigitalImageForDisplay(
  stored: string | null | undefined,
): Promise<string | null> {
  if (!stored) return null;
  if (stored.startsWith('data:')) return stored;

  const path = extractDigitalStoragePath(stored);
  if (path) {
    const signed = await getSignedDigitalUrl(path);
    if (signed) return signed;
  }

  if (stored.startsWith('http')) {
    return stored;
  }

  return null;
}

/** Delete an evaluation and its context rows (child rows first). */
export async function deleteEvaluationById(evaluationId: string): Promise<void> {
  const { error: contextDeleteError } = await supabase
    .from('context_evaluations')
    .delete()
    .eq('evaluation_id', evaluationId);

  if (contextDeleteError) {
    console.error('[CastView] deleteEvaluationById context error:', contextDeleteError);
    throw contextDeleteError;
  }

  const { error: evaluationDeleteError } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', evaluationId);

  if (evaluationDeleteError) {
    console.error('[CastView] deleteEvaluationById evaluation error:', evaluationDeleteError);
    throw evaluationDeleteError;
  }
}

/** Delete a single context_evaluation row by id. */
export async function deleteContextEvaluationById(
  contextEvaluationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('context_evaluations')
    .delete()
    .eq('id', contextEvaluationId);

  if (error) {
    console.error('[CastView] deleteContextEvaluationById error:', error);
    throw error;
  }
}

/** Remove evaluations in Supabase that are no longer present on a digital set. */
export async function pruneOrphanedEvaluations(
  digitalSetId: string,
  keptEvaluationIds: string[],
): Promise<void> {
  const { data: existing, error } = await supabase
    .from('evaluations')
    .select('id')
    .eq('digital_set_id', digitalSetId);

  if (error) {
    console.error('[CastView] pruneOrphanedEvaluations lookup error:', error);
    throw error;
  }

  const kept = new Set(keptEvaluationIds);
  const orphaned = (existing ?? [])
    .map((row) => row.id)
    .filter((id) => !kept.has(id));

  if (orphaned.length === 0) return;

  const { error: contextDeleteError } = await supabase
    .from('context_evaluations')
    .delete()
    .in('evaluation_id', orphaned);

  if (contextDeleteError) {
    console.error('[CastView] pruneOrphanedEvaluations context delete error:', contextDeleteError);
    throw contextDeleteError;
  }

  const { error: evalDeleteError } = await supabase
    .from('evaluations')
    .delete()
    .in('id', orphaned);

  if (evalDeleteError) {
    console.error('[CastView] pruneOrphanedEvaluations evaluation delete error:', evalDeleteError);
    throw evalDeleteError;
  }
}

export async function resolveDigitalSetForDisplay(ds: DigitalSet): Promise<DigitalSet> {
  const refs = [ds.front, ds.profile, ds.threeQuarter, ds.fullBody].filter(
    (v): v is string => Boolean(v),
  );
  const signed = await getSignedDigitalUrls(refs);

  const resolveField = (value: string | null | undefined) => {
    if (!value) return null;
    if (value.startsWith('data:')) return value;
    return signed.get(value) ?? signed.get(extractDigitalStoragePath(value) ?? '') ?? null;
  };

  return {
    ...ds,
    front: resolveField(ds.front),
    profile: resolveField(ds.profile),
    threeQuarter: resolveField(ds.threeQuarter),
    fullBody: resolveField(ds.fullBody),
  };
}

export type FetchedEvaluationReport = {
  entityId: string;
  digitalSetId: string;
  agentNotes: string;
  contextEvaluations: StoredContextEvaluation[];
};

type ContextEvaluationRow = {
  context: string;
  alignment_score: number | null;
  fit_label: string | null;
  reasoning: string | null;
  strengths?: string[] | null;
  risks?: string[] | null;
  market_signals?: string[] | null;
  suggested_next_steps?: string[] | null;
};

function mapContextEvaluationRow(row: ContextEvaluationRow): StoredContextEvaluation {
  return {
    context: row.context,
    alignmentScore: row.alignment_score ?? 0,
    fitLabel: row.fit_label ?? '',
    reasoning: row.reasoning ?? '',
    strengths: Array.isArray(row.strengths) ? row.strengths : [],
    risks: Array.isArray(row.risks) ? row.risks : [],
    marketSignals: Array.isArray(row.market_signals) ? row.market_signals : [],
    suggestedNextSteps: Array.isArray(row.suggested_next_steps)
      ? row.suggested_next_steps
      : [],
  };
}

/** Load full evaluation payload from Supabase when browser storage is empty. */
export async function fetchEvaluationReportFromSupabase(
  evaluationId: string,
): Promise<FetchedEvaluationReport | null> {
  const { data: evaluation, error: evalError } = await supabase
    .from('evaluations')
    .select('id, entity_id, digital_set_id, agent_notes')
    .eq('id', evaluationId)
    .maybeSingle();

  if (evalError) {
    console.error('[CastView] fetchEvaluationReportFromSupabase evaluation error:', evalError);
    throw evalError;
  }

  if (!evaluation) return null;

  const { data: contextRows, error: ctxError } = await supabase
    .from('context_evaluations')
    .select(
      'context, alignment_score, fit_label, reasoning, strengths, risks, market_signals, suggested_next_steps',
    )
    .eq('evaluation_id', evaluationId);

  if (ctxError) {
    console.error('[CastView] fetchEvaluationReportFromSupabase context error:', ctxError);
    throw ctxError;
  }

  if (!contextRows?.length) return null;

  return {
    entityId: evaluation.entity_id,
    digitalSetId: evaluation.digital_set_id,
    agentNotes: evaluation.agent_notes ?? '',
    contextEvaluations: contextRows.map((row) =>
      mapContextEvaluationRow(row as ContextEvaluationRow),
    ),
  };
}

/** Write evaluation + full per-context rows directly to Supabase. */
export async function upsertEvaluationWithContexts(params: {
  agencyId: string;
  entityId: string;
  evaluationId: string;
  digitalSetId: string;
  contextEvaluations: StoredContextEvaluation[];
  agentNotes?: string;
  completedAt?: string;
}): Promise<void> {
  const {
    agencyId,
    entityId,
    evaluationId,
    digitalSetId,
    contextEvaluations,
    agentNotes = '',
    completedAt,
  } = params;

  const { error: evalError } = await supabase.from('evaluations').upsert({
    id: evaluationId,
    digital_set_id: digitalSetId,
    entity_id: entityId,
    agency_id: agencyId,
    completed_at: completedAt ?? new Date().toISOString(),
    agent_notes: agentNotes,
  });

  if (evalError) {
    console.error('[CastView] upsertEvaluationWithContexts evaluation error:', evalError);
    throw evalError;
  }

  for (const ctx of contextEvaluations) {
    const { error: ctxError } = await supabase.from('context_evaluations').upsert(
      {
        evaluation_id: evaluationId,
        context: ctx.context,
        alignment_score: ctx.alignmentScore,
        fit_label: ctx.fitLabel,
        reasoning: ctx.reasoning,
        strengths: ctx.strengths ?? [],
        risks: ctx.risks ?? [],
        market_signals: ctx.marketSignals ?? [],
        suggested_next_steps: ctx.suggestedNextSteps ?? [],
      },
      { onConflict: 'evaluation_id,context' },
    );

    if (ctxError) {
      console.error('[CastView] upsertEvaluationWithContexts context error:', ctxError);
      throw ctxError;
    }
  }
}
