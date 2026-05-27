import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { jsPDF } from 'jspdf';
import { ChevronDown } from 'lucide-react';
import { getContextData } from '../constants/contextMockData';
import { isSumithProspect, SUMITH_DIGITAL_SET_V1 } from '../constants/sumithProspect';
import { useProspects } from '../context/ProspectsContext';
import type { DigitalSet } from '../types/talent';

const EVALUATION_ERROR_KEY = 'castview_evaluation_error';

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
  const { prospects } = useProspects();
  const [realEvalData, setRealEvalData] = useState<any>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
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

  useEffect(() => {
    const errorStored = sessionStorage.getItem(EVALUATION_ERROR_KEY);
    if (errorStored) {
      setEvaluationError(errorStored);
      sessionStorage.removeItem(EVALUATION_ERROR_KEY);
    }

    const stored = sessionStorage.getItem('castview_evaluation_results');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRealEvalData(parsed);
        sessionStorage.removeItem('castview_evaluation_results');
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const hasRealEvaluation = Boolean(realEvalData?.contextEvaluations?.length);
  const allowDevMock = import.meta.env.DEV && !hasRealEvaluation && !evaluationError;

  const digitalSet: DigitalSet | null = useMemo(() => {
    const prospect = prospects.find(
      (p) =>
        (prospectId && p.id === prospectId) ||
        p.name.trim().toLowerCase() === prospectName.trim().toLowerCase()
    );
    if (prospect?.digitalSets?.length) {
      return prospect.digitalSets[0];
    }
    if (isSumithProspect(prospectId, prospectName)) {
      return SUMITH_DIGITAL_SET_V1;
    }
    return null;
  }, [prospects, prospectId, prospectName]);

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
  const [showOverride, setShowOverride] = useState(false);
  const [overrideText, setOverrideText] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [agentNotes, setAgentNotes] = useState('');

  const getEvalData = (context: string) => {
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

      // Two-column content
      const leftX = margin;
      const rightX = margin + col + 8;
      const startY = y;

      // LEFT COLUMN: Reasoning + Strengths
      let leftY = startY;

      label('Reasoning', leftX, leftY);
      leftY += 4;
      leftY += body(data.reasoning, leftX, leftY, col);
      leftY += 5;

      label('Strengths', leftX, leftY, [40, 100, 40]);
      leftY += 4;
      data.strengths.forEach((s) => {
        leftY += body(`-  ${s}`, leftX, leftY, col);
        leftY += 1;
      });
      leftY += 4;

      if (data.risks.length > 0) {
        label('Risks', leftX, leftY, [160, 60, 60]);
        leftY += 4;
        data.risks.forEach((r) => {
          leftY += body(`-  ${r}`, leftX, leftY, col);
          leftY += 1;
        });
      }

      // RIGHT COLUMN: Market Signals + Next Steps
      let rightY = startY;

      label('Market Signals', rightX, rightY);
      rightY += 4;
      data.marketSignals.forEach((m) => {
        rightY += body(`-  ${m}`, rightX, rightY, col);
        rightY += 1;
      });
      rightY += 5;

      label('Suggested Next Steps', rightX, rightY);
      rightY += 4;
      data.suggestedNextSteps.forEach((s) => {
        rightY += body(`-  ${s}`, rightX, rightY, col);
        rightY += 1;
      });

      // Move y past whichever column is taller
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

    doc.save(
      `CastView-${prospectName.replace(/\s+/g, '-')}-Evaluation.pdf`
    );
  };
  
  return (
    <div className="p-[48px]">
      <div className="flex justify-between items-center mb-[24px]">
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
        className="text-[48px] mb-[48px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        {prospectName} — Context Alignment Report
      </h1>

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
                      <img
                        src={src}
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
                        {evaluationError ||
                          'Evaluation temporarily unavailable. Please try again.'}
                      </p>
                    ) : (
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
                        onClick={() => setDevPathwayContext(result.context)}
                        className="w-full py-[12px] border border-[#C8A96E] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#C8A96E] hover:text-[#080808]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: '#C8A96E',
                          cursor: 'pointer',
                        }}
                      >
                        GENERATE DEVELOPMENT PATHWAY
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

                          {[
                            {
                              label: 'IMMEDIATE FOCUS',
                              items: [
                                'Schedule a targeted test shoot with direction specific to this context',
                                'Review posture and framing with a photographer familiar with this market',
                                'Build a context-specific section of the portfolio before submission',
                              ],
                            },
                            {
                              label: 'PHYSICAL DEVELOPMENT',
                              items: [
                                'Grooming and styling consistency across digitals',
                                'Posture coaching — particularly for profile and 3/4 angles',
                                'Wardrobe refinement toward context-specific aesthetic',
                              ],
                            },
                            {
                              label: 'MARKET APPROACH',
                              items: [
                                'Do not submit to top-tier clients until test shoot confirms alignment',
                                'Target mid-tier clients first to build context-specific credits',
                                'Revisit evaluation after next digital set upload',
                              ],
                            },
                          ].map((section) => (
                            <div key={section.label} className="mb-[14px]">
                              <div
                                className="text-[8px] uppercase tracking-[0.1em] mb-[6px]"
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
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '11px',
                                    color: '#888880',
                                    lineHeight: 1.7,
                                  }}
                                >
                                  →  {item}
                                </div>
                              ))}
                            </div>
                          ))}

                          <div
                            className="mt-[16px] pt-[12px]"
                            style={{ borderTop: '1px solid #1a1a1a' }}
                          >
                            <div
                              className="text-[9px]"
                              style={{
                                fontFamily: 'var(--font-mono)',
                                color: '#444440',
                                lineHeight: 1.6,
                              }}
                            >
                              ⚡ AI-powered recommendations coming in next update.
                              Current recommendations are framework-based.
                              Real-time Claude analysis will personalise this to the
                              uploaded digitals.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
                  onClick={() => { 
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
                  onClick={() => { 
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
              Your input trains the evaluation model for your agency's standards.
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
              onChange={(e) => setAgentNotes(e.target.value)}
              placeholder="Add notes for this evaluation..."
              rows={3}
              className="w-full px-[12px] py-[10px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] resize-none mt-[16px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#f0f0ec',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}