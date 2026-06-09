import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import {
  createCastviewPdf,
  pdfBody,
  pdfBullet,
  pdfCheckBreak,
  pdfDrawContextBar,
  pdfDrawDisclaimer,
  pdfDrawHeader,
  pdfDrawPreparedBy,
  pdfDrawProspectSection,
  pdfDrawSectionTitle,
  pdfDrawSubtitle,
  pdfHr,
  pdfLabel,
  pdfSave,
  pdfSafeText,
} from '../../lib/castviewPdf';
import { ChevronDown } from 'lucide-react';
import {
  loadComparisonResults,
  type ComparisonDirection,
  type ComparisonResultItem,
  type ComparisonStorageData,
} from '../../lib/comparisonStorage';

function getDigitalSetDisplayTitle(title: string | null | undefined): string {
  const trimmed = title?.trim();
  if (!trimmed || trimmed === 'Untitled Set') {
    return 'Unnamed Set';
  }
  return trimmed;
}

function toScoreLabel(date: string | null | undefined) {
  const trimmed = date?.trim();
  if (!trimmed || trimmed === '—') {
    return '—';
  }
  const [month, year] = trimmed.split(' ');
  if (!month || !year) {
    return trimmed;
  }
  return `${month.slice(0, 3).toUpperCase()} ${year}`;
}

function getCompareChangeTag(direction: ComparisonDirection) {
  if (direction === 'improved') {
    return { text: 'IMPROVED', color: '#4a7a4a' };
  }
  if (direction === 'declined') {
    return { text: 'DECLINED', color: '#c87a7a' };
  }
  return { text: 'STABLE', color: '#888880' };
}

export function CompareResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const prospectName = searchParams.get('name')
    ? decodeURIComponent(searchParams.get('name')!)
    : 'Prospect';
  const profileType = searchParams.get('profileType') || 'prospect';
  const prospectId = searchParams.get('prospectId') || '';

  const comparisonData = useMemo((): ComparisonStorageData | null => {
    const routeState = location.state as { comparisonData?: ComparisonStorageData } | null;
    if (routeState?.comparisonData) {
      return routeState.comparisonData;
    }
    return loadComparisonResults(prospectId);
  }, [location.state, prospectId]);

  const [openContext, setOpenContext] = useState<string | null>(null);
  const [agentNotes, setAgentNotes] = useState<Record<string, string>>({});

  const previousScoreLabel = comparisonData
    ? toScoreLabel(comparisonData.previousSet.date)
    : '—';
  const currentScoreLabel = comparisonData
    ? toScoreLabel(comparisonData.currentSet.date)
    : '—';

  const generatePDF = () => {
    if (!comparisonData) return;

    const pdf = createCastviewPdf();
    pdfDrawHeader(pdf);
    pdfDrawProspectSection(pdf, prospectName);
    pdfHr(pdf);

    pdfDrawSectionTitle(pdf, 'Progression Report');
    pdfDrawSubtitle(
      pdf,
      `${getDigitalSetDisplayTitle(comparisonData.previousSet.title)} (${comparisonData.previousSet.date}) -> ${getDigitalSetDisplayTitle(comparisonData.currentSet.title)} (${comparisonData.currentSet.date})`,
    );

    comparisonData.results.forEach((result) => {
      pdfCheckBreak(pdf, 45);
      pdfDrawContextBar(
        pdf,
        result.context,
        `${result.oldScore} (${previousScoreLabel}) -> ${result.newScore} (${currentScoreLabel})`,
      );

      pdfLabel(pdf, 'Analysis', pdf.margin, pdf.y);
      pdf.y += 4;
      pdf.y += pdfBody(pdf, result.reasoning, pdf.margin, pdf.y, pdf.fullW) + 4;

      pdfLabel(pdf, 'Suggested next step', pdf.margin, pdf.y);
      pdf.y += 4;
      pdf.y += pdfBullet(pdf, result.nextStep, pdf.margin, pdf.y, pdf.fullW) + 4;

      const note = agentNotes[result.context]?.trim();
      if (note) {
        pdfLabel(pdf, 'Agent note', pdf.margin, pdf.y, [160, 120, 60]);
        pdf.y += 4;
        pdf.y += pdfBody(pdf, note, pdf.margin, pdf.y, pdf.fullW) + 4;
      }

      pdf.doc.setDrawColor(200, 200, 196);
      pdf.doc.line(pdf.margin, pdf.y, pdf.pageW - pdf.margin, pdf.y);
      pdf.y += 6;
    });

    pdfDrawDisclaimer(pdf);
    pdfDrawPreparedBy(pdf);
    pdfSave(pdf, `CastView-${pdfSafeText(prospectName)}-Progression.pdf`);
  };

  if (!comparisonData) {
    return (
      <div className="p-[48px] text-center">
        <p
          className="mb-[24px]"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: '#666660',
          }}
        >
          No comparison data found.
        </p>
        <button
          type="button"
          onClick={() => navigate('/compare')}
          className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
          style={{
            fontFamily: 'var(--font-mono)',
            color: '#f0f0ec',
            cursor: 'pointer',
          }}
        >
          BACK
        </button>
      </div>
    );
  }

  const profileHistoryPath =
    profileType === 'model'
      ? `/roster/${prospectId}/history`
      : `/prospects/${prospectId}`;

  return (
    <div className="p-[48px]">
      <div className="flex justify-between items-center mb-[24px]">
        <button
          type="button"
          onClick={() => navigate(profileHistoryPath)}
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
          ← BACK TO PROFILE
        </button>

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
      </div>

      <h1
        className="text-[48px] mb-[48px]"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          color: '#f0f0ec',
        }}
      >
        {prospectName} — Progression Report
      </h1>

      <p
        className="mb-[24px]"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#888880',
        }}
      >
        {getDigitalSetDisplayTitle(comparisonData.previousSet.title)} →{' '}
        {getDigitalSetDisplayTitle(comparisonData.currentSet.title)}
      </p>

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[20px] mb-[32px] flex gap-[24px]">
        {(
          [
            {
              key: 'improved' as const,
              label: 'IMPROVED',
              color: '#4a7a4a',
              count: comparisonData.improvedCount,
            },
            {
              key: 'stable' as const,
              label: 'STABLE',
              color: '#888880',
              count: comparisonData.stableCount,
            },
            {
              key: 'declined' as const,
              label: 'DECLINED',
              color: '#c87a7a',
              count: comparisonData.declinedCount,
            },
          ] as const
        ).map((stat) => (
          <div key={stat.key} className="flex-1 text-center">
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '24px',
                color: stat.color,
              }}
            >
              {stat.count}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: stat.color,
                marginTop: '4px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div>
        {comparisonData.results.map((result) => {
          const changeTag = getCompareChangeTag(result.direction);
          const isOpen = openContext === result.context;
          return (
            <div key={result.context}>
              <button
                type="button"
                onClick={() =>
                  setOpenContext(isOpen ? null : result.context)
                }
                className="w-full text-left"
                style={{
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
              >
                <div
                  className={`w-full bg-[#111111] border border-[#2a2a2a] px-[24px] py-[16px] mb-[8px] flex justify-between items-center ${
                    isOpen
                      ? 'rounded-t-[4px] rounded-b-none border-b-0'
                      : 'rounded-[4px]'
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
                  <div className="flex items-center gap-[12px]">
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        color: '#f0f0ec',
                      }}
                    >
                      {result.oldScore} → {result.newScore}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: changeTag.color,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {changeTag.text}
                    </span>
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
                <div className="bg-[#0d0d0d] border border-t-0 border-[#2a2a2a] rounded-b-[4px] mb-[8px]">
                  <div className="cv-eval-panel-body px-[24px] py-[20px] pb-[24px]">
                  <div className="flex items-center gap-[16px]">
                    <div className="flex-1">
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: '#888880',
                          marginBottom: '4px',
                        }}
                      >
                        {previousScoreLabel}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '48px',
                          fontWeight: 300,
                          color: '#f0f0ec',
                        }}
                      >
                        {result.oldScore}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '14px',
                        color: '#888880',
                      }}
                    >
                      →
                    </span>
                    <div className="flex-1 text-right">
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: '#888880',
                          marginBottom: '4px',
                        }}
                      >
                        {currentScoreLabel}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '48px',
                          fontWeight: 300,
                          color: '#f0f0ec',
                        }}
                      >
                        {result.newScore}
                      </div>
                    </div>
                  </div>

                  <div className="h-[1px] bg-[#2a2a2a] my-[16px]" />

                  <div
                    className="uppercase mb-[8px]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color: '#888880',
                      letterSpacing: '0.1em',
                    }}
                  >
                    ANALYSIS
                  </div>
                  <p
                    className="mb-[16px]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: '#c0c0ba',
                      lineHeight: 1.8,
                    }}
                  >
                    {result.reasoning}
                  </p>

                  <div
                    className="uppercase mb-[8px]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color: '#888880',
                      letterSpacing: '0.1em',
                    }}
                  >
                    SUGGESTED NEXT STEP
                  </div>
                  <p
                    className="mb-[16px]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: '#a0a09a',
                      lineHeight: 1.8,
                    }}
                  >
                    → {result.nextStep}
                  </p>

                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: result.newScore > result.oldScore ? '#4a7a4a' : 
                             result.newScore < result.oldScore ? '#c87a7a' : '#888880',
                      marginTop: '12px',
                    }}
                  >
                    {result.newScore > result.oldScore
                      ? `▲ +${result.newScore - result.oldScore} from previous set`
                      : result.newScore < result.oldScore
                      ? `▼ ${result.newScore - result.oldScore} from previous set`
                      : `→ No change from previous set`}
                  </div>

                  <div
                    className="uppercase mb-[8px]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color: '#888880',
                      letterSpacing: '0.1em',
                    }}
                  >
                    AGENT NOTE
                  </div>
                  <textarea
                    value={agentNotes[result.context] ?? ''}
                    onChange={(e) =>
                      setAgentNotes((prev) => ({
                        ...prev,
                        [result.context]: e.target.value,
                      }))
                    }
                    placeholder="Add agent note for this context..."
                    rows={2}
                    className="w-full px-[12px] py-[10px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] resize-none"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: '#f0f0ec',
                    }}
                  />
                </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
