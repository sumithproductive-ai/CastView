import React from 'react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { jsPDF } from 'jspdf';
import { ChevronDown } from 'lucide-react';
import { isSumithProspect, SUMITH_DIGITAL_SET_V1 } from '../constants/sumithProspect';
import { useProspects } from '../context/ProspectsContext';
import type { DigitalSet } from '../types/talent';

type ContextMockEntry = {
  score: number;
  fitLabel: string;
  reasoning: string;
  strengths: string[];
  risks: string[];
  marketSignals: string[];
  suggestedNextSteps: string[];
};

const CONTEXT_MOCK_DATA: Record<string, ContextMockEntry> = {
  Fragrance: {
    score: 94,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'The uploaded digitals show strong alignment with current European luxury fragrance casting criteria. Facial geometry, bone structure depth, and skin tone consistency match the visual language of high-end fragrance campaigns in the NYC and London markets.',
    strengths: [
      'Angular bone structure aligns with fragrance campaign framing criteria',
      'Skin tone and undertone range scores well against editorial lighting benchmarks',
      'Proportions support tight crop compositions typical of this context',
      'Profile definition strong — relevant for 3/4 fragrance framing',
    ],
    risks: [
      'Limited progression data — one digital set on file',
      'No fragrance-specific test shoot imagery to confirm on-set performance',
    ],
    marketSignals: [
      'European luxury fragrance market trending toward this profile type',
      'High demand for this look in NYC and London markets',
      'Dark editorial fragrance aesthetic currently active in major campaigns',
    ],
    suggestedNextSteps: [
      'Schedule fragrance test shoot as first priority',
      'Approach luxury fragrance clients in NYC market first',
      'Upload updated digitals after next shoot for progression tracking',
    ],
  },
  Editorial: {
    score: 91,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Editorial versatility indicators are strong. The digitals demonstrate a range of natural expression and structural presence that supports both close-crop and full-frame editorial compositions. Face and body proportion ratios are within standard editorial casting benchmarks.',
    strengths: [
      'Strong editorial presence — reads naturally in front of camera',
      'Versatile look range supports multiple editorial aesthetics',
      'Bone structure reads distinctly in both close-crop and wide frame',
      'Neutral expression holds well — critical for editorial context',
    ],
    risks: [
      'No editorial tear sheets or test shoot imagery on file yet',
      'Versatility across high-fashion and commercial editorial not yet tested',
    ],
    marketSignals: [
      'NYC editorial market currently active and receptive to this profile',
      'Strong alignment with current European editorial casting trends',
      'Demand for diverse editorial faces increasing in major market publications',
    ],
    suggestedNextSteps: [
      'Approach editorial clients in NYC and London simultaneously',
      'Schedule editorial test shoot targeting 2–3 distinct aesthetic ranges',
      'Build editorial-specific portfolio section before broader submission',
    ],
  },
  Runway: {
    score: 88,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Full body proportions and posture visible in digitals are consistent with runway casting criteria. Height-to-proportion ratios and shoulder-to-waist relationship align with current runway standards for menswear and luxury ready-to-wear.',
    strengths: [
      'Full body proportion ratio within runway standard range',
      'Posture and natural stance visible in full body digital is clean',
      'Shoulder structure supports structured garment silhouettes',
    ],
    risks: [
      'Walk and on-runway performance cannot be assessed from digitals alone',
      'Runway-specific movement evaluation requires in-person casting',
    ],
    marketSignals: [
      'Menswear runway market showing demand for this body type and aesthetic',
      'NY and Milan markets active for this profile category',
    ],
    suggestedNextSteps: [
      'Book an in-person casting to assess walk and movement',
      'Submit to menswear runway castings in next open season',
      'Review runway-specific comp card requirements before submission',
    ],
  },
  Campaign: {
    score: 88,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Commercial appeal indicators across the digitals are strong. The face reads clearly and warmly at distance — a key criterion for large-format campaign work. Approachability scores are above average for lifestyle and brand advertising contexts.',
    strengths: [
      'High commercial appeal across broad consumer demographics',
      'Face reads clearly at large format — critical for OOH campaign use',
      'Brand-fit indicators strong for lifestyle and luxury campaign contexts',
      'Neutral palette in digitals supports broad client brand color ranges',
    ],
    risks: [
      'Campaign versatility across premium and mass-market contexts not yet tested',
      'No campaign-specific portfolio section on file',
    ],
    marketSignals: [
      'Strong demand for this profile type in US campaign market',
      'Lifestyle brand campaigns trending toward this aesthetic in Q3–Q4',
    ],
    suggestedNextSteps: [
      'Target lifestyle brand campaigns as first campaign category',
      'Build campaign-specific portfolio section with varied backdrops',
      'Approach mid-tier brand clients before luxury campaign submission',
    ],
  },
  Beauty: {
    score: 87,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Skin tone consistency and facial symmetry visible in the uploaded digitals score well against beauty and skincare campaign benchmarks. Close-crop face digitals show clear skin texture and even undertone — both critical for beauty context casting.',
    strengths: [
      'Skin tone consistency strong across all digitals — critical for beauty context',
      'Facial symmetry above benchmark for beauty casting criteria',
      'Undertone range supports broad beauty brand product matching',
      'Close-crop digital shows clear texture — important for skincare context',
    ],
    risks: [
      'Beauty and grooming portfolio not yet established',
      'On-set beauty performance under close-crop lighting not yet tested',
    ],
    marketSignals: [
      'Grooming and male beauty context demand growing in NYC market',
      'Skincare brands increasingly casting diverse male profiles',
    ],
    suggestedNextSteps: [
      'Schedule beauty-specific test shoot with close-crop focus',
      'Approach skincare and grooming brand clients in first submission wave',
      'Build beauty context section of portfolio as standalone chapter',
    ],
  },
  Sportswear: {
    score: 85,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Body proportion and muscle definition visible in fitted digitals align with sportswear casting benchmarks. Athletic build and clean posture support performance brand aesthetics. Proportions suggest natural movement range relevant to active and sportswear contexts.',
    strengths: [
      'Athletic proportion visible in digitals aligns with sportswear benchmarks',
      'Clean posture supports performance brand visual language',
      'Proportions suggest natural movement range for active contexts',
    ],
    risks: [
      'Movement and athletic performance cannot be assessed from static digitals',
      'Sportswear-specific imagery not yet on file',
    ],
    marketSignals: [
      'Performance brand casting increasingly overlapping with editorial aesthetics',
      'Demand for athletic-editorial hybrid profiles growing in US market',
    ],
    suggestedNextSteps: [
      'Schedule sportswear-specific test shoot with movement focus',
      'Submit to mid-tier performance brands before premium athletic clients',
      'Consider adding movement or video component to digitals submission',
    ],
  },
  Couture: {
    score: 82,
    fitLabel: 'MODERATE ALIGNMENT',
    reasoning:
      'Couture context requires the highest specificity in proportion, posture, and aesthetic neutrality. The uploaded digitals show strong potential but limited couture-specific positioning. Bone structure and facial geometry are appropriate — further evaluation recommended after test shoot.',
    strengths: [
      'Bone structure and facial geometry appropriate for couture context',
      'Aesthetic neutrality in digitals supports couture visual language',
      'Proportion ratio within range for structured couture garment silhouettes',
    ],
    risks: [
      'Couture context requires in-person evaluation to confirm proportion fit',
      'No couture-specific imagery to assess garment interaction',
      'Highest risk context for miscast — recommend test shoot before submission',
    ],
    marketSignals: [
      'Couture casting heavily relationship-driven — agency positioning matters',
      'European couture houses active in NYC casting seasonally',
    ],
    suggestedNextSteps: [
      'Do not submit to couture clients until test shoot confirms fit',
      'Schedule couture-focused test shoot with structured garment styling',
      'Review European couture house casting requirements before approach',
    ],
  },
  Swimwear: {
    score: 86,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Body proportion and physical condition visible in form-fitting digitals align with swimwear casting criteria. Torso-to-leg ratio and shoulder width are within benchmark range for menswear swimwear contexts in both editorial and commercial swimwear categories.',
    strengths: [
      'Torso-to-leg proportion within swimwear casting benchmark range',
      'Shoulder width supports both editorial and commercial swimwear framing',
      'Physical condition visible in fitted digitals is appropriate for context',
    ],
    risks: [
      'No swimwear-specific test imagery to assess on-location performance',
      'Outdoor and water-based shoot performance cannot be assessed from digitals',
    ],
    marketSignals: [
      'Swimwear editorial market active in Q1–Q2 for following season campaigns',
      'Demand for diverse male swimwear profiles growing in editorial context',
    ],
    suggestedNextSteps: [
      'Schedule swimwear test shoot before season submission window opens',
      'Target editorial swimwear submissions before commercial swimwear clients',
      'Build dedicated swimwear chapter in portfolio before broader submission',
    ],
  },
  Streetwear: {
    score: 89,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'The overall aesthetic presence in the digitals — facial structure, natural styling, and body proportions — aligns well with the current streetwear and urban fashion market. The look reads as contemporary and culturally relevant, which is the primary casting criterion for this context.',
    strengths: [
      'Overall aesthetic reads as contemporary and culturally relevant',
      'Natural styling in digitals aligns with streetwear brand visual language',
      'Facial structure supports both close-crop and full-body streetwear framing',
      'Proportions support layered and oversized streetwear silhouettes',
    ],
    risks: [
      'Streetwear context is trend-sensitive — timing of submission matters',
      'No streetwear-specific portfolio imagery on file',
    ],
    marketSignals: [
      'Urban fashion market highly active for this profile type in NYC',
      'Streetwear-editorial crossover trending strongly in current market cycle',
    ],
    suggestedNextSteps: [
      'Submit to streetwear and urban brand clients in current market window',
      'Build streetwear-specific portfolio section with contemporary styling',
      'Approach NYC-based streetwear brands before national brand submission',
    ],
  },
};

const GENERIC_CONTEXT_FALLBACK: ContextMockEntry = {
  score: 85,
  fitLabel: 'STRONG ALIGNMENT',
  reasoning: 'Strong alignment with context criteria based on uploaded digitals.',
  strengths: ['Digitals meet context benchmarks'],
  risks: ['Limited progression data on file'],
  marketSignals: ['Market demand present for this profile'],
  suggestedNextSteps: ['Schedule context-specific test shoot'],
};

const FALLBACK_CONTEXT_RESULTS = [
  { id: 1, context: 'Fragrance', score: 94 },
  { id: 2, context: 'Editorial', score: 96 },
  { id: 3, context: 'Campaign', score: 88 },
  { id: 4, context: 'Beauty', score: 91 },
];

const DIGITAL_STRIP = [
  { key: 'front' as const, label: 'FRONT' },
  { key: 'profile' as const, label: 'PROFILE' },
  { key: 'threeQuarter' as const, label: '3/4' },
  { key: 'fullBody' as const, label: 'FULL BODY' },
];

function getContextData(context: string): ContextMockEntry {
  return CONTEXT_MOCK_DATA[context] ?? GENERIC_CONTEXT_FALLBACK;
}

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
  const prospectName = searchParams.get('name')
    ? decodeURIComponent(searchParams.get('name')!)
    : 'Prospect';
  const contextsParam = searchParams.get('contexts') || '';
  const selectedContexts = contextsParam
    .split(',')
    .filter(Boolean);
  const profileType = searchParams.get('profileType') || 'prospect';
  const prospectId = searchParams.get('prospectId') || '';

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

  const contextResults = useMemo(
    () =>
      selectedContexts.length > 0
        ? selectedContexts.map((ctx, i) => ({
            id: i + 1,
            context: ctx,
            score: getContextData(ctx).score,
          }))
        : FALLBACK_CONTEXT_RESULTS,
    [contextsParam],
  );

  const [openContext, setOpenContext] = useState<string | null>(null);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideText, setOverrideText] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [agentNotes, setAgentNotes] = useState('');

  const getContextEvalData = (context: string) => getContextData(context);

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

    const fillBg = () => {
      doc.setFillColor(8, 8, 8);
      doc.rect(0, 0, pageW, pageH, 'F');
    };
    fillBg();

    const checkBreak = (need: number) => {
      if (y + need > pageH - margin) {
        doc.addPage();
        y = margin;
        fillBg();
      }
    };

    const label = (
      text: string,
      x: number,
      yPos: number,
      color: [number, number, number] = [136, 136, 128]
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
      color: [number, number, number] = [160, 160, 154]
    ): number => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxW);
      doc.text(lines, x, yPos);
      return lines.length * 4.2;
    };

    // ── HEADER ──────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(200, 169, 110);
    doc.text('CASTVIEW', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 128);
    doc.text(
      'castview.io  ·  hello@castview.io',
      pageW - margin,
      y,
      { align: 'right' }
    );
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(240, 240, 236);
    doc.text('Context Alignment Report', margin, y);
    y += 8;

    doc.setDrawColor(42, 42, 42);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    // ── PROSPECT ROW ────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 128);
    doc.text('PROSPECT', margin, y);
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
    doc.setFontSize(16);
    doc.setTextColor(240, 240, 236);
    doc.text(prospectName, margin, y);
    y += 10;

    doc.setDrawColor(42, 42, 42);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── PER-CONTEXT SECTIONS ─────────────────
    contextResults.forEach((result) => {
      const data = getContextEvalData(result.context);
      const scoreBarW = fullW * (result.score / 100);

      checkBreak(60);

      // Context header bar
      doc.setFillColor(20, 20, 20);
      doc.roundedRect(margin, y, fullW, 9, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(200, 169, 110);
      doc.text(result.context.toUpperCase(), margin + 5, y + 6);

      doc.setTextColor(240, 240, 236);
      doc.text(
        `${result.score}%  ${data.fitLabel}`,
        pageW - margin - 5,
        y + 6,
        { align: 'right' }
      );
      y += 11;

      // Score bar
      doc.setFillColor(30, 30, 30);
      doc.rect(margin, y, fullW, 2, 'F');
      doc.setFillColor(200, 169, 110);
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

      label('Strengths', leftX, leftY, [74, 122, 74]);
      leftY += 4;
      data.strengths.forEach((s) => {
        leftY += body(`→  ${s}`, leftX, leftY, col);
        leftY += 1;
      });
      leftY += 4;

      if (data.risks.length > 0) {
        label('Risks', leftX, leftY, [200, 122, 122]);
        leftY += 4;
        data.risks.forEach((r) => {
          leftY += body(`→  ${r}`, leftX, leftY, col);
          leftY += 1;
        });
      }

      // RIGHT COLUMN: Market Signals + Next Steps
      let rightY = startY;

      label('Market Signals', rightX, rightY);
      rightY += 4;
      data.marketSignals.forEach((m) => {
        rightY += body(`→  ${m}`, rightX, rightY, col);
        rightY += 1;
      });
      rightY += 5;

      label('Suggested Next Steps', rightX, rightY);
      rightY += 4;
      data.suggestedNextSteps.forEach((s) => {
        rightY += body(`→  ${s}`, rightX, rightY, col);
        rightY += 1;
      });

      // Move y past whichever column is taller
      y = Math.max(leftY, rightY) + 6;

      doc.setDrawColor(30, 30, 30);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    });

    // ── AGENT NOTES ─────────────────────────
    checkBreak(28);
    const notesText = agentNotes.trim() || 'No agent notes added.';
    const notesLines = doc.splitTextToSize(notesText, fullW - 12);
    const notesBoxH = notesLines.length * 4.5 + 14;

    doc.setFillColor(16, 16, 16);
    doc.roundedRect(margin, y, fullW, notesBoxH, 2, 2, 'F');
    doc.setDrawColor(42, 42, 42);
    doc.roundedRect(margin, y, fullW, notesBoxH, 2, 2, 'S');
    y += 6;
    label('Agent Notes', margin + 6, y, [200, 169, 110]);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(192, 192, 186);
    doc.text(notesLines, margin + 6, y);
    y += notesLines.length * 4.5 + 8;

    // ── DISCLAIMER ───────────────────────────
    checkBreak(24);
    doc.setDrawColor(42, 42, 42);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    const disclaimer =
      'This report is generated by AI analysis of uploaded digitals and is intended as a decision-support tool only. Context alignment scores do not constitute professional casting advice and should be used alongside agent judgment. CastView does not guarantee casting outcomes.';
    const dlLines = doc.splitTextToSize(disclaimer, fullW);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 86);
    doc.text(dlLines, margin, y);
    y += dlLines.length * 3.8 + 5;

    // ── FOOTER ───────────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 86);
    doc.text(
      'Prepared by CastView  ·  castview.io  ·  hello@castview.io',
      pageW / 2,
      y,
      { align: 'center' }
    );

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
            onClick={() => navigate('/share')}
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
            const data = getContextData(result.context);
            const isOpen = openContext === result.context;
            return (
              <div key={result.id}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenContext(isOpen ? null : result.context)
                  }
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
                      {data.score}%  {data.fitLabel}
                    </span>
                    <div className="flex items-center gap-[12px]">
                      <div
                        className="h-[2px] bg-[#2a2a2a] rounded-full overflow-hidden"
                        style={{ width: '80px' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${data.score}%`,
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
          
          <div className="mb-[24px]">
            <label 
              className="block mb-[12px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Team Notes
            </label>
            <textarea 
              className="w-full h-[100px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[16px] resize-none"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
              placeholder="Add notes for the team..."
            />
          </div>

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