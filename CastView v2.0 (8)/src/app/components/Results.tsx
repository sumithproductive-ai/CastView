import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { jsPDF } from 'jspdf';
import { SUMITH_DIGITAL_SET_V1 } from '../constants/sumithProspect';

const mostRecentDigitalSet = SUMITH_DIGITAL_SET_V1;
const frontDigital = mostRecentDigitalSet.front!;

const MOCK_SCORES = [94, 96, 88, 91, 85, 89, 92, 87, 90, 93];

const FALLBACK_CONTEXT_RESULTS = [
  { id: 1, context: 'Fragrance', score: 94 },
  { id: 2, context: 'Editorial', score: 96 },
  { id: 3, context: 'Campaign', score: 88 },
  { id: 4, context: 'Beauty', score: 91 },
];

const scores = [
  { label: 'Composition', value: 91 },
  { label: 'Style Match', value: 96 },
  { label: 'Versatility', value: 88 },
  { label: 'Market Fit', value: 94 }
];

const evaluationData = {
  overallSummary:
    'Strong contextual alignment across luxury and editorial contexts based on uploaded digitals.',
  contextEvaluations: [
    {
      context: 'Fragrance',
      alignmentScore: 94,
      strengths: [
        'Strong angular bone structure aligns with fragrance campaign framing criteria',
        'Skin tone and undertone range scores well against editorial lighting benchmarks',
        'Proportions support tight crop compositions typical of this context',
      ],
      risks: ['Limited progression data — one digital set on file'],
      reasoning:
        'The uploaded digitals show strong alignment with current European luxury fragrance casting criteria. Facial geometry and proportions match the framing requirements of this context.',
      marketSignals: [
        'European luxury fragrance market currently trending toward this profile type',
        'High demand for this look in NYC and London markets',
      ],
      suggestedNextSteps: [
        'Schedule fragrance test shoot',
        'Approach luxury fragrance clients in NYC market first',
        'Upload updated digitals after next shoot for progression tracking',
      ],
    },
  ],
  progressionComparison: {
    summary: 'First evaluation — no previous digitals to compare.',
    improvedContexts: [],
    weakenedContexts: [],
    reasoning:
      'Upload a second set of digitals to enable progression analysis.',
  },
};

const alignmentBulletStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  lineHeight: 1.6,
  color: '#a0a09a',
} as const;

function AlignmentBulletList({ items }: { items: string[] }) {
  return (
    <div style={alignmentBulletStyle}>
      {items.map((item, index) => (
        <div key={index}>
          <span style={{ color: '#C8A96E' }}>→ </span>
          {item}
        </div>
      ))}
    </div>
  );
}

export function Results() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prospectName = searchParams.get('name')
    ? decodeURIComponent(searchParams.get('name')!)
    : 'Prospect';
  const contextsParam = searchParams.get('contexts') || '';
  const selectedContexts = contextsParam
    .split(',')
    .filter(Boolean);
  const profileType = searchParams.get('profileType') || 'prospect';
  const prospectId = searchParams.get('prospectId') || '';

  const contextResults = useMemo(
    () =>
      selectedContexts.length > 0
        ? selectedContexts.map((ctx, i) => ({
            id: i + 1,
            context: ctx,
            score: MOCK_SCORES[i % 10],
          }))
        : FALLBACK_CONTEXT_RESULTS,
    [contextsParam],
  );

  const [selectedResult, setSelectedResult] = useState(contextResults[0]);

  useEffect(() => {
    setSelectedResult(contextResults[0]);
  }, [contextResults]);

  const activeContextEvaluation =
    evaluationData.contextEvaluations.find(
      (evaluation) => evaluation.context === selectedResult.context
    ) ?? evaluationData.contextEvaluations[0];
  const [showOverride, setShowOverride] = useState(false);
  const [overrideText, setOverrideText] = useState('');
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agentNotes, setAgentNotes] = useState('');

  const getFitLabel = (score: number) => {
    if (score >= 88) return 'STRONG ALIGNMENT';
    if (score >= 72) return 'MODERATE ALIGNMENT';
    return 'LOW ALIGNMENT';
  };

  const getContextEvalData = (context: string, score: number) => {
    const found = evaluationData.contextEvaluations.find(
      (evaluation) => evaluation.context === context
    );
    if (found) {
      return {
        reasoning: found.reasoning,
        strengths: found.strengths,
        risks: found.risks,
        suggestedNextSteps: found.suggestedNextSteps,
        fitLabel: getFitLabel(score),
      };
    }
    return {
      reasoning:
        'Uploaded digitals show strong alignment with current market criteria for this context.',
      strengths: [
        'Strong alignment with context criteria',
        'Digitals score above benchmark',
      ],
      risks: ['Limited progression data on file'],
      suggestedNextSteps: [
        'Schedule test shoot',
        'Upload updated digitals for progression tracking',
      ],
      fitLabel: getFitLabel(score),
    };
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const fillDarkBackground = () => {
      doc.setFillColor(8, 8, 8);
      doc.rect(0, 0, 210, 297, 'F');
    };

    fillDarkBackground();

    const addText = (
      text: string,
      x: number,
      fontSize: number,
      color: [number, number, number],
      style: 'normal' | 'bold' = 'normal'
    ) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
      doc.setFont('helvetica', style);
      doc.text(text, x, y);
    };

    const checkPageBreak = (neededSpace: number) => {
      if (y + neededSpace > 277) {
        doc.addPage();
        y = 20;
        fillDarkBackground();
      }
    };

    // HEADER
    addText('CASTVIEW', margin, 9, [200, 169, 110]);
    y += 6;
    addText('Context Alignment Report', margin, 22, [240, 240, 236], 'bold');
    y += 10;
    addText('castview.io', margin, 8, [136, 136, 128]);
    y += 10;

    doc.setDrawColor(42, 42, 42);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // PROSPECT INFO
    addText('PROSPECT', margin, 8, [136, 136, 128]);
    y += 5;
    addText(prospectName, margin, 18, [240, 240, 236], 'bold');
    y += 6;
    addText(
      `Report generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      margin,
      8,
      [136, 136, 128]
    );
    y += 10;

    // OVERALL SUMMARY
    doc.setFillColor(26, 26, 26);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
    y += 6;
    addText('OVERALL SUMMARY', margin + 6, 7, [200, 169, 110]);
    y += 5;
    const summaryLines = doc.splitTextToSize(
      evaluationData.overallSummary,
      contentWidth - 12
    );
    doc.setFontSize(9);
    doc.setTextColor(192, 192, 186);
    doc.setFont('helvetica', 'normal');
    doc.text(summaryLines, margin + 6, y);
    y += summaryLines.length * 5 + 10;

    // PER-CONTEXT SECTIONS
    contextResults.forEach((result) => {
      const data = getContextEvalData(result.context, result.score);

      checkPageBreak(80);

      doc.setFillColor(26, 26, 26);
      doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
      addText(result.context.toUpperCase(), margin + 6, 8, [200, 169, 110], 'bold');

      doc.setFontSize(8);
      doc.setTextColor(240, 240, 236);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `${result.score}%  ${data.fitLabel}`,
        pageWidth - margin - 6,
        y + 3,
        { align: 'right' }
      );
      y += 14;

      doc.setFillColor(42, 42, 42);
      doc.roundedRect(margin, y, contentWidth, 3, 1, 1, 'F');
      doc.setFillColor(200, 169, 110);
      doc.roundedRect(
        margin,
        y,
        contentWidth * (result.score / 100),
        3,
        1,
        1,
        'F'
      );
      y += 8;

      addText('REASONING', margin, 7, [136, 136, 128], 'bold');
      y += 4;
      const reasoningLines = doc.splitTextToSize(data.reasoning, contentWidth);
      doc.setFontSize(8);
      doc.setTextColor(192, 192, 186);
      doc.setFont('helvetica', 'normal');
      doc.text(reasoningLines, margin, y);
      y += reasoningLines.length * 4.5 + 5;

      checkPageBreak(30);
      addText('STRENGTHS', margin, 7, [74, 122, 74], 'bold');
      y += 4;
      data.strengths.forEach((s) => {
        const lines = doc.splitTextToSize(`→  ${s}`, contentWidth - 4);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 154);
        doc.setFont('helvetica', 'normal');
        doc.text(lines, margin + 2, y);
        y += lines.length * 4.5;
      });
      y += 3;

      if (data.risks.length > 0) {
        checkPageBreak(20);
        addText('RISKS', margin, 7, [200, 122, 122], 'bold');
        y += 4;
        data.risks.forEach((r) => {
          const lines = doc.splitTextToSize(`→  ${r}`, contentWidth - 4);
          doc.setFontSize(8);
          doc.setTextColor(160, 160, 154);
          doc.setFont('helvetica', 'normal');
          doc.text(lines, margin + 2, y);
          y += lines.length * 4.5;
        });
        y += 3;
      }

      checkPageBreak(20);
      addText('SUGGESTED NEXT STEPS', margin, 7, [136, 136, 128], 'bold');
      y += 4;
      data.suggestedNextSteps.forEach((step) => {
        const lines = doc.splitTextToSize(`→  ${step}`, contentWidth - 4);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 154);
        doc.setFont('helvetica', 'normal');
        doc.text(lines, margin + 2, y);
        y += lines.length * 4.5;
      });

      y += 8;
      doc.setDrawColor(42, 42, 42);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    });

    // AGENT NOTES
    checkPageBreak(30);
    addText('AGENT NOTES', margin, 8, [200, 169, 110], 'bold');
    y += 5;
    doc.setFillColor(20, 20, 20);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
    y += 6;
    const notesText = agentNotes.trim() || 'No agent notes added.';
    const notesLines = doc.splitTextToSize(notesText, contentWidth - 12);
    doc.setFontSize(8.5);
    doc.setTextColor(192, 192, 186);
    doc.setFont('helvetica', 'normal');
    doc.text(notesLines, margin + 6, y);
    y += notesLines.length * 5 + 14;

    // DISCLAIMER
    checkPageBreak(30);
    doc.setDrawColor(42, 42, 42);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    addText('DISCLAIMER', margin, 7, [136, 136, 128], 'bold');
    y += 4;
    const disclaimer =
      'This report is generated by AI analysis of uploaded digitals and is intended as a decision-support tool only. Context alignment scores do not constitute professional casting advice and should be used alongside agent judgment. CastView does not guarantee casting outcomes. All evaluations reflect the digitals available at time of analysis.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 96);
    doc.setFont('helvetica', 'normal');
    doc.text(disclaimerLines, margin, y);
    y += disclaimerLines.length * 4 + 8;

    // FOOTER
    addText(
      'Prepared by CastView  ·  castview.io  ·  hello@castview.io',
      margin,
      7,
      [100, 100, 96]
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
        {/* Main Grid */}
        <div>
          <div className="grid grid-cols-2 gap-[24px]">
            {contextResults.map((result) => {
              const isSelected = selectedResult.id === result.id;
              return (
                <button
                  key={result.id}
                  onClick={() => setSelectedResult(result)}
                  className="text-left transition-all"
                  style={{ cursor: 'pointer' }}
                >
                  <div 
                    className="aspect-square bg-[#111111] rounded-[4px] mb-[16px] overflow-hidden"
                    style={{ 
                      border: isSelected ? '2px solid #f0f0ec' : '2px solid #2a2a2a'
                    }}
                  >
                    <img src={frontDigital} alt={result.context} className="w-full h-full object-cover" />
                  </div>
                  <p
                    className="mb-[8px]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color: '#888880',
                      fontStyle: 'italic',
                    }}
                  >
                    Evaluation based on uploaded digitals
                  </p>
                  <div 
                    className="text-[11px] uppercase tracking-[0.1em] mb-[8px]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                  >
                    {result.context}
                  </div>
                  <div 
                    className="text-[40px]" 
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
                  >
                    {result.score}%
                  </div>
                  {(() => {
                    const score = result.score;
                    let label = '';
                    let color = '';
                    if (score >= 88) { 
                      label = 'STRONG ALIGNMENT'; 
                      color = '#4a7a4a'; 
                    } else if (score >= 72) { 
                      label = 'MODERATE ALIGNMENT'; 
                      color = '#7a6a3a'; 
                    } else { 
                      label = 'LOW ALIGNMENT'; 
                      color = '#7a3a3a'; 
                    }
                    return (
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        marginTop: '4px'
                      }}>
                        {label}
                      </div>
                    );
                  })()}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Right Panel */}
        <div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] mb-[24px]">
            <div 
              className="text-[11px] uppercase tracking-[0.1em] mb-[8px]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Context Alignment
            </div>
            <div 
              className="text-[11px] mb-[32px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
            >
              Analysed against market context indicators and uploaded digitals.
            </div>
            
            <div className="space-y-[24px] mb-[32px]">
              {scores.map((score) => (
                <div key={score.label}>
                  <div className="flex justify-between mb-[8px]">
                    <span 
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a' }}
                    >
                      {score.label}
                    </span>
                    <span 
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
                    >
                      {score.value}%
                    </span>
                  </div>
                  <div className="h-[4px] bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#f0f0ec] rounded-full"
                      style={{ width: `${score.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Score Explanation Panel */}
            <div data-tutorial="score-panel">
              <div 
                className="flex items-center justify-between mb-[12px]"
              >
                <div 
                  className="text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  Why This Alignment
                </div>
                <button
                  onClick={() => setMethodologyOpen(true)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  HOW IS THIS EVALUATED?
                </button>
              </div>
              
              <div 
                className="border rounded-[4px] p-[16px]"
                style={{ backgroundColor: '#0d0d0d', borderColor: '#2a2a2a' }}
              >
                <div 
                  className="mb-[16px]"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6, color: '#a0a09a' }}
                >
                  {activeContextEvaluation.reasoning}
                </div>

                <div className="mb-[16px]">
                  <div 
                    className="text-[11px] uppercase tracking-[0.1em] mb-[8px]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                  >
                    STRENGTHS
                  </div>
                  <AlignmentBulletList items={activeContextEvaluation.strengths} />
                </div>

                <div className="mb-[16px]">
                  <div 
                    className="text-[11px] uppercase tracking-[0.1em] mb-[8px]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                  >
                    RISKS
                  </div>
                  <AlignmentBulletList items={activeContextEvaluation.risks} />
                </div>

                <div className="mb-[16px]">
                  <div 
                    className="text-[11px] uppercase tracking-[0.1em] mb-[8px]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                  >
                    MARKET SIGNALS
                  </div>
                  <AlignmentBulletList items={activeContextEvaluation.marketSignals} />
                </div>

                <div className="mb-[16px]">
                  <div 
                    className="text-[11px] uppercase tracking-[0.1em] mb-[8px]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                  >
                    SUGGESTED NEXT STEPS
                  </div>
                  <AlignmentBulletList items={activeContextEvaluation.suggestedNextSteps} />
                </div>
                
                <div className="h-[1px] bg-[#2a2a2a] mb-[16px]" />
                
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
            </div>
          </div>
          
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
          
          <div className="space-y-[12px]">
            <button
              className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors border"
              style={{ 
                fontFamily: 'var(--font-label)',
                backgroundColor: 'transparent',
                borderColor: '#2a2a2a',
                color: '#f0f0ec'
              }}
            >
              Shortlist
            </button>
            <button
              className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors"
              style={{ 
                fontFamily: 'var(--font-label)',
                backgroundColor: 'transparent',
                color: '#a0a09a'
              }}
            >
              Pass
            </button>
          </div>
        </div>
      </div>

      {/* Methodology Modal */}
      {methodologyOpen && (
        <div 
          className="fixed inset-0 bg-[rgba(8,8,8,0.92)] flex items-center justify-center z-50"
          onClick={() => setMethodologyOpen(false)}
        >
          <div 
            className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[32px] max-w-[560px] w-full max-h-[80vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setMethodologyOpen(false)}
              className="absolute top-[16px] right-[16px] text-[20px] hover:opacity-70 transition-opacity"
              style={{ color: '#888880', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
            >
              ×
            </button>

            {/* Headline */}
            <h2 
              className="text-[28px] mb-[24px]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
            >
              How CastView evaluates a prospect
            </h2>

            {/* Body */}
            <div 
              className="text-[12px] mb-[24px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#c8c8c2', lineHeight: 1.8 }}
            >
              <p className="mb-[16px]">
                Every alignment score is built from four dimensions, each weighted equally:
              </p>

              <p className="mb-[12px]">
                <strong style={{ color: '#f0f0ec' }}>COMPOSITION (25%)</strong><br />
                How well the prospect's physical attributes — bone structure, proportions, coloring — translate into the selected shoot context. Lighting, framing, and spatial composition are all considered.
              </p>

              <p className="mb-[12px]">
                <strong style={{ color: '#f0f0ec' }}>STYLE MATCH (25%)</strong><br />
                The degree to which the prospect's look aligns with established visual language for this context. Fragrance campaigns, for example, favour strong facial geometry and high contrast.
              </p>

              <p className="mb-[12px]">
                <strong style={{ color: '#f0f0ec' }}>VERSATILITY (25%)</strong><br />
                Whether the prospect's attributes can flex across variations within this context — close-up versus wide frame, soft versus dramatic lighting.
              </p>

              <p className="mb-[12px]">
                <strong style={{ color: '#f0f0ec' }}>MARKET FIT (25%)</strong><br />
                How the prospect compares to models that have been successfully cast in this context by agencies in your market.
              </p>

              <p className="mb-[12px]" style={{ marginTop: '16px' }}>
                <strong style={{ color: '#f0f0ec' }}>Your feedback improves accuracy over time.</strong><br />
                Every time you confirm or override an alignment score, that signal is used to refine the evaluation model specifically for your agency's casting standards. Your overrides are private to your agency — they are never shared with other agencies or used to train a shared model.
              </p>
            </div>

            {/* Footer */}
            <div 
              className="text-[11px] italic"
              style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
            >
              Model last updated: March 2026 · v2.1 · Trained on agency feedback
            </div>
          </div>
        </div>
      )}
    </div>
  );
}