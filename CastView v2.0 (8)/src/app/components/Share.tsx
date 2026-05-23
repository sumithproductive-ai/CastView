import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const renders = [
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
  const [selectedMethod, setSelectedMethod] = useState('Share Link');
  const [checkedRenders, setCheckedRenders] = useState<number[]>(renders.map(r => r.id));
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState('7-days');
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  
  const toggleRender = (id: number) => {
    setCheckedRenders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleCopy = () => {
    const link = 'castview.co/share/sumith-chittimalla-2026-05';
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
      const input = document.querySelector(
        'input[value="castview.co/share/sumith-chittimalla-2026-05"]'
      ) as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <div className="p-[48px]">
      <h1 
        className="text-[48px] mb-[48px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        Share — Sumith Chittimalla
      </h1>
      
      <div className="grid grid-cols-3 gap-[48px]">
        {/* Left: Render Selection */}
        <div>
          <div 
            className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            Include Evaluations
          </div>
          
          <div className="space-y-[16px]">
            {renders.map((render) => {
              const isChecked = checkedRenders.includes(render.id);
              return (
                <label
                  key={render.id}
                  className="flex items-center gap-[16px] p-[16px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleRender(render.id)}
                    className="w-[16px] h-[16px] accent-[#f0f0ec]"
                    style={{ cursor: 'pointer' }}
                  />
                  <div className="flex-1">
                    <div 
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
                    >
                      {render.context}
                    </div>
                  </div>
                  <div 
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a' }}
                  >
                    {render.score}%
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
              return (
                <button
                  key={method.name}
                  onClick={() => setSelectedMethod(method.name)}
                  className="w-full p-[20px] rounded-[4px] text-left transition-all cursor-pointer"
                  style={{ 
                    backgroundColor: isSelected ? '#1a1a1a' : '#111111',
                    border: isSelected ? '2px solid #f0f0ec' : '2px solid #2a2a2a'
                  }}
                >
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
                    type="text"
                    value="castview.co/share/sumith-chittimalla-2026-05"
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
            <div className="text-center py-[48px]">
              <div 
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a' }}
              >
                PDF export configuration
              </div>
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