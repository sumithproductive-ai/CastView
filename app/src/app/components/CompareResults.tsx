import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { jsPDF } from 'jspdf';
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

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageW = 210;
    const pageH = 297;
    const margin = 16;
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
      color: [number, number, number] = [120, 120, 116],
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
      color: [number, number, number] = [80, 80, 76],
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

    // ── PROSPECT INFO ────────────────────────
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
      { align: 'right' },
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

    // ── REPORT TITLE ─────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(20, 20, 20);
    doc.text('Progression Report', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 76);
    doc.text(
      `${getDigitalSetDisplayTitle(comparisonData.previousSet.title)} (${comparisonData.previousSet.date}) → ${getDigitalSetDisplayTitle(comparisonData.currentSet.title)} (${comparisonData.currentSet.date})`,
      margin,
      y,
      { maxWidth: fullW },
    );
    y += 10;

    comparisonData.results.forEach((result) => {
      checkBreak(45);

      doc.setFillColor(248, 248, 244);
      doc.roundedRect(margin, y, fullW, 10, 1, 1, 'F');
      doc.setDrawColor(220, 210, 190);
      doc.roundedRect(margin, y, fullW, 10, 1, 1, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(160, 120, 60);
      doc.text(result.context.toUpperCase(), margin + 5, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(20, 20, 20);
      const arrowX = pageW - margin - 42;
      doc.text(`${result.oldScore} (${previousScoreLabel})`, arrowX - 2, y + 6, {
        align: 'right',
      });
      doc.text('→', arrowX, y + 6, { align: 'center' });
      doc.text(`${result.newScore} (${currentScoreLabel})`, arrowX + 2, y + 6, {
        align: 'left',
      });
      y += 14;

      label('Analysis', margin, y);
      y += 4;
      y += body(result.reasoning, margin, y, fullW) + 4;

      label('Suggested next step', margin, y);
      y += 4;
      y += body(`→ ${result.nextStep}`, margin, y, fullW) + 4;

      const note = agentNotes[result.context]?.trim();
      if (note) {
        label('Agent note', margin, y, [160, 120, 60]);
        y += 4;
        y += body(note, margin, y, fullW) + 4;
      }

      doc.setDrawColor(200, 200, 196);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    });

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

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 120, 60);
    doc.text(
      'Prepared by CastView  ·  castview.org',
      pageW / 2,
      y,
      { align: 'center' },
    );

    doc.setFillColor(180, 145, 90);
    doc.rect(0, pageH - 2, pageW, 2, 'F');

    doc.save(`CastView-${prospectName.replace(/\s+/g, '-')}-Progression.pdf`);
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
                <div className="bg-[#0d0d0d] border border-t-0 border-[#2a2a2a] rounded-b-[4px] px-[24px] py-[20px] mb-[8px]">
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
