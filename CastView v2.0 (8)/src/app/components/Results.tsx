import { useState } from 'react';
import { useNavigate } from 'react-router';

const renders = [
  { 
    id: 1, 
    context: 'Fragrance', 
    score: 94,
    image: 'https://images.unsplash.com/photo-1726232409367-04682eb856a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NzMwODU2NjF8MA&ixlib=rb-4.1.0&q=80&w=600' 
  },
  { 
    id: 2, 
    context: 'Editorial', 
    score: 96,
    image: 'https://images.unsplash.com/photo-1672675389084-5415d558dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBzaWRlJTIwcHJvZmlsZXxlbnwxfHx8fDE3NzMwODU2NjF8MA&ixlib=rb-4.1.0&q=80&w=600' 
  },
  { 
    id: 3, 
    context: 'Campaign', 
    score: 88,
    image: 'https://images.unsplash.com/photo-1674713406394-8f994f26432c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2RlbCUyMHBvcnRyYWl0JTIwYW5nbGUlMjB2aWV3fGVufDF8fHx8MTc3MzA4NTY2Nnww&ixlib=rb-4.1.0&q=80&w=600' 
  },
  { 
    id: 4, 
    context: 'Beauty', 
    score: 91,
    image: 'https://images.unsplash.com/photo-1627161683077-e34782c24d81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBtb2RlbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzA4NTY2M3ww&ixlib=rb-4.1.0&q=80&w=600' 
  }
];

const scores = [
  { label: 'Composition', value: 91 },
  { label: 'Style Match', value: 96 },
  { label: 'Versatility', value: 88 },
  { label: 'Market Fit', value: 94 }
];

export function Results() {
  const navigate = useNavigate();
  const [selectedRender, setSelectedRender] = useState(renders[0]);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideText, setOverrideText] = useState('');
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  return (
    <div className="p-[48px]">
      <h1 
        className="text-[48px] mb-[48px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        Sumith Chittimalla — Evaluation Results
      </h1>
      
      <div className="grid grid-cols-[1fr_320px] gap-[48px]">
        {/* Main Grid */}
        <div>
          <div className="grid grid-cols-2 gap-[24px]">
            {renders.map((render) => {
              const isSelected = selectedRender.id === render.id;
              return (
                <button
                  key={render.id}
                  onClick={() => setSelectedRender(render)}
                  className="text-left transition-all"
                  style={{ cursor: 'pointer' }}
                >
                  <div 
                    className="aspect-square bg-[#111111] rounded-[4px] mb-[16px] overflow-hidden"
                    style={{ 
                      border: isSelected ? '2px solid #f0f0ec' : '2px solid #2a2a2a'
                    }}
                  >
                    <img src={render.image} alt={render.context} className="w-full h-full object-cover" />
                  </div>
                  <div 
                    className="text-[11px] uppercase tracking-[0.1em] mb-[8px]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                  >
                    {render.context}
                  </div>
                  <div 
                    className="text-[11px] mb-[8px]"
                    style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
                  >
                    Visualization based on prospect attributes — for evaluation purposes only.
                  </div>
                  <div 
                    className="text-[40px]" 
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
                  >
                    {render.score}%
                  </div>
                  {(() => {
                    const score = render.score;
                    let label = '';
                    let color = '';
                    if (score >= 88) { 
                      label = 'STRONG FIT'; 
                      color = '#4a7a4a'; 
                    } else if (score >= 72) { 
                      label = 'MODERATE FIT'; 
                      color = '#7a6a3a'; 
                    } else { 
                      label = 'BELOW THRESHOLD'; 
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
              Fit Assessment
            </div>
            <div 
              className="text-[11px] mb-[32px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
            >
              Scored against historical shoot context criteria.
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
                  Why This Score
                </div>
                <button
                  onClick={() => setMethodologyOpen(true)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  HOW IS THIS SCORED?
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
                  <div>— Strong angular bone structure aligns with fragrance campaign framing criteria.</div>
                  <div>— Skin tone and undertone range scores well against editorial lighting benchmarks.</div>
                  <div>— Proportions support tight crop compositions typical of this context.</div>
                  <div>— Market positioning aligns with current European luxury fragrance casting trends.</div>
                </div>
                
                <div className="h-[1px] bg-[#2a2a2a] mb-[16px]" />
                
                <div className="flex items-center justify-between">
                  <div 
                    className="text-[10px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                  >
                    Agree With This Score?
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
                      {agreed ? '✓ Agreed' : 'Agree'}
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
                  Your feedback improves the scoring model for your agency.
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
              onClick={() => navigate('/share')}
              className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors"
              style={{ 
                fontFamily: 'var(--font-label)',
                backgroundColor: '#f0f0ec',
                color: '#080808'
              }}
            >
              Share Package
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
              How CastView scores a prospect
            </h2>

            {/* Body */}
            <div 
              className="text-[12px] mb-[24px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#c8c8c2', lineHeight: 1.8 }}
            >
              <p className="mb-[16px]">
                Every evaluation score is built from four dimensions, each weighted equally:
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
                Every time you click AGREE or OVERRIDE, that signal is used to refine the scoring model specifically for your agency's casting standards. Your overrides are private to your agency — they are never shared with other agencies or used to train a shared model.
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