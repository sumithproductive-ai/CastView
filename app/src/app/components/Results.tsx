import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  createCastviewPdf,
  PDF_COLORS,
  pdfBody,
  pdfBullet,
  pdfCheckBreak,
  pdfDrawAgentNotesBox,
  pdfDrawContextBar,
  pdfDrawDisclaimer,
  pdfDrawHeader,
  pdfDrawMetaRow,
  pdfDrawPageNumbers,
  pdfDrawPreparedBy,
  pdfDrawProspectSection,
  pdfDrawScoreBar,
  pdfHr,
  pdfLabel,
  pdfSave,
  pdfSafeText,
} from '../../lib/castviewPdf';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import { getContextData } from '../constants/contextMockData';
import { getSumithDigitalSetV1, isSumithProspect } from '../constants/sumithProspect';
import { useAuth } from '../context/AuthContext';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import type { DigitalSet } from '../types/talent';
import { authFetch } from '../../lib/apiAuth';
import {
  deleteContextEvaluationById,
  deleteEvaluationById,
  fetchEvaluationReportFromSupabase,
  supabase,
} from '../../lib/supabase';
import { DigitalImage } from './DigitalImage';
import {
  clearEvaluationStorage,
  clearHandoffStorage,
  EVALUATION_ERROR_KEY,
  loadEvaluationReport,
  type StoredEvaluationReport,
  updateEvaluationNotes,
} from '../utils/evaluationStorage';
import {
  isEvaluationPersisted,
  persistEvaluationToSupabase,
} from '../utils/evaluationPersist';
import {
  getPathwayForContext,
  loadPathwaysForEvaluation,
  savePathwayForContext,
  type StoredDevelopmentPathway,
} from '../utils/pathwayStorage';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from './ui/dialog';

const DIGITAL_STRIP = [
  { key: 'front' as const, label: 'FRONT' },
  { key: 'profile' as const, label: 'PROFILE' },
  { key: 'threeQuarter' as const, label: '3/4' },
  { key: 'fullBody' as const, label: 'FULL BODY' },
];

const evaluationData = {
  overallSummary:
    'Strong contextual alignment across luxury and editorial contexts based on uploaded digitals.',
  progressionComparison: {
    summary: 'First evaluation — no previous digitals to compare.',
    improvedContexts: [],
    weakenedContexts: [],
    reasoning:
      'Upload a second set of digitals to enable progression analysis.',
  },
};

const evalBodyTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  color: 'var(--cv-primary-text)',
  lineHeight: 1.6,
};

function ContextArrowList({
  items,
  body = false,
}: {
  items: string[];
  body?: boolean;
}) {
  return (
    <>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            fontFamily: body ? 'var(--font-body)' : 'var(--font-mono)',
            fontSize: '11px',
            color: body ? 'var(--cv-primary-text)' : 'var(--cv-secondary-text)',
            lineHeight: body ? 1.6 : undefined,
            marginBottom: '6px',
          }}
        >
          → {item}
        </div>
      ))}
    </>
  );
}

function ContextScoreBar({
  isOpen,
  displayScore,
}: {
  isOpen: boolean;
  displayScore: number | null;
}) {
  const [animateScore, setAnimateScore] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAnimateScore(false);
      return;
    }

    const timer = window.setTimeout(() => setAnimateScore(true), 100);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  return (
    <div
      className="h-[2px] bg-[var(--cv-subtle-border)] rounded-full overflow-hidden"
      style={{ width: '80px' }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: animateScore ? `${displayScore ?? 0}%` : '0%',
          backgroundColor: '#C8A96E',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '0.1s',
        }}
      />
    </div>
  );
}

function normalizePathwayContext(context: string): string {
  return context.trim().toLowerCase();
}

type DevelopmentPathwayModalProps = {
  open: boolean;
  context: string | null;
  note: string;
  onNoteChange: (note: string) => void;
  pathway: StoredDevelopmentPathway | null;
  loading: boolean;
  error: string | null | undefined;
  onClose: () => void;
  onGenerate: () => void;
};

function DevelopmentPathwayModal({
  open,
  context,
  note,
  onNoteChange,
  pathway,
  loading,
  error,
  onClose,
  onGenerate,
}: DevelopmentPathwayModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        hideClose
        overlayClassName="bg-[var(--cv-background)]/75 backdrop-blur-sm"
        className="flex w-[calc(100%-2rem)] max-w-[680px] max-h-[80vh] flex-col gap-0 overflow-hidden rounded-[4px] border border-[var(--cv-subtle-border)] bg-[var(--cv-surface)] p-0 shadow-lg"
      >
        <div className="flex shrink-0 items-center gap-[16px] border-b border-[var(--cv-subtle-border)] px-[20px] py-[16px]">
          <DialogClose
            className="flex h-[36px] w-[36px] items-center justify-center rounded-[4px] border border-[var(--cv-subtle-border)] bg-[var(--cv-elevated)] text-[var(--cv-primary-text)] transition-opacity hover:opacity-80 focus:outline-none"
            aria-label="Close development pathway"
          >
            <ArrowLeft size={18} />
          </DialogClose>
          <div>
            <DialogTitle
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: '#C8A96E',
                fontWeight: 400,
              }}
            >
              Development Pathway
            </DialogTitle>
            {context && (
              <p
                className="mt-[4px] text-[11px]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cv-secondary-text)',
                }}
              >
                {context} · AI Coaching
              </p>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[20px] py-[24px]">
          <div
            className="mb-[8px] uppercase tracking-[0.1em]"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--cv-secondary-text)',
            }}
          >
            Your notes
          </div>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={
              context
                ? `e.g. "Strong bone structure — I think they have potential for ${context} but needs work on posture and styling direction."`
                : 'Add notes about this prospect in this context...'
            }
            rows={4}
            className="mb-[16px] w-full resize-none rounded-[4px] border border-[var(--cv-subtle-border)] bg-[var(--cv-background)] px-[12px] py-[10px]"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--cv-primary-text)',
              lineHeight: 1.6,
            }}
          />

          {!pathway && !loading && (
            <button
              type="button"
              onClick={onGenerate}
              className="mb-[24px] w-full rounded-[4px] border border-[#C8A96E] bg-transparent py-[12px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#C8A96E] hover:text-[var(--cv-background)]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: '#C8A96E',
                cursor: 'pointer',
              }}
            >
              Generate development pathway
            </button>
          )}

          {pathway && !loading && (
            <button
              type="button"
              onClick={onGenerate}
              className="mb-[24px] w-full rounded-[4px] border border-[var(--cv-subtle-border)] bg-transparent py-[10px] text-[10px] uppercase tracking-[0.1em] transition-colors hover:border-[#C8A96E] hover:text-[#C8A96E]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--cv-secondary-text)',
                cursor: 'pointer',
              }}
            >
              Regenerate pathway
            </button>
          )}

          {(loading || pathway || error) && (
            <div className="border-t border-[var(--cv-subtle-border)] pt-[20px]">
              <div
                className="mb-[12px] uppercase tracking-[0.1em]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: 'var(--cv-secondary-text)',
                }}
              >
                Development recommendations
              </div>

              {pathway && !loading && (
                <div
                  className="mb-[16px] text-[11px]"
                  style={evalBodyTextStyle}
                >
                  Based on the uploaded digitals and your notes, here is a suggested
                  development pathway for {context} alignment:
                </div>
              )}

              {loading && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--cv-secondary-text)',
                    padding: '16px 0',
                  }}
                >
                  Generating pathway...
                </div>
              )}

              {error && !loading && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: '#c87a7a',
                    padding: '8px 0',
                  }}
                >
                  {error}
                </div>
              )}

              {pathway && !loading && (
                <>
                  {pathway.summary && (
                    <p
                      style={{
                        ...evalBodyTextStyle,
                        fontSize: '11px',
                        marginBottom: '16px',
                      }}
                    >
                      {pathway.summary}
                    </p>
                  )}
                  {pathway.sections.map((section) => (
                    <div key={section.label} className="mb-[14px]">
                      <div
                        className="mb-[6px] text-[8px] uppercase tracking-[0.1em]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: '#C8A96E',
                        }}
                      >
                        {section.label}
                      </div>
                      {section.items.map((item, i) => (
                        <div
                          key={i}
                          className="mb-[4px]"
                          style={{
                            ...evalBodyTextStyle,
                            fontSize: '11px',
                          }}
                        >
                          → {item}
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Results() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agencyId } = useAuth();
  const { prospects, updateProspect } = useProspects();
  const { models, updateModel, getModelById } = useRoster();
  const { getProspectById } = useProspects();
  const [realEvalData, setRealEvalData] = useState<any>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [devSumithDigitalSet, setDevSumithDigitalSet] = useState<DigitalSet | null>(null);
  const prospectName = searchParams.get('name')
    ? decodeURIComponent(searchParams.get('name')!)
    : 'Prospect';
  const contextsParam = searchParams.get('contexts') || '';
  const selectedContexts = useMemo(
    () => contextsParam.split(',').filter(Boolean),
    [contextsParam],
  );
  const profileType = searchParams.get('profileType') || 'prospect';
  const prospectId = searchParams.get('prospectId') || '';
  const evaluationId = searchParams.get('evaluationId') || '';
  const digitalSetId = searchParams.get('digitalSetId') || '';

  useEffect(() => {
    let cancelled = false;

    const errorStored = sessionStorage.getItem(EVALUATION_ERROR_KEY);
    if (errorStored) {
      setEvaluationError(errorStored);
      sessionStorage.removeItem(EVALUATION_ERROR_KEY);
    }

    const stored = loadEvaluationReport(evaluationId);
    if (stored) {
      setRealEvalData(stored);
      if (stored.agentNotes) setAgentNotes(stored.agentNotes);
      clearHandoffStorage();
      return;
    }

    if (!evaluationId) return;

    (async () => {
      try {
        const fromDb = await fetchEvaluationReportFromSupabase(evaluationId);
        if (cancelled || !fromDb) return;

        setRealEvalData({
          evaluationId,
          prospectName,
          prospectId: prospectId || fromDb.entityId,
          contextsParam:
            contextsParam ||
            fromDb.contextEvaluations.map((entry) => entry.context).join(','),
          profileType,
          contextEvaluations: fromDb.contextEvaluations,
          unavailableContexts: [],
          updatedAt: new Date().toISOString(),
          agentNotes: fromDb.agentNotes,
        });
        if (fromDb.agentNotes) setAgentNotes(fromDb.agentNotes);
        setEvalSaved(true);
      } catch (err) {
        console.error('[Results] failed to load evaluation from Supabase:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [evaluationId, prospectName, prospectId, contextsParam, profileType]);

  useEffect(() => {
    if (!evaluationId || !prospectId) return;
    if (profileType === 'model') {
      const model = getModelById(prospectId) ?? models.find((m) => m.id === prospectId);
      if (isEvaluationPersisted(model?.digitalSets, evaluationId)) {
        setEvalSaved(true);
      }
    } else {
      const prospect = getProspectById(prospectId) ?? prospects.find((p) => p.id === prospectId);
      if (isEvaluationPersisted(prospect?.digitalSets, evaluationId)) {
        setEvalSaved(true);
      }
    }
  }, [evaluationId, prospectId, profileType, prospects, models, getProspectById, getModelById]);

  useEffect(() => {
    if (!evaluationId) return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('evaluations')
        .select('booker_override, booker_feedback')
        .eq('id', evaluationId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('[Results] failed to load booker override:', error.message);
        if (
          error.message.includes('booker_override') ||
          error.code === '42703'
        ) {
          setOverrideSaveError(
            'Override column missing — apply Manual Task 4 migration',
          );
        }
        return;
      }

      if (data?.booker_feedback === 'confirmed') {
        setAgreed(true);
        setShowOverride(false);
      } else if (data?.booker_feedback === 'overridden') {
        setAgreed(false);
        setShowOverride(true);
      }

      if (data?.booker_override) {
        setOverrideText(data.booker_override);
        setShowOverride(true);
        setAgreed(false);
        setOverrideSaved(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [evaluationId]);

  useEffect(() => {
    if (!import.meta.env.DEV || !isSumithProspect(prospectId, prospectName)) {
      setDevSumithDigitalSet(null);
      return;
    }
    let cancelled = false;
    getSumithDigitalSetV1().then((set) => {
      if (!cancelled) setDevSumithDigitalSet(set);
    });
    return () => {
      cancelled = true;
    };
  }, [prospectId, prospectName]);

  const hasRealEvaluation = Boolean(realEvalData?.contextEvaluations?.length);
  const allowDevMock = import.meta.env.DEV && !hasRealEvaluation && !evaluationError;
  const unavailableContexts: string[] = realEvalData?.unavailableContexts ?? [];

  const isContextUnavailable = (context: string) =>
    unavailableContexts.some(
      (entry) => entry.toLowerCase() === context.toLowerCase(),
    );

  const digitalSet: DigitalSet | null = useMemo(() => {
    const prospect = prospects.find(
      (p) =>
        (prospectId && p.id === prospectId) ||
        p.name.trim().toLowerCase() === prospectName.trim().toLowerCase()
    );
    if (prospect?.digitalSets?.length) {
      return prospect.digitalSets[0];
    }
    if (import.meta.env.DEV && isSumithProspect(prospectId, prospectName)) {
      return devSumithDigitalSet;
    }
    return null;
  }, [prospects, prospectId, prospectName, devSumithDigitalSet]);

  const [displayContexts, setDisplayContexts] = useState<string[]>([]);
  const [contextEvaluationIds, setContextEvaluationIds] = useState<Record<string, string>>({});
  const [allContextsRemovedMessage, setAllContextsRemovedMessage] = useState<string | null>(null);
  const [deletingEvaluation, setDeletingEvaluation] = useState(false);
  const [deleteEvalError, setDeleteEvalError] = useState<string | null>(null);
  const [removingContext, setRemovingContext] = useState<string | null>(null);
  const [contextRemoveError, setContextRemoveError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayContexts(selectedContexts);
    setAllContextsRemovedMessage(null);
  }, [selectedContexts]);

  useEffect(() => {
    if (!evaluationId) {
      setContextEvaluationIds({});
      return;
    }

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('context_evaluations')
        .select('id, context')
        .eq('evaluation_id', evaluationId);

      if (cancelled || error) {
        if (error) {
          console.error('[Results] failed to load context_evaluation ids:', error.message);
        }
        return;
      }

      const idMap: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.id && row.context) {
          idMap[row.context.toLowerCase()] = row.id;
        }
      }
      setContextEvaluationIds(idMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [evaluationId]);

  const contextResults = useMemo(() => {
    const mockScores = [94, 91, 88, 88, 87, 85, 82, 86, 89];
    return displayContexts.map((ctx, i) => {
      const real = realEvalData?.contextEvaluations?.find(
        (e: any) => e.context.toLowerCase() === ctx.toLowerCase(),
      );
      let score: number | null = null;
      if (typeof real?.alignmentScore === 'number') {
        score = real.alignmentScore;
      } else if (allowDevMock) {
        score = mockScores[i % mockScores.length];
      }
      return {
        id: i + 1,
        context: ctx,
        score,
      };
    });
  }, [displayContexts, realEvalData, allowDevMock]);

  const [openContext, setOpenContext] = useState<string | null>(null);
  const [pathwaysByContext, setPathwaysByContext] = useState<
    Record<string, StoredDevelopmentPathway>
  >({});
  const [pathwayModalContext, setPathwayModalContext] = useState<string | null>(null);
  const [pathwayNotesByContext, setPathwayNotesByContext] = useState<
    Record<string, string>
  >({});
  const [pathwayLoadingContext, setPathwayLoadingContext] = useState<string | null>(
    null,
  );
  const [pathwayErrorByContext, setPathwayErrorByContext] = useState<
    Record<string, string>
  >({});
  const [showOverride, setShowOverride] = useState(false);
  const [overrideText, setOverrideText] = useState('');
  const [overrideSaved, setOverrideSaved] = useState(false);
  const [savingOverride, setSavingOverride] = useState(false);
  const [overrideSaveError, setOverrideSaveError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [agentNotes, setAgentNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [evalSaved, setEvalSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingEval, setSavingEval] = useState(false);

  useEffect(() => {
    if (!evaluationId) {
      setPathwaysByContext({});
      setPathwayNotesByContext({});
      return;
    }

    const stored = loadPathwaysForEvaluation(evaluationId);
    setPathwaysByContext(stored);

    const notes: Record<string, string> = {};
    for (const [ctx, pathway] of Object.entries(stored)) {
      notes[ctx] = pathway.agentNote;
    }
    setPathwayNotesByContext(notes);
  }, [evaluationId]);

  const generatePathway = async (context: string) => {
    if (pathwayLoadingContext) return;

    const contextKey = normalizePathwayContext(context);
    const note = pathwayNotesByContext[contextKey] ?? '';

    setPathwayModalContext(context);
    setPathwayLoadingContext(context);
    setPathwayErrorByContext((prev) => {
      const next = { ...prev };
      delete next[contextKey];
      return next;
    });

    try {
      const contextData = realEvalData?.contextEvaluations?.find(
        (e: { context: string }) =>
          e.context.toLowerCase() === context.toLowerCase(),
      );
      const response = await authFetch('/api/pathway', {
        method: 'POST',
        body: JSON.stringify({
          prospectName,
          context,
          alignmentScore: contextData?.alignmentScore ?? 0,
          agentNote: note || 'No additional notes provided.',
        }),
      });

      if (response.status === 402) {
        setPathwayErrorByContext((prev) => ({
          ...prev,
          [contextKey]: 'Trial ended — choose a plan to continue.',
        }));
        return;
      }

      const data = await response.json();
      if (response.ok && data.sections) {
        const stored: StoredDevelopmentPathway = {
          sections: data.sections,
          summary: data.summary,
          agentNote: note,
          generatedAt: new Date().toISOString(),
        };
        setPathwaysByContext((prev) => ({ ...prev, [contextKey]: stored }));
        if (evaluationId) {
          savePathwayForContext(evaluationId, context, stored);
        }
      } else {
        setPathwayErrorByContext((prev) => ({
          ...prev,
          [contextKey]: 'Unable to generate pathway. Try again.',
        }));
      }
    } catch {
      setPathwayErrorByContext((prev) => ({
        ...prev,
        [contextKey]: 'Unable to generate pathway. Try again.',
      }));
    } finally {
      setPathwayLoadingContext(null);
    }
  };

  const removeEvaluationFromEntityState = async () => {
    if (!evaluationId) return;

    if (profileType === 'model') {
      const model =
        models.find(
          (m) =>
            m.id === prospectId ||
            m.name.trim().toLowerCase() === prospectName.trim().toLowerCase(),
        ) ?? getModelById(prospectId);

      if (!model) return;

      const updatedSets = model.digitalSets.map((ds) => ({
        ...ds,
        evaluations: (ds.evaluations ?? []).filter((e) => e.id !== evaluationId),
      }));
      await updateModel(model.id, { digitalSets: updatedSets });
      return;
    }

    if (!prospectId) return;
    const prospect = prospects.find((p) => p.id === prospectId) ?? getProspectById(prospectId);
    if (!prospect) return;

    const updatedSets = prospect.digitalSets.map((ds) => ({
      ...ds,
      evaluations: (ds.evaluations ?? []).filter((e) => e.id !== evaluationId),
    }));
    await updateProspect(prospectId, { digitalSets: updatedSets });
  };

  const removeContextFromEntityState = async (context: string) => {
    if (!evaluationId) return;

    const filterEvaluationContexts = (sets: DigitalSet[]) =>
      sets.map((ds) => ({
        ...ds,
        evaluations: (ds.evaluations ?? []).map((evaluation) =>
          evaluation.id !== evaluationId
            ? evaluation
            : {
                ...evaluation,
                contexts: evaluation.contexts.filter(
                  (ctx) => ctx.context.toLowerCase() !== context.toLowerCase(),
                ),
              },
        ),
      }));

    if (profileType === 'model') {
      const model =
        models.find((m) => m.id === prospectId) ??
        getModelById(prospectId);
      if (!model) return;
      await updateModel(model.id, { digitalSets: filterEvaluationContexts(model.digitalSets) });
      return;
    }

    const prospect = prospects.find((p) => p.id === prospectId) ?? getProspectById(prospectId);
    if (!prospect) return;
    await updateProspect(prospectId, { digitalSets: filterEvaluationContexts(prospect.digitalSets) });
  };

  const handleDeleteEvaluation = async () => {
    if (!evaluationId || deletingEvaluation) return;
    if (!window.confirm('Delete this evaluation? This cannot be undone.')) return;

    setDeletingEvaluation(true);
    setDeleteEvalError(null);

    try {
      await deleteEvaluationById(evaluationId);
      try {
        await removeEvaluationFromEntityState();
      } catch (stateError) {
        console.warn('[Results] local state cleanup after delete failed:', stateError);
      }
      clearEvaluationStorage(evaluationId);
      if (!prospectId) {
        throw new Error('Missing prospect reference for navigation');
      }
      navigate(
        profileType === 'model' ? `/roster/${prospectId}` : `/prospects/${prospectId}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete evaluation';
      console.error('[Results] delete evaluation error:', error);
      setDeleteEvalError(message);
    } finally {
      setDeletingEvaluation(false);
    }
  };

  const handleRemoveContext = async (context: string) => {
    if (!evaluationId || removingContext) return;
    if (!window.confirm(`Remove ${context} from this evaluation?`)) return;

    setRemovingContext(context);
    setContextRemoveError(null);
    setAllContextsRemovedMessage(null);

    try {
      const persisted = isEvaluationPersisted(
        profileType === 'model'
          ? getModelById(prospectId)?.digitalSets
          : getProspectById(prospectId)?.digitalSets,
        evaluationId,
      );

      const contextEvaluationId = contextEvaluationIds[context.toLowerCase()];
      if (contextEvaluationId) {
        await deleteContextEvaluationById(contextEvaluationId);
      } else if (evalSaved || persisted) {
        const { error: fallbackDeleteError } = await supabase
          .from('context_evaluations')
          .delete()
          .eq('evaluation_id', evaluationId)
          .eq('context', context);
        if (fallbackDeleteError) {
          throw fallbackDeleteError;
        }
      }

      if (evalSaved || persisted) {
        await removeContextFromEntityState(context);
      }

      setRealEvalData((prev: StoredEvaluationReport | null) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          contextEvaluations: prev.contextEvaluations.filter(
            (entry) => entry.context.toLowerCase() !== context.toLowerCase(),
          ),
          updatedAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem(`castview_eval_${evaluationId}`, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });

      setDisplayContexts((prev) => {
        const next = prev.filter(
          (entry) => entry.toLowerCase() !== context.toLowerCase(),
        );
        if (next.length === 0) {
          setAllContextsRemovedMessage(
            'All contexts removed. Delete the full evaluation or run a new one.',
          );
        }
        return next;
      });

      setContextEvaluationIds((prev) => {
        const next = { ...prev };
        delete next[context.toLowerCase()];
        return next;
      });

      if (openContext === context) {
        setOpenContext(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to remove context';
      console.error('[Results] remove context error:', error);
      setContextRemoveError(message);
    } finally {
      setRemovingContext(null);
    }
  };

  const getEvalData = (context: string) => {
    if (isContextUnavailable(context)) {
      return null;
    }
    if (realEvalData?.contextEvaluations) {
      const real = realEvalData.contextEvaluations.find(
        (e: any) => e.context.toLowerCase() === context.toLowerCase(),
      );
      if (real) return real;
    }
    if (allowDevMock) {
      const mock = getContextData(context);
      return { ...mock, alignmentScore: mock.score };
    }
    return null;
  };

  const generatePDF = () => {
    const prospectMeta = prospects.find(
      (p) =>
        (prospectId && p.id === prospectId) ||
        p.name.trim().toLowerCase() === prospectName.trim().toLowerCase(),
    );

    const pdf = createCastviewPdf();
    pdfDrawHeader(pdf);
    pdfDrawProspectSection(pdf, prospectName);

    const metaItems: string[] = [];
    if (prospectMeta?.source) metaItems.push(`Source: ${prospectMeta.source}`);
    if (prospectMeta?.division) metaItems.push(`Division: ${prospectMeta.division}`);
    if (prospectMeta?.height) metaItems.push(`Height: ${prospectMeta.height}`);
    if (prospectMeta?.markets?.length) {
      metaItems.push(`Markets: ${prospectMeta.markets.join(', ')}`);
    }
    if (realEvalData?.updatedAt) {
      const evalDate = new Date(realEvalData.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      metaItems.push(`Evaluated: ${evalDate}`);
    }
    metaItems.push(`Contexts: ${selectedContexts.join(', ')}`);
    pdfDrawMetaRow(pdf, metaItems);
    pdfHr(pdf);

    contextResults.forEach((result) => {
      const data = getEvalData(result.context);
      const score =
        data?.alignmentScore ??
        (typeof result.score === 'number' ? result.score : null);
      if (!data || score == null) return;

      pdfCheckBreak(pdf, 60);
      pdfDrawContextBar(pdf, result.context, `${score}% ${data.fitLabel}`);
      pdfDrawScoreBar(pdf, score);

      let contentY = pdf.y;
      pdfLabel(pdf, 'Reasoning', pdf.margin, contentY);
      contentY += 4;
      contentY += pdfBody(pdf, data.reasoning, pdf.margin, contentY, pdf.fullW) + 4;

      const leftX = pdf.margin;
      const rightX = pdf.margin + pdf.colW + 8;
      let leftY = contentY;
      let rightY = contentY;

      pdfLabel(pdf, 'Strengths', leftX, leftY, PDF_COLORS.success);
      leftY += 4;
      data.strengths.forEach((s: string) => {
        leftY += pdfBullet(pdf, s, leftX, leftY, pdf.colW) + 1;
      });
      leftY += 4;

      if (data.risks?.length > 0) {
        pdfLabel(pdf, 'Risks', leftX, leftY, PDF_COLORS.risk);
        leftY += 4;
        data.risks.forEach((r: string) => {
          leftY += pdfBullet(pdf, r, leftX, leftY, pdf.colW) + 1;
        });
      }

      pdfLabel(pdf, 'Market Signals', rightX, rightY);
      rightY += 4;
      data.marketSignals.forEach((m: string) => {
        rightY += pdfBullet(pdf, m, rightX, rightY, pdf.colW) + 1;
      });
      rightY += 4;

      pdfLabel(pdf, 'Suggested Next Steps', rightX, rightY);
      rightY += 4;
      data.suggestedNextSteps.forEach((s: string) => {
        rightY += pdfBullet(pdf, s, rightX, rightY, pdf.colW) + 1;
      });

      pdf.y = Math.max(leftY, rightY) + 6;
      pdf.doc.setDrawColor(...PDF_COLORS.line);
      pdf.doc.line(pdf.margin, pdf.y, pdf.pageW - pdf.margin, pdf.y);
      pdf.y += 6;
    });

    pdfCheckBreak(pdf, 28);
    pdfDrawAgentNotesBox(pdf, agentNotes);
    pdfDrawDisclaimer(pdf);
    pdfDrawPreparedBy(pdf);
    pdfDrawPageNumbers(pdf);
    pdfSave(pdf, `CastView-${pdfSafeText(prospectName)}-Evaluation.pdf`);
  };
  
  return (
    <div className="p-[20px] md:p-[48px] pb-[96px] md:pb-[120px] overflow-x-hidden">
      <div className="flex flex-col gap-[16px] sm:flex-row sm:justify-between sm:items-center mb-[24px]">
        <div>
          <button
            type="button"
            onClick={() => navigate(profileType === 'model' ? '/roster' : '/prospects')}
            className="hover:opacity-70 transition-opacity cursor-pointer"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--cv-secondary-text)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              backgroundColor: 'transparent',
              border: 'none',
              padding: 0,
            }}
          >
            {profileType === 'model' ? '← BACK TO ROSTER' : '← BACK TO PROSPECTS'}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleDeleteEvaluation();
            }}
            disabled={!evaluationId || deletingEvaluation}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#c87a7a',
              background: 'none',
              border: 'none',
              cursor: deletingEvaluation || !evaluationId ? 'default' : 'pointer',
              letterSpacing: '0.05em',
              padding: 0,
              textTransform: 'uppercase' as const,
              display: 'block',
              marginTop: '8px',
              opacity: deletingEvaluation || !evaluationId ? 0.6 : 1,
            }}
          >
            {deletingEvaluation ? 'DELETING...' : 'DELETE EVALUATION'}
          </button>
          {deleteEvalError && (
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#c87a7a',
                marginTop: '6px',
              }}
            >
              {deleteEvalError}
            </p>
          )}
        </div>

        <button
          type="button"
          className="cv-btn-primary"
          onClick={async () => {
            if (evalSaved || savingEval || !hasRealEvaluation || !prospectId || !evaluationId) return;

            setSavingEval(true);
            setSaveError(null);

            try {
              if (!agencyId) {
                throw new Error('Missing agency context');
              }

              const synced = await persistEvaluationToSupabase({
                agencyId,
                profileType,
                entityId: prospectId,
                evaluationId,
                contextEvaluations: realEvalData?.contextEvaluations ?? [],
                targetDigitalSetId: digitalSetId || undefined,
                agentNotes: agentNotes ?? '',
                getProspectById,
                updateProspect,
                getModelById,
                updateModel,
              });

              if (!synced) {
                throw new Error('No digital set found for this prospect');
              }
              setEvalSaved(true);
            } catch (err) {
              const message =
                err instanceof Error ? err.message : 'Failed to save evaluation';
              console.error('[CastView] save evaluation error:', err);
              setSaveError(message);
            } finally {
              setSavingEval(false);
            }
          }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: evalSaved ? '#4a7a4a' : saveError ? '#c87a7a' : 'var(--cv-primary-text)',
            background: 'none',
            border: `1px solid ${evalSaved ? '#4a7a4a' : saveError ? '#c87a7a' : 'var(--cv-subtle-border)'}`,
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: evalSaved || savingEval ? 'default' : 'pointer',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {evalSaved ? '✓ SAVED' : savingEval ? 'SAVING…' : saveError ? 'SAVE FAILED — RETRY' : 'SAVE EVALUATION'}
        </button>

        <div className="flex gap-[12px]">
          <button
            type="button"
            onClick={generatePDF}
            className="cv-btn-primary border border-[var(--cv-subtle-border)] bg-transparent rounded-[4px] px-[20px] py-[10px] text-[11px] uppercase tracking-[0.1em] hover:border-[var(--cv-primary-text)] hover:text-[var(--cv-primary-text)] transition-colors"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--cv-secondary-text)',
              cursor: 'pointer',
            }}
          >
            EXPORT PDF
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(
                profileType === 'model'
                  ? `/roster/${prospectId}`
                  : `/prospects/${prospectId}`,
              )
            }
            className="bg-[var(--cv-primary-text)] text-[var(--cv-background)] rounded-[4px] px-[20px] py-[10px] text-[11px] uppercase tracking-[0.1em] hover:opacity-80 transition-opacity"
            style={{
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            SHARE
          </button>
        </div>
      </div>

      <h1 
        className="text-[48px] mb-[12px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
      >
        {prospectName} — Context Alignment Report
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--cv-secondary-text)',
          letterSpacing: '0.05em',
          marginBottom: '36px',
        }}
      >
        AI-generated context alignment. Decision-support only — not a casting decision or a judgment of the individual.
      </p>

      {evaluationError && (
        <div
          className="mb-[32px]"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: '#b9b9b2',
          }}
        >
          {evaluationError}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[32px] lg:gap-[48px]">
        {/* Digitals strip + context dropdowns */}
        <div>
          <div className="flex flex-row gap-[12px] w-full mb-[32px] overflow-x-auto pb-[4px]">
            {DIGITAL_STRIP.map(({ key, label }) => {
              const src = digitalSet?.[key] ?? null;
              return (
                <div key={key} className="flex-1">
                  <div className="aspect-[3/4] overflow-hidden rounded-[4px] bg-[var(--cv-surface)]">
                    {src ? (
                      <DigitalImage
                        storageRef={src}
                        alt={label}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--cv-elevated)]" />
                    )}
                  </div>
                  <div
                    className="mt-[8px] uppercase"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color: 'var(--cv-secondary-text)',
                    }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {allContextsRemovedMessage && (
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#b9b9b2',
                marginBottom: '16px',
              }}
            >
              {allContextsRemovedMessage}
            </p>
          )}

          {contextRemoveError && (
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#c87a7a',
                marginBottom: '16px',
              }}
            >
              {contextRemoveError}
            </p>
          )}

          {contextResults.map((result) => {
            const data = getEvalData(result.context);
            const unavailable = isContextUnavailable(result.context);
            const displayScore =
              data?.alignmentScore ??
              (typeof result.score === 'number' ? result.score : null);
            const isOpen = openContext === result.context;
            return (
              <div key={result.context}>
                <div
                  className={`w-full bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] px-[24px] py-[16px] mb-[8px] flex justify-between items-center ${
                    isOpen ? 'rounded-t-[4px] rounded-b-none border-b-0' : 'rounded-[4px]'
                  }`}
                  style={{ transition: 'background-color 0.2s ease' }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpenContext(isOpen ? null : result.context);
                    }}
                    className="flex flex-1 justify-between items-center text-left hover:bg-[var(--cv-elevated)]"
                    style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px',
                        color: 'var(--cv-primary-text)',
                        fontWeight: 300,
                      }}
                    >
                      {result.context}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: '#C8A96E',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {displayScore != null && data
                        ? `${displayScore}%  ${data.fitLabel}`
                        : unavailable
                          ? 'UNAVAILABLE'
                          : '—'}
                    </span>
                    <div className="flex items-center gap-[12px]">
                      <ContextScoreBar isOpen={isOpen} displayScore={displayScore} />
                      <ChevronDown
                        size={14}
                        style={{
                          color: 'var(--cv-secondary-text)',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease',
                        }}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleRemoveContext(result.context);
                      }}
                      disabled={removingContext === result.context}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: 'var(--cv-secondary-text)',
                        background: 'none',
                        border: 'none',
                        cursor: removingContext === result.context ? 'default' : 'pointer',
                        marginLeft: '12px',
                        padding: 0,
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        if (removingContext !== result.context) {
                          e.currentTarget.style.color = '#c87a7a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--cv-secondary-text)';
                      }}
                    >
                      {removingContext === result.context ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="bg-[var(--cv-background)] border border-t-0 border-[var(--cv-subtle-border)] rounded-b-[4px] mb-[8px]">
                    <div className="cv-eval-panel-body px-[24px] py-[20px] pb-[32px]">
                    {!data ? (
                      <p
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          color: '#b9b9b2',
                        }}
                      >
                        {unavailable
                          ? 'This context is temporarily unavailable.'
                          : evaluationError ||
                            'Evaluation temporarily unavailable.'}
                      </p>
                    ) : (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[32px]">
                      <div>
                        <div
                          className="uppercase mb-[8px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: 'var(--cv-secondary-text)',
                            letterSpacing: '0.1em',
                          }}
                        >
                          REASONING
                        </div>
                        <p
                          className="mb-[20px]"
                          style={{
                            ...evalBodyTextStyle,
                            fontSize: '12px',
                          }}
                        >
                          {data.reasoning}
                        </p>

                        <div
                          className="uppercase mb-[8px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: '#4a7a4a',
                            letterSpacing: '0.1em',
                          }}
                        >
                          STRENGTHS
                        </div>
                        <ContextArrowList items={data.strengths} body />

                        <div
                          className="uppercase mb-[8px] mt-[16px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: '#c87a7a',
                            letterSpacing: '0.1em',
                          }}
                        >
                          RISKS
                        </div>
                        <ContextArrowList items={data.risks} body />
                      </div>

                      <div>
                        <div
                          className="uppercase mb-[8px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: 'var(--cv-secondary-text)',
                            letterSpacing: '0.1em',
                          }}
                        >
                          MARKET SIGNALS
                        </div>
                        <ContextArrowList items={data.marketSignals} />

                        <div
                          className="uppercase mb-[8px] mt-[16px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: 'var(--cv-secondary-text)',
                            letterSpacing: '0.1em',
                          }}
                        >
                          SUGGESTED NEXT STEPS
                        </div>
                        <ContextArrowList items={data.suggestedNextSteps} />
                      </div>
                    </div>

                    <div
                      className="mt-[20px] pt-[16px]"
                      style={{ borderTop: '1px solid var(--cv-elevated)', scrollMarginBottom: '120px' }}
                    >
                      <div className="flex items-center justify-between mb-[12px]">
                        <div
                          className="text-[9px] uppercase tracking-[0.1em]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: '#C8A96E',
                          }}
                        >
                          DEVELOPMENT PATHWAY
                        </div>
                        <div
                          className="text-[9px] uppercase tracking-[0.08em] px-[8px] py-[3px] border border-[var(--cv-subtle-border)] rounded-[2px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--cv-secondary-text)',
                          }}
                        >
                          AI COACHING
                        </div>
                      </div>

                      <p
                        className="mb-[12px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--cv-secondary-text)',
                          lineHeight: 1.7,
                        }}
                      >
                        Add a note about this prospect's potential in this context
                        and get AI-powered development recommendations.
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          const existingPathway = getPathwayForContext(
                            pathwaysByContext,
                            result.context,
                          );
                          if (existingPathway) {
                            setPathwayModalContext(result.context);
                            return;
                          }
                          void generatePathway(result.context);
                        }}
                        disabled={
                          pathwayLoadingContext === result.context &&
                          !getPathwayForContext(pathwaysByContext, result.context)
                        }
                        className="w-full py-[12px] border border-[#C8A96E] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#C8A96E] hover:text-[var(--cv-background)] disabled:opacity-60"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: '#C8A96E',
                          cursor:
                            pathwayLoadingContext === result.context &&
                            !getPathwayForContext(pathwaysByContext, result.context)
                              ? 'default'
                              : 'pointer',
                        }}
                      >
                        {pathwayLoadingContext === result.context &&
                        !getPathwayForContext(pathwaysByContext, result.context)
                          ? 'GENERATING...'
                          : getPathwayForContext(pathwaysByContext, result.context)
                            ? 'VIEW DEVELOPMENT PATHWAY'
                            : 'GENERATE DEVELOPMENT PATHWAY'}
                      </button>
                    </div>
                    </>
                    )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Right Panel */}
        <div>
          <div
            className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[24px] mb-[24px]"
            data-tutorial="score-panel"
          >
            <div className="flex items-center justify-between">
              <div 
                className="text-[10px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
              >
                Does This Align With Your Judgment?
              </div>
              <div className="flex gap-[8px]">
                <button
                  onClick={async () => {
                    if (!evaluationId) return;
                    await supabase
                      .from('evaluations')
                      .update({
                        booker_feedback: 'confirmed',
                        booker_feedback_at: new Date().toISOString(),
                      })
                      .eq('id', evaluationId);
                    // track event
                    await supabase.from('events').insert({
                      agency_id: agencyId,
                      event_type: 'evaluation_confirmed',
                      metadata: { evaluationId, prospectId },
                    });
                    setShowOverride(false);
                    setAgreed(true);
                    setOverrideSaved(false);
                    setOverrideSaveError(null);
                  }}
                  className="cv-btn-primary px-[12px] py-[6px] border rounded-[4px] text-[10px] uppercase transition-colors disabled:transform-none"
                  style={{ 
                    fontFamily: 'var(--font-mono)',
                    borderColor: agreed ? '#4a7a4a' : 'var(--cv-subtle-border)',
                    color: agreed ? '#4a7a4a' : 'var(--cv-secondary-text)',
                    backgroundColor: agreed 
                      ? 'rgba(74,122,74,0.1)' 
                      : (showOverride ? 'transparent' : 'var(--cv-elevated)'),
                    cursor: agreed ? 'default' : 'pointer'
                  }}
                  disabled={agreed}
                >
                  {agreed ? '✓ Confirmed' : 'Confirm Alignment'}
                </button>
                <button
                  onClick={async () => {
                    if (!evaluationId) return;
                    await supabase
                      .from('evaluations')
                      .update({
                        booker_feedback: 'overridden',
                        booker_feedback_at: new Date().toISOString(),
                      })
                      .eq('id', evaluationId);
                    await supabase.from('events').insert({
                      agency_id: agencyId,
                      event_type: 'evaluation_overridden',
                      metadata: { evaluationId, prospectId },
                    });
                    setShowOverride(true);
                    setAgreed(false);
                    setOverrideSaved(false);
                  }}
                  className="cv-btn-secondary px-[12px] py-[6px] border rounded-[4px] text-[10px] uppercase transition-colors"
                  style={{ 
                    fontFamily: 'var(--font-mono)',
                    borderColor: 'var(--cv-subtle-border)',
                    color: 'var(--cv-secondary-text)',
                    backgroundColor: showOverride ? 'var(--cv-elevated)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  Override
                </button>
              </div>
            </div>
            
            <p style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '11px', 
              color: 'var(--cv-secondary-text)',
              marginTop: '8px',
              fontStyle: 'italic'
            }}>
              Your feedback helps us improve recommendations.
            </p>
            
            {showOverride && (
              <div className="mt-[16px]">
                <textarea
                  value={overrideText}
                  onChange={(e) => {
                    setOverrideText(e.target.value);
                    setOverrideSaved(false);
                    setOverrideSaveError(null);
                  }}
                  placeholder="Add your assessment..."
                  className="w-full h-[80px] bg-[var(--cv-background)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[12px] resize-none mb-[8px]"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-primary-text)' }}
                />
                <button
                  type="button"
                  disabled={
                    !evaluationId ||
                    !overrideText.trim() ||
                    savingOverride ||
                    overrideSaved
                  }
                  onClick={async () => {
                    if (!evaluationId || !overrideText.trim()) return;
                    setSavingOverride(true);
                    setOverrideSaveError(null);
                    const { error } = await supabase
                      .from('evaluations')
                      .update({
                        booker_override: overrideText.trim(),
                        booker_feedback: 'overridden',
                        booker_feedback_at: new Date().toISOString(),
                      })
                      .eq('id', evaluationId);
                    setSavingOverride(false);
                    if (error) {
                      console.error('[Results] override save failed:', error.message);
                      setOverrideSaveError(
                        error.message.includes('booker_override') || error.code === '42703'
                          ? 'Override column missing — apply Manual Task 4 migration'
                          : 'Save failed — try again',
                      );
                      return;
                    }
                    setOverrideSaved(true);
                  }}
                  className="px-[16px] py-[6px] rounded-[4px] text-[10px] uppercase transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: 'var(--font-label)',
                    backgroundColor: overrideSaved
                      ? 'transparent'
                      : overrideSaveError
                        ? 'transparent'
                        : 'var(--cv-primary-text)',
                    color: overrideSaved
                      ? '#4a7a4a'
                      : overrideSaveError
                        ? '#c87a7a'
                        : 'var(--cv-background)',
                    border: overrideSaved
                      ? '1px solid #4a7a4a'
                      : overrideSaveError
                        ? '1px solid #c87a7a'
                        : 'none',
                  }}
                >
                  {overrideSaved
                    ? '✓ Saved'
                    : savingOverride
                      ? 'Saving…'
                      : overrideSaveError
                        ? 'Save failed'
                        : 'Save'}
                </button>
                {overrideSaveError && (
                  <p
                    className="mt-[8px] text-[10px]"
                    style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}
                  >
                    {overrideSaveError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="h-[1px] bg-[var(--cv-subtle-border)] mb-[24px]" />

          <div>
            <div
              className="mb-[8px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--cv-secondary-text)' }}
            >
              AGENT NOTES
            </div>
            <textarea
              value={agentNotes}
              onChange={(e) => {
                setAgentNotes(e.target.value);
                setNotesSaved(false);
              }}
              placeholder="Add notes for this evaluation..."
              rows={4}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: '1px solid var(--cv-subtle-border)',
                borderRadius: '4px',
                padding: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--cv-primary-text)',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                marginBottom: '12px',
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (evaluationId) {
                  const saved = updateEvaluationNotes(evaluationId, agentNotes);
                  if (saved) setNotesSaved(true);
                }
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: notesSaved ? '#4a7a4a' : 'var(--cv-primary-text)',
                background: 'none',
                border: `1px solid ${notesSaved ? '#4a7a4a' : 'var(--cv-subtle-border)'}`,
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                letterSpacing: '0.08em',
                width: '100%',
                textTransform: 'uppercase' as const,
              }}
            >
              {notesSaved ? '✓ NOTES SAVED' : 'SAVE NOTES'}
            </button>
          </div>
        </div>
      </div>

      <DevelopmentPathwayModal
        open={pathwayModalContext !== null}
        context={pathwayModalContext}
        note={
          pathwayModalContext
            ? pathwayNotesByContext[normalizePathwayContext(pathwayModalContext)] ?? ''
            : ''
        }
        onNoteChange={(note) => {
          if (!pathwayModalContext) return;
          const key = normalizePathwayContext(pathwayModalContext);
          setPathwayNotesByContext((prev) => ({ ...prev, [key]: note }));
        }}
        pathway={
          pathwayModalContext
            ? getPathwayForContext(pathwaysByContext, pathwayModalContext)
            : null
        }
        loading={pathwayModalContext === pathwayLoadingContext}
        error={
          pathwayModalContext
            ? pathwayErrorByContext[normalizePathwayContext(pathwayModalContext)]
            : null
        }
        onClose={() => setPathwayModalContext(null)}
        onGenerate={() => {
          if (pathwayModalContext) void generatePathway(pathwayModalContext);
        }}
      />
    </div>
  );
}