import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { jsPDF } from 'jspdf';
import { ChevronDown } from 'lucide-react';
import { getContextData } from '../constants/contextMockData';
import { getSumithDigitalSetV1, isSumithProspect } from '../constants/sumithProspect';
import { useAuth } from '../context/AuthContext';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import type { DigitalSet } from '../types/talent';
import { supabase } from '../../lib/supabase';
import { DigitalImage } from './DigitalImage';
import {
  clearHandoffStorage,
  EVALUATION_ERROR_KEY,
  loadEvaluationReport,
  updateEvaluationNotes,
} from '../utils/evaluationStorage';

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

export function Results() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agencyId } = useAuth();
  const { prospects, updateProspect } = useProspects();
  const { models, updateModel } = useRoster();
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

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageW = 210;
    const pageH = 297;
    const margin = 16;
    const col = (pageW - margin * 2 - 8) / 2;
    const fullW = pageW - margin * 2;
    let y = margin;

    const checkBreak = (need: number) => {
      if (y + need > pageH - margin) {
        doc.addPage();
        y = margin;
        doc.setFillColor(180, 145, 90);
        doc.rect(0, 0, pageW, 3, 'F');
        y = 10;
      }
    };

    const label = (
      text: string,
      x: number,
      yPos: number,
      color: [number, number, number] = [120, 120, 116]
    ) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...color);
      doc.text(text.toUpperCase(), x, yPos);
    };

    const body = (
      text: string,
      x: number,
      yPos: number,
      maxW: number,
      color: [number, number, number] = [80, 80, 76]
    ): number => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxW);
      doc.text(lines, x, yPos);
      return lines.length * 4.2;
    };

    // ── HEADER ──────────────────────────────
    doc.setFillColor(180, 145, 90);
    doc.rect(0, 0, pageW, 3, 'F');
    y = 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 145, 90);
    doc.text('CASTVIEW', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 136);
    doc.text('castview.org  ·  hello@castview.org', pageW - margin, y, {
      align: 'right',
    });
    y += 8;

    doc.setDrawColor(200, 200, 196);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── PROSPECT ROW ────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 136);
    doc.text('PROSPECT', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      pageW - margin,
      y,
      { align: 'right' }
    );
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text(prospectName, margin, y);
    y += 10;

    // ── METADATA ROW ─────────────────────────
    const metaItems: string[] = [];
    if (prospectMeta?.source) metaItems.push(`Source: ${prospectMeta.source}`);
    if (prospectMeta?.division) metaItems.push(`Division: ${prospectMeta.division}`);
    if (prospectMeta?.height) metaItems.push(`Height: ${prospectMeta.height}`);
    if (prospectMeta?.markets?.length)
      metaItems.push(`Markets: ${prospectMeta.markets.join(', ')}`);
    if (realEvalData?.updatedAt) {
      const evalDate = new Date(realEvalData.updatedAt).toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );
      metaItems.push(`Evaluated: ${evalDate}`);
    }
    metaItems.push(`Contexts: ${selectedContexts.join(', ')}`);

    if (metaItems.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 116);
      const metaText = metaItems.join('  ·  ');
      const metaLines = doc.splitTextToSize(metaText, fullW);
      doc.text(metaLines, margin, y);
      y += metaLines.length * 4.5 + 4;
    }

    doc.setDrawColor(200, 200, 196);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── PER-CONTEXT SECTIONS ─────────────────
    contextResults.forEach((result) => {
      const data = getEvalData(result.context);
      const score =
        data?.alignmentScore ??
        (typeof result.score === 'number' ? result.score : null);
      if (!data || score == null) return;

      const scoreBarW = fullW * (score / 100);

      checkBreak(60);

      // Context header — light ivory bg
      doc.setFillColor(248, 248, 244);
      doc.roundedRect(margin, y, fullW, 10, 1, 1, 'F');
      doc.setDrawColor(220, 210, 190);
      doc.roundedRect(margin, y, fullW, 10, 1, 1, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(160, 120, 60);
      doc.text(result.context.toUpperCase(), margin + 5, y + 6);

      doc.setTextColor(20, 20, 20);
      doc.text(`${score}%  ${data.fitLabel}`, pageW - margin - 5, y + 6, {
        align: 'right',
      });
      y += 12;

      // Score bar
      doc.setFillColor(220, 220, 218);
      doc.rect(margin, y, fullW, 2, 'F');
      doc.setFillColor(180, 145, 90);
      doc.rect(margin, y, scoreBarW, 2, 'F');
      y += 6;

      let contentY = y;

      // Reasoning — full width
      label('Reasoning', margin, contentY);
      contentY += 4;
      contentY += body(data.reasoning, margin, contentY, fullW) + 4;

      // Two columns below reasoning: left = Strengths + Risks, right = Market Signals + Next Steps
      const leftX = margin;
      const rightX = margin + col + 8;
      let leftY = contentY;
      let rightY = contentY;

      label('Strengths', leftX, leftY, [40, 100, 40]);
      leftY += 4;
      data.strengths.forEach((s: string) => {
        leftY += body(`→  ${s}`, leftX, leftY, col) + 1;
      });
      leftY += 4;

      if (data.risks?.length > 0) {
        label('Risks', leftX, leftY, [160, 60, 60]);
        leftY += 4;
        data.risks.forEach((r: string) => {
          leftY += body(`→  ${r}`, leftX, leftY, col) + 1;
        });
      }

      label('Market Signals', rightX, rightY);
      rightY += 4;
      data.marketSignals.forEach((m: string) => {
        rightY += body(`→  ${m}`, rightX, rightY, col) + 1;
      });
      rightY += 4;

      label('Suggested Next Steps', rightX, rightY);
      rightY += 4;
      data.suggestedNextSteps.forEach((s: string) => {
        rightY += body(`→  ${s}`, rightX, rightY, col) + 1;
      });

      y = Math.max(leftY, rightY) + 6;

      doc.setDrawColor(200, 200, 196);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    });

    // ── AGENT NOTES ─────────────────────────
    checkBreak(28);
    const notesText = agentNotes.trim() || 'No agent notes added.';
    const notesLines = doc.splitTextToSize(notesText, fullW - 12);
    const notesBoxH = notesLines.length * 4.5 + 14;

    doc.setFillColor(248, 248, 244);
    doc.roundedRect(margin, y, fullW, notesBoxH, 2, 2, 'F');
    doc.setDrawColor(220, 210, 190);
    doc.roundedRect(margin, y, fullW, notesBoxH, 2, 2, 'S');
    y += 6;
    label('Agent Notes', margin + 6, y, [160, 120, 60]);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 76);
    doc.text(notesLines, margin + 6, y);
    y += notesLines.length * 4.5 + 8;

    // ── DISCLAIMER ───────────────────────────
    checkBreak(24);
    doc.setDrawColor(200, 200, 196);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    const disclaimer =
      'This report is generated by AI analysis of uploaded digitals and is intended as a decision-support tool only. Context alignment scores do not constitute professional casting advice and should be used alongside agent judgment. CastView does not guarantee casting outcomes.';
    const dlLines = doc.splitTextToSize(disclaimer, fullW);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 136);
    doc.text(dlLines, margin, y);
    y += dlLines.length * 3.8 + 5;

    // ── FOOTER ───────────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 120, 60);
    doc.text(
      'Prepared by CastView  ·  castview.org',
      pageW / 2,
      y,
      { align: 'center' }
    );

    doc.setFillColor(180, 145, 90);
    doc.rect(0, pageH - 2, pageW, 2, 'F');

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 136);
      doc.text(`${i} / ${totalPages}`, pageW / 2, pageH - 6, { align: 'center' });
    }

    doc.save(
      `CastView-${prospectName.replace(/\s+/g, '-')}-Evaluation.pdf`
    );
  };
  
  return (
    <div className="p-[48px]">
      <div className="flex justify-between items-center mb-[24px]">
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
          onClick={async () => {
            if (evalSaved || savingEval || !hasRealEvaluation || !prospectId || !evaluationId) return;
            const prospect = prospects.find((p) => p.id === prospectId);
            if (!prospect) {
              setSaveError('Prospect not found in session');
              return;
            }

            setSavingEval(true);
            setSaveError(null);

            try {
              let digitalSets = prospect.digitalSets ?? [];
              if (digitalSets.length === 0) {
                const { data: freshSets, error: setsError } = await supabase
                  .from('digital_sets')
                  .select('*')
                  .eq('entity_id', prospectId)
                  .order('created_at', { ascending: false });

                if (setsError) throw setsError;
                digitalSets = (freshSets ?? []).map((ds) => ({
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

              if (digitalSets.length === 0) {
                throw new Error('No digital set found for this prospect');
              }

              const targetSetId = digitalSetId || digitalSets[0].id;
              const newEvaluation = {
                id: evaluationId,
                completedAt: new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }),
                agentNotes: agentNotes ?? '',
                contexts: (realEvalData.contextEvaluations ?? []).map((ce: any) => ({
                  context: ce.context,
                  alignmentScore: ce.alignmentScore ?? ce.alignment_score ?? 0,
                  fitLabel: ce.fitLabel ?? ce.fit_label ?? '',
                  reasoning: ce.reasoning ?? '',
                  strengths: ce.strengths ?? [],
                  risks: ce.risks ?? [],
                  marketSignals: ce.marketSignals ?? ce.market_signals ?? [],
                  suggestedNextSteps: ce.suggestedNextSteps ?? ce.suggested_next_steps ?? [],
                })),
              };
              const updatedSets = digitalSets.map((ds) =>
                ds.id === targetSetId
                  ? {
                      ...ds,
                      evaluations: [
                        newEvaluation,
                        ...(ds.evaluations ?? []).filter((e) => e.id !== evaluationId),
                      ],
                    }
                  : ds,
              );

              await updateProspect(prospectId, { digitalSets: updatedSets });
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
            className="border border-[#2a2a2a] bg-transparent rounded-[4px] px-[20px] py-[10px] text-[11px] uppercase tracking-[0.1em] hover:border-[#f0f0ec] hover:text-[#f0f0ec] transition-colors"
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
                `/share?name=${encodeURIComponent(prospectName)}&contexts=${contextsParam}&profileType=${profileType}&prospectId=${prospectId}`,
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
      
      <div className="grid grid-cols-[1fr_320px] gap-[48px]">
        {/* Digitals strip + context dropdowns */}
        <div>
          <div className="flex flex-row gap-[12px] w-full mb-[32px]">
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
                    className={`w-full bg-[#111111] border border-[#2a2a2a] px-[24px] py-[16px] mb-[8px] flex justify-between items-center ${
                      isOpen ? 'rounded-t-[4px] rounded-b-none border-b-0' : 'rounded-[4px]'
                    }`}
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
                      <div
                        className="h-[2px] bg-[#2a2a2a] rounded-full overflow-hidden"
                        style={{ width: '80px' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${displayScore ?? 0}%`,
                            backgroundColor: '#C8A96E',
                          }}
                        />
                      </div>
                      <ChevronDown
                        size={14}
                        style={{
                          color: '#888880',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </div>
                  </div>
                </button>

                {isOpen && (
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
                    <div className="grid grid-cols-2 gap-[32px]">
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
                            const response = await fetch('/api/pathway', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                prospectName,
                                context: result.context,
                                alignmentScore: contextData?.alignmentScore ?? 0,
                                agentNote: devPathwayNote || 'No additional notes provided.',
                              }),
                            });
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
                )}
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
                  }}
                  className="px-[12px] py-[6px] border rounded-[4px] text-[10px] uppercase transition-colors"
                  style={{ 
                    fontFamily: 'var(--font-mono)',
                    borderColor: agreed ? '#4a7a4a' : '#2a2a2a',
                    color: agreed ? '#4a7a4a' : '#a0a09a',
                    backgroundColor: agreed 
                      ? 'rgba(74,122,74,0.1)' 
                      : (showOverride ? 'transparent' : '#1a1a1a'),
                    cursor: agreed ? 'default' : 'pointer'
                  }}
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
                  }}
                  className="px-[12px] py-[6px] border rounded-[4px] text-[10px] uppercase transition-colors"
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
                  onChange={(e) => setOverrideText(e.target.value)}
                  placeholder="Add your assessment..."
                  className="w-full h-[80px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] p-[12px] resize-none mb-[8px]"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#f0f0ec' }}
                />
                <button
                  className="px-[16px] py-[6px] rounded-[4px] text-[10px] uppercase transition-opacity hover:opacity-80"
                  style={{ 
                    fontFamily: 'var(--font-label)',
                    backgroundColor: '#f0f0ec',
                    color: '#080808'
                  }}
                >
                  Save
                </button>
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