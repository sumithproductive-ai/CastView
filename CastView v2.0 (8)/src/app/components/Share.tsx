import React from 'react';
import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Copy, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';

const evaluations = [
  { id: 1, context: 'Fragrance', score: 94, checked: true },
  { id: 2, context: 'Editorial', score: 96, checked: true },
  { id: 3, context: 'Campaign', score: 88, checked: true },
  { id: 4, context: 'Beauty', score: 91, checked: true }
];

const deliveryMethods = [
  { name: 'Share Link', description: 'Generate a secure link' },
  { name: 'Export PDF', description: 'Download as PDF' },
  { name: 'Send Email', description: 'Email to client' }
];

export function Share() {
  const [searchParams] = useSearchParams();
  const prospectName = searchParams.get('name')
    ? decodeURIComponent(searchParams.get('name')!)
    : 'Prospect';
  const slug = prospectName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const month = new Date().toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  }).toLowerCase().replace(' ', '-');
  const shareLink = `castview.io/share/${slug}-${month}`;

  const [selectedMethod, setSelectedMethod] = useState('Export PDF');
  const [checkedEvaluations, setCheckedEvaluations] = useState<number[]>(evaluations.map(e => e.id));
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState('7-days');
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [agentNotes, setAgentNotes] = useState('');
  const shareLinkInputRef = useRef<HTMLInputElement>(null);
  
  const toggleEvaluation = (id: number) => {
    setCheckedEvaluations(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleCopy = () => {
    const link = shareLink;
    if (navigator.clipboard && 
        navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          // Fallback for environments that block 
          // clipboard API (e.g. Figma sandbox)
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
    } else {
      // Fallback: select the input text
      const input = shareLinkInputRef.current;
      if (input) {
        input.select();
        document.execCommand('copy');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

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
      }
    };

    // ── HEADER ──
    doc.setFillColor(8, 8, 8);
    doc.rect(0, 0, 210, 297, 'F');

    addText('CASTVIEW', margin, 9, [200, 169, 110]);
    y += 6;
    addText('Context Alignment Report', margin, 22, [240, 240, 236], 'bold');
    y += 10;
    addText('castview.io · hello@castview.io', margin, 8, [136, 136, 128]);
    y += 10;

    // ── DIVIDER ──
    doc.setDrawColor(42, 42, 42);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ── PROSPECT INFO ──
    addText('PROSPECT', margin, 8, [136, 136, 128]);
    y += 5;
    addText('Sumith Chittimalla', margin, 18, [240, 240, 236], 'bold');
    y += 6;
    addText('Division: Men  ·  Primary Context: Fragrance  ·  Markets: NYC, London', margin, 8, [160, 160, 154]);
    y += 5;
    addText(`Report generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 8, [136, 136, 128]);
    y += 10;

    // ── OVERALL SUMMARY ──
    doc.setFillColor(26, 26, 26);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
    y += 6;
    addText('OVERALL SUMMARY', margin + 6, 7, [200, 169, 110]);
    y += 5;
    const summaryLines = doc.splitTextToSize(
      'Strong contextual alignment across luxury and editorial contexts based on uploaded digitals. Facial geometry, proportions, and market fit indicators score above benchmark across all evaluated contexts.',
      contentWidth - 12
    );
    doc.setFontSize(9);
    doc.setTextColor(192, 192, 186);
    doc.setFont('helvetica', 'normal');
    doc.text(summaryLines, margin + 6, y);
    y += summaryLines.length * 5 + 10;

    // ── CONTEXT EVALUATIONS ──
    const selectedEvals = evaluations.filter(e =>
      checkedEvaluations.includes(e.id)
    );

    const evalData: Record<string, {
      reasoning: string;
      strengths: string[];
      risks: string[];
      marketSignals: string[];
      suggestedNextSteps: string[];
      fitLabel: string;
    }> = {
      'Fragrance': {
        fitLabel: 'STRONG ALIGNMENT',
        reasoning: 'The uploaded digitals show strong alignment with current European luxury fragrance casting criteria. Facial geometry and proportions match the framing requirements of this context.',
        strengths: [
          'Strong angular bone structure aligns with fragrance campaign framing criteria',
          'Skin tone and undertone range scores well against editorial lighting benchmarks',
          'Proportions support tight crop compositions typical of this context'
        ],
        risks: ['Limited progression data — one digital set on file'],
        marketSignals: [
          'European luxury fragrance market trending toward this profile type',
          'High demand for this look in NYC and London markets'
        ],
        suggestedNextSteps: [
          'Schedule fragrance test shoot',
          'Approach luxury fragrance clients in NYC market first',
          'Upload updated digitals after next shoot for progression tracking'
        ]
      },
      'Editorial': {
        fitLabel: 'STRONG ALIGNMENT',
        reasoning: 'Editorial versatility indicators are high. Strong framing and posture in digitals support editorial and magazine contexts across European and US markets.',
        strengths: [
          'Strong editorial presence in digitals',
          'Versatile look range supports multiple editorial styles',
          'Bone structure reads well in both close-crop and full-frame compositions'
        ],
        risks: ['No editorial test shoot on file yet'],
        marketSignals: [
          'NYC editorial market active and receptive to this profile',
          'Strong alignment with current European editorial casting trends'
        ],
        suggestedNextSteps: [
          'Approach editorial clients in NYC and London',
          'Schedule editorial test shoot to build portfolio'
        ]
      },
      'Campaign': {
        fitLabel: 'STRONG ALIGNMENT',
        reasoning: 'Commercial appeal remains strong across campaign context benchmarks. Proportions and approachability scores are above average for brand advertising contexts.',
        strengths: [
          'High commercial appeal across broad consumer demographics',
          'Strong brand-fit indicators for lifestyle and luxury campaign contexts'
        ],
        risks: ['Campaign versatility requires test shoot confirmation'],
        marketSignals: ['Strong demand for this profile in US campaign market'],
        suggestedNextSteps: [
          'Target lifestyle brand campaigns first',
          'Build campaign-specific portfolio section'
        ]
      },
      'Beauty': {
        fitLabel: 'STRONG ALIGNMENT',
        reasoning: 'Skin tone consistency and facial symmetry indicators score well against beauty campaign benchmarks.',
        strengths: [
          'Skin tone scores well for beauty and skincare contexts',
          'Facial symmetry above benchmark for beauty casting criteria'
        ],
        risks: ['Beauty portfolio not yet established'],
        marketSignals: ['Beauty context demand growing in NYC market'],
        suggestedNextSteps: [
          'Schedule beauty-specific test shoot',
          'Approach skincare and grooming brand clients'
        ]
      }
    };

    selectedEvals.forEach((evaluation) => {
      const data = evalData[evaluation.context] ?? {
        fitLabel: 'STRONG ALIGNMENT',
        reasoning: 'Strong alignment with context criteria based on uploaded digitals.',
        strengths: ['Alignment criteria met'],
        risks: ['Limited data'],
        marketSignals: ['Market demand present'],
        suggestedNextSteps: ['Schedule test shoot']
      };

      checkPageBreak(80);

      // Context header bar
      doc.setFillColor(26, 26, 26);
      doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
      addText(evaluation.context.toUpperCase(), margin + 6, 8, [200, 169, 110], 'bold');

      // Score on right
      doc.setFontSize(8);
      doc.setTextColor(240, 240, 236);
      doc.setFont('helvetica', 'bold');
      doc.text(`${evaluation.score}%  ${data.fitLabel}`, pageWidth - margin - 6, y + 3, { align: 'right' });
      y += 14;

      // Score bar
      doc.setFillColor(42, 42, 42);
      doc.roundedRect(margin, y, contentWidth, 3, 1, 1, 'F');
      doc.setFillColor(200, 169, 110);
      doc.roundedRect(margin, y, contentWidth * (evaluation.score / 100), 3, 1, 1, 'F');
      y += 8;

      // Reasoning
      addText('REASONING', margin, 7, [136, 136, 128], 'bold');
      y += 4;
      const reasoningLines = doc.splitTextToSize(data.reasoning, contentWidth);
      doc.setFontSize(8);
      doc.setTextColor(192, 192, 186);
      doc.setFont('helvetica', 'normal');
      doc.text(reasoningLines, margin, y);
      y += reasoningLines.length * 4.5 + 5;

      // Strengths
      checkPageBreak(30);
      addText('STRENGTHS', margin, 7, [74, 122, 74], 'bold');
      y += 4;
      data.strengths.forEach(s => {
        const lines = doc.splitTextToSize(`→  ${s}`, contentWidth - 4);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 154);
        doc.setFont('helvetica', 'normal');
        doc.text(lines, margin + 2, y);
        y += lines.length * 4.5;
      });
      y += 3;

      // Risks
      if (data.risks.length > 0) {
        checkPageBreak(20);
        addText('RISKS', margin, 7, [200, 122, 122], 'bold');
        y += 4;
        data.risks.forEach(r => {
          const lines = doc.splitTextToSize(`→  ${r}`, contentWidth - 4);
          doc.setFontSize(8);
          doc.setTextColor(160, 160, 154);
          doc.setFont('helvetica', 'normal');
          doc.text(lines, margin + 2, y);
          y += lines.length * 4.5;
        });
        y += 3;
      }

      // Market Signals
      checkPageBreak(20);
      addText('MARKET SIGNALS', margin, 7, [136, 136, 128], 'bold');
      y += 4;
      data.marketSignals.forEach(m => {
        const lines = doc.splitTextToSize(`→  ${m}`, contentWidth - 4);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 154);
        doc.setFont('helvetica', 'normal');
        doc.text(lines, margin + 2, y);
        y += lines.length * 4.5;
      });
      y += 3;

      // Next Steps
      checkPageBreak(20);
      addText('SUGGESTED NEXT STEPS', margin, 7, [136, 136, 128], 'bold');
      y += 4;
      data.suggestedNextSteps.forEach(step => {
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

    // ── AGENT NOTES ──
    checkPageBreak(30);
    addText('AGENT NOTES', margin, 8, [200, 169, 110], 'bold');
    y += 5;
    doc.setFillColor(20, 20, 20);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
    y += 6;
    const notesText = agentNotes.trim() || 'No agent notes added for this evaluation.';
    const notesLines = doc.splitTextToSize(notesText, contentWidth - 12);
    doc.setFontSize(8.5);
    doc.setTextColor(192, 192, 186);
    doc.setFont('helvetica', 'normal');
    doc.text(notesLines, margin + 6, y);
    y += notesLines.length * 5 + 14;

    // ── DISCLAIMER ──
    checkPageBreak(30);
    doc.setDrawColor(42, 42, 42);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    addText('DISCLAIMER', margin, 7, [136, 136, 128], 'bold');
    y += 4;
    const disclaimer = 'This report is generated by AI analysis of uploaded digitals and is intended as a decision-support tool only. Context alignment scores do not constitute professional casting advice and should be used alongside agent judgment. CastView does not guarantee casting outcomes. All evaluations reflect the digitals available at time of analysis.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 96);
    doc.setFont('helvetica', 'normal');
    doc.text(disclaimerLines, margin, y);
    y += disclaimerLines.length * 4 + 8;

    // ── FOOTER ──
    addText('Prepared by CastView  ·  castview.io  ·  hello@castview.io', margin, 7, [100, 100, 96]);

    doc.save('CastView-Sumith-Chittimalla-Evaluation.pdf');
  };

  const checkedEvaluationContexts = evaluations
    .filter((e) => checkedEvaluations.includes(e.id))
    .map((e) => e.context);

  const handleSendEmail = () => {
    const subject = encodeURIComponent(
      `CastView Evaluation — ${prospectName}`
    );
    const body = encodeURIComponent(
      `Hi,\n\nPlease find the context alignment evaluation for ${prospectName} via the link below.\n\n${shareLink}\n\nEvaluated contexts: ${checkedEvaluationContexts.join(', ')}\n\nBest regards`
    );
    window.open(
      `mailto:?subject=${subject}&body=${body}`
    );
  };
  
  return (
    <div className="p-[48px]">
      <h1 
        className="text-[48px] mb-[48px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        Share Evaluation
      </h1>
      
      <div className="grid grid-cols-3 gap-[48px]">
        {/* Left: Evaluation Selection */}
        <div>
          <div 
            className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            EVALUATION SELECTION
          </div>
          
          <div className="space-y-[16px]">
            {evaluations.map((evaluation) => {
              const isChecked = checkedEvaluations.includes(evaluation.id);
              return (
                <label
                  key={evaluation.id}
                  className="flex items-center gap-[16px] p-[16px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleEvaluation(evaluation.id)}
                    className="w-[16px] h-[16px] accent-[#f0f0ec]"
                    style={{ cursor: 'pointer' }}
                  />
                  <div className="flex-1">
                    <div 
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
                    >
                      {evaluation.context}
                    </div>
                  </div>
                  <div 
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a' }}
                  >
                    {evaluation.score}%
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        
        {/* Center: Delivery Method */}
        <div>
          <div 
            className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            Delivery Method
          </div>
          
          <div className="space-y-[16px]">
            {deliveryMethods.map((method) => {
              const isSelected = selectedMethod === method.name;
              const isExportPdf = method.name === 'Export PDF';
              return (
                <button
                  key={method.name}
                  onClick={() => {
                    setSelectedMethod(method.name);
                    if (method.name === 'Send Email') {
                      handleSendEmail();
                    }
                  }}
                  className={`w-full p-[20px] rounded-[4px] text-left transition-all cursor-pointer ${
                    isExportPdf ? 'border border-[#f0f0ec]' : ''
                  }`}
                  style={{ 
                    backgroundColor: isSelected ? '#1a1a1a' : '#111111',
                    border: isExportPdf
                      ? undefined
                      : isSelected
                        ? '2px solid #f0f0ec'
                        : '2px solid #2a2a2a'
                  }}
                >
                  {isExportPdf && (
                    <div
                      className="mb-[8px] uppercase"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: '#C8A96E',
                      }}
                    >
                      RECOMMENDED
                    </div>
                  )}
                  <div 
                    className="text-[13px] mb-[4px]"
                    style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                  >
                    {method.name}
                  </div>
                  <div 
                    className="text-[11px]"
                    style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
                  >
                    {method.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Right: Link Options */}
        <div data-tutorial="share-panel">
          {selectedMethod === 'Share Link' && (
            <>
              <div 
                className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
                style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
              >
                Link Settings
              </div>
              
              <div className="mb-[24px]">
                <label 
                  className="block mb-[12px] text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  Generated Link
                </label>
                <div className="flex gap-[8px]">
                  <input
                    ref={shareLinkInputRef}
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-[16px] py-[10px] bg-[#111111] border border-[#2a2a2a] rounded-[4px]"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
                  />
                  <button
                    onClick={handleCopy}
                    className="px-[16px] py-[10px] border border-[#2a2a2a] rounded-[4px] transition-all text-[11px] uppercase tracking-[0.1em]"
                    style={{ 
                      fontFamily: 'var(--font-mono)',
                      color: '#f0f0ec',
                      backgroundColor: copied ? '#2a2a2a' : '#1a1a1a',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? 'COPIED ✓' : <Copy size={16} />}
                  </button>
                </div>
                <p style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '11px', 
                  color: '#888880',
                  marginTop: '8px'
                }}>
                  Link does not expire · Safe to forward internally · No login required for client
                </p>
              </div>
              
              <div className="mb-[24px]">
                <label 
                  className="block mb-[12px] text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  Expiry
                </label>
                <select
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-[16px] py-[10px] bg-[#111111] border border-[#2a2a2a] rounded-[4px]"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
                >
                  <option value="24-hours">24 Hours</option>
                  <option value="7-days">7 Days</option>
                  <option value="30-days">30 Days</option>
                  <option value="never">Never Expires</option>
                </select>
              </div>
              
              <div className="mb-[32px]">
                <label className="flex items-center gap-[12px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passwordEnabled}
                    onChange={(e) => setPasswordEnabled(e.target.checked)}
                    className="w-[16px] h-[16px] accent-[#f0f0ec]"
                  />
                  <span 
                    className="text-[11px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                  >
                    Password Protection
                  </span>
                </label>
              </div>
              
              <button
                className="w-full py-[16px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] transition-colors"
                style={{ 
                  fontFamily: 'var(--font-label)',
                  backgroundColor: '#f0f0ec',
                  color: '#080808'
                }}
              >
                Send to Client
              </button>
              
              <div className="mt-[24px]">
                <button
                  onClick={() => window.open('/client-portal', '_blank')}
                  className="flex items-center gap-[8px] px-[16px] py-[10px] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[#f0f0ec] hover:text-[#f0f0ec]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    color: '#888880',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 6a5 5 0 1 0 10 0A5 5 0 0 0 1 6z" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4.5 6a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0z" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  PREVIEW CLIENT VIEW
                </button>
                <p style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '10px', 
                  color: '#555550',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  See exactly what your client will see before sending.
                </p>
              </div>
            </>
          )}
          
          {selectedMethod === 'Export PDF' && (
            <div>
              <div
                className="mb-[12px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#888880' }}
              >
                AGENT NOTES FOR REPORT
              </div>

              <textarea
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                placeholder="Add notes to include in the PDF report..."
                rows={5}
                className="w-full px-[16px] py-[12px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] mb-[16px] resize-none"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#f0f0ec'
                }}
              />

              <div
                className="mb-[16px]"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880' }}
              >
                {checkedEvaluations.length} evaluation{checkedEvaluations.length !== 1 ? 's' : ''} will be included in the PDF report
              </div>

              <button
                onClick={generatePDF}
                className="w-full py-[16px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{
                  fontFamily: 'var(--font-label)',
                  backgroundColor: '#f0f0ec',
                  color: '#080808',
                  cursor: 'pointer'
                }}
              >
                DOWNLOAD PDF REPORT
              </button>
            </div>
          )}
          
          {selectedMethod === 'Send Email' && (
            <div className="text-center py-[48px]">
              <div 
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a' }}
              >
                Email delivery options
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
