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
import { ChevronDown } from 'lucide-react';
import { getContextData } from '../constants/contextMockData';
import { getSumithDigitalSetV1, isSumithProspect } from '../constants/sumithProspect';
import { useAuth } from '../context/AuthContext';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import type { DigitalSet } from '../types/talent';
import { authFetch } from '../../lib/apiAuth';
import { supabase } from '../../lib/supabase';
import { DigitalImage } from './DigitalImage';
import {
  clearHandoffStorage,
  EVALUATION_ERROR_KEY,
  loadEvaluationReport,
  updateEvaluationNotes,
} from '../utils/evaluationStorage';
import {
  isEvaluationPersisted,
  persistEvaluationToSupabase,
} from '../utils/evaluationPersist';

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

function ContextArrowList({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#a0a09a',
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
      className="h-[2px] bg-[#2a2a2a] rounded-full overflow-hidden"
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
    }
  }, [evaluationId]);

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

  const contextResults = useMemo(() => {
    const mockScores = [94, 91, 88, 88, 87, 85, 82, 86, 89];
    return selectedContexts.map((ctx, i) => {
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
  }, [selectedContexts, realEvalData, allowDevMock]);

  const [openContext, setOpenContext] = useState<string | null>(null);
  const [devPathwayContext, setDevPathwayContext] = useState<string | null>(null);
  const [devPathwayNote, setDevPathwayNote] = useState('');
  const [devPathwayLoading, setDevPathwayLoading] = useState(false);
  const [devPathwayData, setDevPathwayData] = useState<{
    sections: { label: string; items: string[] }[];
    summary: string;
  } | null>(null);
  const [devPathwayError, setDevPathwayError] = useState<string | null>(null);
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
    <div className="p-[20px] md:p-[48px] overflow-x-hidden">
      <div className="flex flex-col gap-[16px] sm:flex-row sm:justify-between sm:items-center mb-[24px]">
        <div>
          <button
            type="button"
            onClick={() => navigate(profileType === 'model' ? '/roster' : '/prospects')}
            className="hover:opacity-70 transition-opacity cursor-pointer"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#888880',
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
              if (!evaluationId) return;
              if (!window.confirm('Delete this evaluation? This cannot be undone.')) return;

              if (profileType === 'model') {
                const model = models.find(
                  (m) =>
                    m.id === prospectId ||
                    m.name.trim().toLowerCase() === prospectName.trim().toLowerCase(),
                );
                if (model) {
                  const updatedSets = model.digitalSets.map((ds) => ({
                    ...ds,
                    evaluations: (ds.evaluations ?? []).filter(
                      (e) => e.id !== evaluationId,
                    ),
                  }));
                  updateModel(model.id, { digitalSets: updatedSets });
                  localStorage.removeItem(`castview_eval_${evaluationId}`);
                  navigate(`/roster/${model.id}`);
                }
              } else {
                if (!prospectId) return;
                const prospect = prospects.find((p) => p.id === prospectId);
                if (!prospect) return;
                const updatedSets = prospect.digitalSets.map((ds) => ({
                  ...ds,
                  evaluations: (ds.evaluations ?? []).filter(
                    (e) => e.id !== evaluationId,
                  ),
                }));
                updateProspect(prospectId, { digitalSets: updatedSets });
                localStorage.removeItem(`castview_eval_${evaluationId}`);
                navigate(`/prospects/${prospectId}`);
              }
            }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#c87a7a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              padding: 0,
              textTransform: 'uppercase' as const,
              display: 'block',
              marginTop: '8px',
            }}
          >
            DELETE EVALUATION
          </button>
        </div>

        <button
          type="button"
          className="cv-btn-primary"
          onClick={async () => {
            if (evalSaved || savingEval || !hasRealEvaluation || !prospectId || !evaluationId) return;

            setSavingEval(true);
            setSaveError(null);

            try {
              const synced = await persistEvaluationToSupabase({
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
            color: evalSaved ? '#4a7a4a' : saveError ? '#c87a7a' : '#f0f0ec',
            background: 'none',
            border: `1px solid ${evalSaved ? '#4a7a4a' : saveError ? '#c87a7a' : '#2a2a2a'}`,
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
            className="cv-btn-primary border border-[#2a2a2a] bg-transparent rounded-[4px] px-[20px] py-[10px] text-[11px] uppercase tracking-[0.1em] hover:border-[#f0f0ec] hover:text-[#f0f0ec] transition-colors"
            style={{
              fontFamily: 'var(--font-mono)',
              color: '#888880',
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
            className="bg-[#f0f0ec] text-[#080808] rounded-[4px] px-[20px] py-[10px] text-[11px] uppercase tracking-[0.1em] hover:opacity-80 transition-opacity"
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
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        {prospectName} — Context Alignment Report
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#888880',
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
                  <div className="aspect-[3/4] overflow-hidden rounded-[4px] bg-[#111111]">
                    {src ? (
                      <DigitalImage
                        storageRef={src}
                        alt={label}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1a1a1a]" />
                    )}
                  </div>
                  <div
                    className="mt-[8px] uppercase"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color: '#888880',
                    }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {contextResults.map((result) => {
            const data = getEvalData(result.context);
            const unavailable = isContextUnavailable(result.context);
            const displayScore =
              data?.alignmentScore ??
              (typeof result.score === 'number' ? result.score : null);
            const isOpen = openContext === result.context;
            return (
              <div key={result.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (openContext !== result.context) {
                      setDevPathwayNote('');
                      setDevPathwayContext(null);
                    }
                    setOpenContext(isOpen ? null : result.context);
                  }}
                  className="w-full text-left"
                  style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  <div
                    className={`w-full bg-[#111111] border border-[#2a2a2a] px-[24px] py-[16px] mb-[8px] flex justify-between items-center hover:bg-[#1a1a1a] ${
                      isOpen ? 'rounded-t-[4px] rounded-b-none border-b-0' : 'rounded-[4px]'
                    }`}
                    style={{ transition: 'background-color 0.2s ease' }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px',
                        color: '#f0f0ec',
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
                          color: '#888880',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </button>

                <div
                  style={{
                    overflow: 'hidden',
                    transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    maxHeight: isOpen ? '600px' : '0',
                  }}
                >
                  <div className="bg-[#0d0d0d] border border-t-0 border-[#2a2a2a] rounded-b-[4px] px-[24px] py-[20px] mb-[8px]">
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
                            color: '#888880',
                            letterSpacing: '0.1em',
                          }}
                        >
                          REASONING
                        </div>
                        <p
                          className="mb-[20px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            color: '#c0c0ba',
                            lineHeight: 1.8,
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
                        <ContextArrowList items={data.strengths} />

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
                        <ContextArrowList items={data.risks} />
                      </div>

                      <div>
                        <div
                          className="uppercase mb-[8px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: '#888880',
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
                            color: '#888880',
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
                      style={{ borderTop: '1px solid #1a1a1a' }}
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
                          className="text-[9px] uppercase tracking-[0.08em] px-[8px] py-[3px] border border-[#2a2a2a] rounded-[2px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: '#888880',
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
                          color: '#666660',
                          lineHeight: 1.7,
                        }}
                      >
                        Add a note about this prospect's potential in this context
                        and get AI-powered development recommendations.
                      </p>

                      <textarea
                        value={devPathwayNote}
                        onChange={(e) => setDevPathwayNote(e.target.value)}
                        placeholder={`e.g. "Strong bone structure — I think he has potential for ${result.context} but needs work on posture and styling direction."`}
                        rows={3}
                        className="w-full px-[12px] py-[10px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] resize-none mb-[12px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: '#f0f0ec',
                          lineHeight: 1.6,
                        }}
                      />

                      <button
                        type="button"
                        onClick={async () => {
                          if (devPathwayLoading) return;
                          setDevPathwayContext(result.context);
                          setDevPathwayLoading(true);
                          setDevPathwayData(null);
                          setDevPathwayError(null);
                          try {
                            const contextData = realEvalData?.contextEvaluations?.find(
                              (e: any) => e.context === result.context
                            );
                            const response = await authFetch('/api/pathway', {
                              method: 'POST',
                              body: JSON.stringify({
                                prospectName,
                                context: result.context,
                                alignmentScore: contextData?.alignmentScore ?? 0,
                                agentNote: devPathwayNote || 'No additional notes provided.',
                              }),
                            });
                            if (response.status === 402) {
                              setDevPathwayError(
                                'Trial ended — choose a plan to continue.',
                              );
                              return;
                            }
                            const data = await response.json();
                            if (response.ok && data.sections) {
                              setDevPathwayData(data);
                            } else {
                              setDevPathwayError('Unable to generate pathway. Try again.');
                            }
                          } catch {
                            setDevPathwayError('Unable to generate pathway. Try again.');
                          } finally {
                            setDevPathwayLoading(false);
                          }
                        }}
                        className="w-full py-[12px] border border-[#C8A96E] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#C8A96E] hover:text-[#080808]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: '#C8A96E',
                          cursor: 'pointer',
                        }}
                      >
                        {devPathwayLoading && devPathwayContext === result.context
                          ? 'GENERATING...'
                          : 'GENERATE DEVELOPMENT PATHWAY'}
                      </button>

                      {devPathwayContext === result.context && (
                        <div className="mt-[16px] p-[16px] bg-[#0d0d0d] border border-[#2a2a2a] rounded-[4px]">
                          <div
                            className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: '#888880',
                            }}
                          >
                            DEVELOPMENT RECOMMENDATIONS
                          </div>

                          <div
                            className="text-[11px] mb-[16px]"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: '#a0a09a',
                              lineHeight: 1.8,
                            }}
                          >
                            Based on the uploaded digitals and your notes, here is a
                            suggested development pathway for {result.context}{' '}
                            alignment:
                          </div>

                          {devPathwayLoading && devPathwayContext === result.context && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px',
                              color: '#666660', padding: '16px 0' }}>
                              Generating pathway...
                            </div>
                          )}

                          {devPathwayError && devPathwayContext === result.context && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px',
                              color: '#c87a7a', padding: '8px 0' }}>
                              {devPathwayError}
                            </div>
                          )}

                          {devPathwayData && devPathwayContext === result.context && (
                            <>
                              {devPathwayData.summary && (
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px',
                                  color: '#a0a09a', lineHeight: 1.8, marginBottom: '16px' }}>
                                  {devPathwayData.summary}
                                </p>
                              )}
                              {devPathwayData.sections.map((section) => (
                                <div key={section.label} className="mb-[14px]">
                                  <div className="text-[8px] uppercase tracking-[0.1em] mb-[6px]"
                                    style={{ fontFamily: 'var(--font-mono)', color: '#C8A96E' }}>
                                    {section.label}
                                  </div>
                                  {section.items.map((item, i) => (
                                    <div key={i} className="mb-[4px]"
                                      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px',
                                        color: '#888880', lineHeight: 1.7 }}>
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
                    </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Right Panel */}
        <div>
          <div
            className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] mb-[24px]"
            data-tutorial="score-panel"
          >
            <div className="flex items-center justify-between">
              <div 
                className="text-[10px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
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
                    borderColor: agreed ? '#4a7a4a' : '#2a2a2a',
                    color: agreed ? '#4a7a4a' : '#a0a09a',
                    backgroundColor: agreed 
                      ? 'rgba(74,122,74,0.1)' 
                      : (showOverride ? 'transparent' : '#1a1a1a'),
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
                    borderColor: '#2a2a2a',
                    color: '#a0a09a',
                    backgroundColor: showOverride ? '#1a1a1a' : 'transparent',
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
              color: '#888880',
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
                  className="w-full h-[80px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] p-[12px] resize-none mb-[8px]"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#f0f0ec' }}
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
                        : '#f0f0ec',
                    color: overrideSaved
                      ? '#4a7a4a'
                      : overrideSaveError
                        ? '#c87a7a'
                        : '#080808',
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

          <div className="h-[1px] bg-[#2a2a2a] mb-[24px]" />

          <div>
            <div
              className="mb-[8px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#888880' }}
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
                border: '1px solid #2a2a2a',
                borderRadius: '4px',
                padding: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#f0f0ec',
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
                color: notesSaved ? '#4a7a4a' : '#f0f0ec',
                background: 'none',
                border: `1px solid ${notesSaved ? '#4a7a4a' : '#2a2a2a'}`,
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
    </div>
  );
}