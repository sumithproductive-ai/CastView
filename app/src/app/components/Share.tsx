import React, { useMemo } from 'react';
import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Copy, Check } from 'lucide-react';
import {
  createCastviewPdf,
  PDF_COLORS,
  pdfBody,
  pdfBullet,
  pdfCheckBreak,
  pdfDrawContextBar,
  pdfDrawHeader,
  pdfDrawMetaRow,
  pdfDrawPreparedBy,
  pdfDrawScoreBar,
  pdfHr,
  pdfLabel,
  pdfSave,
  pdfSafeText,
} from '../../lib/castviewPdf';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import { authFetch } from '../../lib/apiAuth';
import { useAuth } from '../context/AuthContext';

const deliveryMethods = [
  { name: 'Share Link', description: 'Generate a secure link' },
  { name: 'Export PDF', description: 'Download as PDF' },
  { name: 'Send Email', description: 'Email to client' }
];

export function Share() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prospectName = searchParams.get('name')
    ? decodeURIComponent(searchParams.get('name')!)
    : 'Prospect';
  const prospectId = searchParams.get('prospectId') || '';
  const profileType = searchParams.get('profileType') || 'prospect';
  const evaluationId = searchParams.get('evaluationId') || '';
  const [activeTab, setActiveTab] = useState<'messages' | 'export'>(() =>
    prospectId ? 'export' : 'messages',
  );
  const { prospects, loading: prospectsLoading } = useProspects();
  const { models, loading: rosterLoading } = useRoster();

  const messageContacts = useMemo(
    () => [
      ...prospects.map((prospect) => ({
        id: prospect.id,
        name: prospect.name,
        status: prospect.status,
        type: 'Prospect' as const,
        path: `/prospects/${prospect.id}`,
      })),
      ...models.map((model) => ({
        id: model.id,
        name: model.name,
        status: model.status,
        type: 'Model' as const,
        path: `/roster/${model.id}`,
      })),
    ].sort((a, b) => a.name.localeCompare(b.name)),
    [prospects, models],
  );
  const slug = prospectName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const month = new Date().toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  }).toLowerCase().replace(' ', '-');
  const shareLink = `castview.io/share/${slug}-${month}`;

  const contextsParam = searchParams.get('contexts') || '';
  const selectedContexts = contextsParam
    .split(',')
    .filter(Boolean);

  const CONTEXT_SCORES: Record<string, number> = {
    Fragrance: 94,
    Editorial: 91,
    Runway: 88,
    Campaign: 88,
    Beauty: 87,
    Sportswear: 85,
    Couture: 82,
    Swimwear: 86,
    Streetwear: 89,
  };

  const dynamicEvaluations =
    selectedContexts.length > 0
      ? selectedContexts.map((ctx, i) => ({
          id: i + 1,
          context: ctx,
          score: CONTEXT_SCORES[ctx] ?? 85,
          checked: true,
        }))
      : [
          { id: 1, context: 'Fragrance', score: 94, checked: true },
          { id: 2, context: 'Editorial', score: 91, checked: true },
        ];

  const [selectedMethod, setSelectedMethod] = useState('Export PDF');
  const [checkedEvaluations, setCheckedEvaluations] = useState<number[]>(
    dynamicEvaluations.map((e) => e.id),
  );
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState('7-days');
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [agentNotes, setAgentNotes] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Evaluation Report — ${prospectName}`);
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { agencyId } = useAuth();
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
    const entity = profileType === 'model'
      ? models.find(m => m.id === prospectId)
      : prospects.find(p => p.id === prospectId);

    const allEvals = entity?.digitalSets?.flatMap(ds => ds.evaluations ?? []) ?? [];
    const evaluation = allEvals.find(e => e.id === evaluationId) ?? allEvals[0];
    const contexts = evaluation?.contexts ?? [];

    const pdf = createCastviewPdf();
    pdfDrawHeader(pdf, false);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.setFontSize(22);
    pdf.doc.setTextColor(...PDF_COLORS.ink);
    pdf.doc.text(pdfSafeText(prospectName), pdf.margin, pdf.y);
    pdf.y += 10;

    if (entity) {
      const meta: string[] = [];
      if ((entity as { source?: string }).source) {
        meta.push(`Source: ${(entity as { source?: string }).source}`);
      }
      if ((entity as { height?: string }).height) {
        meta.push(`Height: ${(entity as { height?: string }).height}`);
      }
      if ((entity as { markets?: string[] }).markets?.length) {
        meta.push(`Markets: ${(entity as { markets?: string[] }).markets!.join(', ')}`);
      }
      if (evaluation?.completedAt) meta.push(`Evaluated: ${evaluation.completedAt}`);
      pdfDrawMetaRow(pdf, meta);
    }

    pdfHr(pdf);

    contexts.forEach((ctx) => {
      if (!ctx) return;
      const score = ctx.alignmentScore ?? 0;
      pdfCheckBreak(pdf, 60);
      pdfDrawContextBar(pdf, ctx.context ?? '', `${score}% ${ctx.fitLabel ?? ''}`);
      pdfDrawScoreBar(pdf, score);

      let contentY = pdf.y;
      pdfLabel(pdf, 'Reasoning', pdf.margin, contentY);
      contentY += 4;
      contentY += pdfBody(pdf, ctx.reasoning ?? '', pdf.margin, contentY, pdf.fullW) + 4;

      const leftX = pdf.margin;
      const rightX = pdf.margin + pdf.colW + 8;
      let leftY = contentY;
      let rightY = contentY;

      pdfLabel(pdf, 'Strengths', leftX, leftY, PDF_COLORS.success);
      leftY += 4;
      (ctx.strengths ?? []).forEach((s: string) => {
        leftY += pdfBullet(pdf, s, leftX, leftY, pdf.colW) + 1;
      });
      leftY += 4;

      if ((ctx.risks ?? []).length > 0) {
        pdfLabel(pdf, 'Risks', leftX, leftY, PDF_COLORS.risk);
        leftY += 4;
        (ctx.risks ?? []).forEach((r: string) => {
          leftY += pdfBullet(pdf, r, leftX, leftY, pdf.colW) + 1;
        });
      }

      pdfLabel(pdf, 'Market Signals', rightX, rightY);
      rightY += 4;
      (ctx.marketSignals ?? []).forEach((m: string) => {
        rightY += pdfBullet(pdf, m, rightX, rightY, pdf.colW) + 1;
      });
      rightY += 4;

      pdfLabel(pdf, 'Suggested Next Steps', rightX, rightY);
      rightY += 4;
      (ctx.suggestedNextSteps ?? []).forEach((s: string) => {
        rightY += pdfBullet(pdf, s, rightX, rightY, pdf.colW) + 1;
      });

      pdf.y = Math.max(leftY, rightY) + 6;
      pdf.doc.setDrawColor(...PDF_COLORS.line);
      pdf.doc.line(pdf.margin, pdf.y, pdf.pageW - pdf.margin, pdf.y);
      pdf.y += 6;
    });

    pdfDrawPreparedBy(pdf);
    pdfSave(pdf, `CastView-${pdfSafeText(prospectName)}-Evaluation.pdf`);
  };

  const checkedEvaluationContexts = dynamicEvaluations
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
  
  const tabButtonStyle = (isActive: boolean) => ({
    fontFamily: 'var(--font-mono)',
    backgroundColor: isActive ? 'var(--cv-primary-text)' : 'transparent',
    color: isActive ? 'var(--cv-background)' : 'var(--cv-secondary-text)',
    border: isActive ? 'none' : '1px solid var(--cv-subtle-border)',
  });

  return (
    <div className="p-[20px] md:p-[48px]">
      <h1
        className="text-[48px] mb-[24px]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
      >
        Messages
      </h1>

      <div className="flex gap-[8px] mb-[32px]">
        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className="px-[16px] py-[8px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors"
          style={tabButtonStyle(activeTab === 'messages')}
        >
          Messages
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className="px-[16px] py-[8px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors"
          style={tabButtonStyle(activeTab === 'export')}
        >
          Export
        </button>
      </div>

      {activeTab === 'messages' && (
        <div>
          {!prospectsLoading && !rosterLoading && messageContacts.length === 0 ? (
            <p
              className="py-[48px]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)' }}
            >
              No prospects yet. Add your first prospect to get started.
            </p>
          ) : (
            <div className="space-y-[8px] max-w-[720px]">
              {messageContacts.map((contact) => (
                <div
                  key={`${contact.type}-${contact.id}`}
                  className="flex items-center justify-between gap-[16px] p-[16px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] hover:bg-[var(--cv-elevated)] transition-colors"
                >
                  <div className="min-w-0">
                    <div
                      className="text-[13px] mb-[4px] truncate"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
                    >
                      {contact.name}
                    </div>
                    <div
                      className="text-[11px]"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
                    >
                      {contact.type} · {contact.status}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(contact.path)}
                    className="px-[14px] py-[8px] rounded-[4px] text-[11px] uppercase tracking-[0.08em] border border-[var(--cv-subtle-border)] hover:border-[var(--cv-primary-text)] transition-colors flex-shrink-0"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--cv-primary-text)',
                      cursor: 'pointer',
                    }}
                  >
                    Message →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--cv-secondary-text)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          letterSpacing: '0.05em',
          padding: 0,
          display: 'block',
          marginBottom: '24px',
        }}
      >
        ← BACK
      </button>

      <h1 
        className="text-[48px] mb-[8px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
      >
        Share Evaluation
      </h1>
      <button
        type="button"
        onClick={() => navigate('/mass-send')}
        className="mb-[40px] text-[11px] uppercase tracking-[0.1em] border border-[var(--cv-subtle-border)] px-[16px] py-[8px] rounded-[4px] hover:border-[var(--cv-primary-text)] transition-colors"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--cv-secondary-text)',
          cursor: 'pointer',
        }}
      >
        {'MASS SEND ->'}
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[48px]">
        {/* Left: Evaluation Selection */}
        <div>
          <div 
            className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
          >
            EVALUATION SELECTION
          </div>
          
          <div className="space-y-[16px]">
            {dynamicEvaluations.map((evaluation) => {
              const isChecked = checkedEvaluations.includes(evaluation.id);
              return (
                <label
                  key={evaluation.id}
                  className="flex items-center gap-[16px] p-[16px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] cursor-pointer hover:bg-[var(--cv-elevated)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleEvaluation(evaluation.id)}
                    className="w-[16px] h-[16px] accent-[var(--cv-primary-text)]"
                    style={{ cursor: 'pointer' }}
                  />
                  <div className="flex-1">
                    <div 
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)' }}
                    >
                      {evaluation.context}
                    </div>
                  </div>
                  <div 
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)' }}
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
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
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
                    isExportPdf ? 'border border-[var(--cv-primary-text)]' : ''
                  }`}
                  style={{ 
                    backgroundColor: isSelected ? 'var(--cv-elevated)' : 'var(--cv-surface)',
                    border: isExportPdf
                      ? undefined
                      : isSelected
                        ? '2px solid var(--cv-primary-text)'
                        : '2px solid var(--cv-subtle-border)'
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
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
                  >
                    {method.name}
                  </div>
                  <div 
                    className="text-[11px]"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
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
                style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
              >
                Link Settings
              </div>
              
              <div className="mb-[24px]">
                <label 
                  className="block mb-[12px] text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  Generated Link
                </label>
                <div className="flex gap-[8px]">
                  <input
                    ref={shareLinkInputRef}
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-[16px] py-[10px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)' }}
                  />
                  <button
                    onClick={handleCopy}
                    className="px-[16px] py-[10px] border border-[var(--cv-subtle-border)] rounded-[4px] transition-all text-[11px] uppercase tracking-[0.1em]"
                    style={{ 
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--cv-primary-text)',
                      backgroundColor: copied ? 'var(--cv-subtle-border)' : 'var(--cv-elevated)',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? 'COPIED ✓' : <Copy size={16} />}
                  </button>
                </div>
                <p style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '11px', 
                  color: 'var(--cv-secondary-text)',
                  marginTop: '8px'
                }}>
                  Link does not expire · Safe to forward internally · No login required for client
                </p>
              </div>
              
              <div className="mb-[24px]">
                <label 
                  className="block mb-[12px] text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  Expiry
                </label>
                <select
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-[16px] py-[10px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)' }}
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
                    className="w-[16px] h-[16px] accent-[var(--cv-primary-text)]"
                  />
                  <span 
                    className="text-[11px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                  >
                    Password Protection
                  </span>
                </label>
              </div>
              
              <button
                className="w-full py-[16px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] transition-colors"
                style={{ 
                  fontFamily: 'var(--font-label)',
                  backgroundColor: 'var(--cv-primary-text)',
                  color: 'var(--cv-background)'
                }}
              >
                Send to Client
              </button>
              
              <div className="mt-[24px]">
                <button
                  onClick={() => window.open('/client-portal', '_blank')}
                  className="flex items-center gap-[8px] px-[16px] py-[10px] border border-[var(--cv-subtle-border)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[var(--cv-primary-text)] hover:text-[var(--cv-primary-text)]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    color: 'var(--cv-secondary-text)',
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
                  color: 'var(--cv-secondary-text)',
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
                style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--cv-secondary-text)' }}
              >
                AGENT NOTES FOR REPORT
              </div>

              <textarea
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                placeholder="Add notes to include in the PDF report..."
                rows={5}
                className="w-full px-[16px] py-[12px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] mb-[16px] resize-none"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--cv-primary-text)'
                }}
              />

              <div
                className="mb-[16px]"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}
              >
                {checkedEvaluations.length} evaluation{checkedEvaluations.length !== 1 ? 's' : ''} will be included in the PDF report
              </div>

              <button
                onClick={generatePDF}
                className="w-full py-[16px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{
                  fontFamily: 'var(--font-label)',
                  backgroundColor: 'var(--cv-primary-text)',
                  color: 'var(--cv-background)',
                  cursor: 'pointer'
                }}
              >
                DOWNLOAD PDF REPORT
              </button>
            </div>
          )}
          
          {selectedMethod === 'Send Email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  placeholder="Recipient email"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  style={{ background: 'var(--cv-surface)', border: '1px solid var(--cv-subtle-border)', borderRadius: '4px', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-primary-text)', outline: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  style={{ background: 'var(--cv-surface)', border: '1px solid var(--cv-subtle-border)', borderRadius: '4px', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-primary-text)', outline: 'none' }}
                />
                <textarea
                  placeholder="Add a note..."
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={4}
                  style={{ background: 'var(--cv-surface)', border: '1px solid var(--cv-subtle-border)', borderRadius: '4px', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-primary-text)', resize: 'none', outline: 'none' }}
                />
                {emailSent ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#4a7a4a', letterSpacing: '0.08em' }}>✓ Email sent successfully</div>
                ) : (
                  <button
                    onClick={async () => {
                      if (!emailTo || !agencyId || !prospectId) return;
                      setEmailSending(true);
                      try {
                        const res = await authFetch('/api/send-message', {
                          method: 'POST',
                          body: JSON.stringify({
                            prospectId,
                            toEmail: emailTo,
                            toName: prospectName,
                            subject: emailSubject,
                            body: emailBody || `Please find the CastView alignment report for ${prospectName} attached.`,
                            agencyName: 'CastView Agency',
                          }),
                        });
                        if (res.ok) setEmailSent(true);
                      } finally {
                        setEmailSending(false);
                      }
                    }}
                    disabled={emailSending || !emailTo}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 20px', background: '#C8A96E', color: 'var(--cv-background)', border: 'none', borderRadius: '4px', cursor: !emailTo ? 'not-allowed' : 'pointer', opacity: !emailTo ? 0.5 : 1 }}
                  >
                    {emailSending ? 'SENDING...' : 'SEND EMAIL →'}
                  </button>
                )}
              </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
