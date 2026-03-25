import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { ChevronRight, ChevronDown, Upload, X, Plus } from 'lucide-react';

const modelData = {
  name: 'Sofia Andersen',
  status: 'ACTIVE',
  dateSigned: 'July 2, 2025',
  primaryImage: 'https://images.unsplash.com/photo-1708170236080-6cb6d2d5497c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZGl0b3JpYWwlMjBmYXNoaW9uJTIwdmVydGljYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMxNjUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
  measurements: {
    Height: '5\'10"',
    Bust: '32"',
    Waist: '24"',
    Hips: '35"',
    Hair: 'Blonde',
    Eyes: 'Blue'
  },
  markets: ['NEW YORK', 'LONDON', 'PARIS'],
  sessions: [
    {
      date: 'March 10, 2026',
      contextsCount: 4,
      topScore: 96,
      isProspectEra: false,
      renders: [
        {
          id: 1,
          context: 'Fragrance',
          score: 94,
          image: 'https://images.unsplash.com/photo-1761329842950-f3551938e4da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFncmFuY2UlMjBlZGl0b3JpYWwlMjBtb2RlbCUyMHBob3RvfGVufDF8fHx8MTc3MzE2NTMzMnww&ixlib=rb-4.1.0&q=80&w=1080',
          isPrimary: true
        },
        {
          id: 2,
          context: 'Editorial',
          score: 96,
          image: 'https://images.unsplash.com/photo-1708170236080-6cb6d2d5497c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZGl0b3JpYWwlMjBmYXNoaW9uJTIwdmVydGljYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMxNjUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
          isPrimary: false
        },
        {
          id: 3,
          context: 'Campaign',
          score: 88,
          image: 'https://images.unsplash.com/photo-1697677103505-dd4b2dbf1b1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wYWlnbiUyMGZhc2hpb24lMjBzaG9vdHxlbnwxfHx8fDE3NzMxNjUzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
          isPrimary: false
        },
        {
          id: 4,
          context: 'Beauty',
          score: 91,
          image: 'https://images.unsplash.com/photo-1759873911657-8140566c29a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBlZGl0b3JpYWwlMjBwb3J0cmFpdCUyMHNxdWFyZXxlbnwxfHx8fDE3NzMxNjUzMzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
          isPrimary: false
        }
      ],
      notes: 'Post-Milan digitals update — strongest set to date',
      expanded: true
    },
    {
      date: 'November 14, 2025',
      contextsCount: 3,
      topScore: 83,
      isProspectEra: false,
      renders: [
        {
          id: 5,
          context: 'Fragrance',
          score: 81,
          image: 'https://images.unsplash.com/photo-1755536219951-70e9c1933fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmYXNoaW9uJTIwYmVhdXR5JTIwY2xvc2UlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMxNzU5ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
          isPrimary: false
        },
        {
          id: 6,
          context: 'Editorial',
          score: 83,
          image: 'https://images.unsplash.com/photo-1708170236080-6cb6d2d5497c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZGl0b3JpYWwlMjBmYXNoaW9uJTIwdmVydGljYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMxNjUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
          isPrimary: false
        },
        {
          id: 7,
          context: 'Campaign',
          score: 78,
          image: 'https://images.unsplash.com/photo-1697677103505-dd4b2dbf1b1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wYWlnbiUyMGZhc2hpb24lMjBzaG9vdHxlbnwxfHx8fDE3NzMxNjUzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
          isPrimary: false
        }
      ],
      notes: 'Updated digitals after London Fashion Week',
      expanded: false
    },
    {
      date: 'July 2, 2025',
      contextsCount: 2,
      topScore: 72,
      isProspectEra: true,
      renders: [
        {
          id: 8,
          context: 'Fragrance',
          score: 71,
          image: 'https://images.unsplash.com/photo-1601288536613-fe4678ea999d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwY2FtcGFpZ24lMjBtb2RlbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3NTk4N3ww&ixlib=rb-4.1.0&q=80&w=1080',
          isPrimary: false
        },
        {
          id: 9,
          context: 'Editorial',
          score: 72,
          image: 'https://images.unsplash.com/photo-1708170236080-6cb6d2d5497c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZGl0b3JpYWwlMjBmYXNoaW9uJTIwdmVydGljYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMxNjUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
          isPrimary: false
        }
      ],
      notes: 'Original signing renders — first session',
      expanded: false
    }
  ]
};

export function ModelHistory() {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const [sessionNotes, setSessionNotes] = useState('');
  const [expandedSessions, setExpandedSessions] = useState([0]);
  const [showUpdateDigitals, setShowUpdateDigitals] = useState(false);
  const [selectedRenders, setSelectedRenders] = useState<string[]>([]);
  const [reRunContexts, setReRunContexts] = useState(false);
  
  // Autosave state for session notes
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesValue, setNotesValue] = useState('Re-ran after digitals update...');

  const toggleSession = (index: number) => {
    setExpandedSessions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Get the context of first selected render
  const getSelectedContext = () => {
    if (selectedRenders.length === 0) return null;
    const [sessionIndex, renderId] = selectedRenders[0].split('-').map(Number);
    const session = modelData.sessions[sessionIndex];
    const render = session.renders.find(r => r.id === renderId);
    return render?.context || null;
  };

  const toggleRenderSelection = (sessionIndex: number, renderId: number, context: string) => {
    const key = `${sessionIndex}-${renderId}`;
    const selectedContext = getSelectedContext();
    
    // If this is the first selection, allow it
    if (selectedRenders.length === 0) {
      setSelectedRenders([key]);
      return;
    }
    
    // If clicking already selected render, deselect it
    if (selectedRenders.includes(key)) {
      setSelectedRenders(prev => prev.filter(k => k !== key));
      return;
    }
    
    // Only allow selection if context matches AND less than 2 selected
    if (context === selectedContext && selectedRenders.length < 2) {
      setSelectedRenders(prev => [...prev, key]);
    }
  };

  const selectedContext = getSelectedContext();
  const isCompareActive = selectedRenders.length === 2;

  return (
    <div className="p-[48px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-[8px] mb-[48px]">
        <Link 
          to="/roster"
          className="text-[13px] hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
        >
          Roster
        </Link>
        <ChevronRight size={14} style={{ color: '#6a6a64' }} />
        <span 
          className="text-[13px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
        >
          {modelData.name}
        </span>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-[30%_70%] gap-[48px]">
        {/* Left Column - Model Panel */}
        <div>
          {/* Model Name */}
          <h1 
            className="text-[36px] mb-[16px]" 
            style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
          >
            {modelData.name}
          </h1>

          {/* Status Pill */}
          <div 
            className="inline-block px-[16px] py-[8px] rounded-full text-[9px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ 
              fontFamily: 'var(--font-label)', 
              backgroundColor: '#5d7d5d33',
              color: '#5d7d5d',
              border: '1px solid #5d7d5d'
            }}
          >
            {modelData.status}
          </div>

          {/* Date Signed */}
          <div className="flex justify-between py-[8px] border-b border-[#2a2a2a] mb-[24px]">
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Date Signed
            </span>
            <span 
              className="text-[13px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
            >
              {modelData.dateSigned}
            </span>
          </div>

          {/* Primary Image */}
          <div className="aspect-[3/4] bg-[#1a1a1a] rounded-[4px] overflow-hidden mb-[24px]">
            <img 
              src={modelData.primaryImage} 
              alt={modelData.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Measurements */}
          <div className="mb-[24px]">
            {Object.entries(modelData.measurements).map(([key, value]) => (
              <div 
                key={key}
                className="flex justify-between py-[8px] border-b border-[#2a2a2a]"
              >
                <span 
                  className="text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  {key}
                </span>
                <span 
                  className="text-[13px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Market Tags */}
          <div className="flex flex-wrap gap-[8px] mb-[16px]">
            {modelData.markets.map((market) => (
              <div
                key={market}
                className="px-[12px] py-[6px] border border-[#2a2a2a] rounded-full text-[9px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
              >
                {market}
              </div>
            ))}
          </div>

          {/* Agent Notes */}
          <div className="mb-[24px]">
            <label 
              className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Agent Notes
            </label>
            <textarea
              placeholder="Add notes about availability, preferences, etc."
              className="w-full h-[100px] px-[16px] py-[12px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] resize-none"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '13px', 
                color: '#f0f0ec'
              }}
            />
          </div>

          {/* Buttons */}
          <div className="space-y-[12px]">
            <button
              onClick={() => setShowUpdateDigitals(true)}
              className="w-full py-[12px] rounded-[4px] border border-[#2a2a2a] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#1a1a1a]"
              style={{ 
                fontFamily: 'var(--font-label)',
                color: '#f0f0ec',
                cursor: 'pointer'
              }}
            >
              Update Digitals
            </button>
            <button
              className="w-full py-[12px] rounded-[4px] border border-[#2a2a2a] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#1a1a1a]"
              style={{ 
                fontFamily: 'var(--font-label)',
                color: '#f0f0ec'
              }}
            >
              View Bookings
            </button>
          </div>
        </div>

        {/* Right Column - Render History */}
        <div>
          {/* Header with Compare Button */}
          <div className="flex items-center justify-between mb-[24px]">
            <div 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Evaluation History
            </div>
            {isCompareActive ? (
              <button
                onClick={() => navigate('/compare')}
                className="px-[16px] py-[8px] rounded-[4px] border text-[11px] uppercase tracking-[0.1em] transition-colors"
                style={{ 
                  fontFamily: 'var(--font-label)',
                  backgroundColor: '#f0f0ec',
                  borderColor: '#f0f0ec',
                  color: '#080808',
                  cursor: 'pointer'
                }}
              >
                COMPARE 2 {selectedContext?.toUpperCase()} RENDERS
              </button>
            ) : (
              <button
                disabled
                className="px-[16px] py-[8px] rounded-[4px] border text-[11px] uppercase tracking-[0.1em]"
                style={{ 
                  fontFamily: 'var(--font-label)', 
                  backgroundColor: '#111111',
                  borderColor: '#2a2a2a',
                  color: '#6a6a64',
                  cursor: 'default',
                  opacity: 0.6
                }}
              >
                COMPARE
              </button>
            )}
          </div>

          {/* Session Blocks */}
          <div className="space-y-[24px]">
            {modelData.sessions.map((session, index) => {
              const isExpanded = expandedSessions.includes(index);
              const showProspectEraLabel = session.isProspectEra && (index === 0 || !modelData.sessions[index - 1].isProspectEra);
              
              return (
                <div key={index}>
                  {/* Prospect Era Divider */}
                  {showProspectEraLabel && (
                    <>
                      <div className="flex items-center gap-[16px] mb-[24px]">
                        <div className="flex-1 h-[1px] border-t border-dashed border-[#2a2a2a]" />
                      </div>
                      <div 
                        className="text-[9px] uppercase tracking-[0.1em] mb-[16px]"
                        style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
                      >
                        Prospect Era
                      </div>
                    </>
                  )}
                  
                  <div 
                    className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] overflow-hidden"
                  >
                    {/* Session Header */}
                    <div 
                      className="flex items-center justify-between px-[24px] py-[16px] bg-[#1a1a1a] border-b border-[#2a2a2a] cursor-pointer hover:bg-[#222222] transition-colors"
                      onClick={() => toggleSession(index)}
                    >
                      <span 
                        className="text-[13px]"
                        style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                      >
                        {session.date}
                      </span>
                      <span 
                        className="text-[13px]"
                        style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
                      >
                        {session.contextsCount} contexts evaluated
                      </span>
                      <span 
                        className="text-[13px]"
                        style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                      >
                        {session.topScore}%
                      </span>
                      {!session.expanded && (
                        <div className="flex items-center gap-[8px]">
                          <span 
                            className="text-[9px] uppercase tracking-[0.1em]"
                            style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
                          >
                            Expand
                          </span>
                          <ChevronDown size={14} style={{ color: '#6a6a64' }} />
                        </div>
                      )}
                    </div>

                    {/* Session Content - Only show if expanded and has renders */}
                    {isExpanded && session.renders.length > 0 && (
                      <div className="p-[24px]">
                        {/* Render Grid */}
                        <div className="grid grid-cols-3 gap-[12px] mb-[24px]">
                          {session.renders.map((render) => {
                            const key = `${index}-${render.id}`;
                            const isSelected = selectedRenders.includes(key);
                            const canSelect = selectedContext === null || render.context === selectedContext;
                            const isDimmed = !canSelect && selectedContext !== null;
                            
                            return (
                              <div 
                                key={render.id}
                                className="rounded-[4px] overflow-hidden relative cursor-pointer group"
                                style={{ 
                                  border: isSelected ? '2px solid #f0f0ec' : (render.isPrimary ? '2px solid #f0f0ec' : '2px solid transparent'),
                                  opacity: isDimmed ? 0.3 : 1,
                                  pointerEvents: isDimmed ? 'none' : 'auto'
                                }}
                                onClick={() => toggleRenderSelection(index, render.id, render.context)}
                                title={isDimmed ? `Select a ${selectedContext} render to compare` : ''}
                              >
                                {/* Checkbox */}
                                {isSelected && (
                                  <div className="absolute top-[8px] right-[8px] z-10 w-[20px] h-[20px] bg-[#f0f0ec] rounded-[2px] flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                      <path d="M2 6L5 9L10 3" stroke="#080808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                )}

                                {/* Download Button */}
                                <a
                                  href={render.image}
                                  download={`${modelData.name.replace(' ', '-')}-${render.context}.jpg`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute top-[8px] right-[8px] w-[28px] h-[28px] bg-[#080808] bg-opacity-80 border border-[#2a2a2a] rounded-[4px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  title="Download render"
                                >
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="#f0f0ec" strokeWidth="1.5" strokeLinecap="round"/>
                                  </svg>
                                </a>
                                
                                {/* Render Image */}
                                <div className="bg-[#1a1a1a]" style={{ height: '160px' }}>
                                  <img 
                                    src={render.image} 
                                    alt={render.context}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                
                                {/* Render Info */}
                                <div className="bg-[#1a1a1a] p-[12px]">
                                  <div 
                                    className="text-[9px] uppercase tracking-[0.1em] mb-[4px]"
                                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                                  >
                                    {render.context}
                                  </div>
                                  <div 
                                    className="text-[24px]"
                                    style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
                                  >
                                    {render.score}%
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Session Notes */}
                        <div>
                          <label 
                            className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
                            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                          >
                            Session Notes
                          </label>
                          <textarea
                            placeholder="e.g. Re-ran after Milan trip, updated digitals"
                            value={notesValue}
                            onChange={(e) => {
                              setNotesValue(e.target.value);
                              setNotesSaved(false);
                              setTimeout(() => setNotesSaved(true), 800);
                            }}
                            className="w-full h-[80px] px-[16px] py-[10px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] resize-none"
                            style={{ 
                              fontFamily: 'var(--font-mono)', 
                              fontSize: '13px', 
                              color: '#f0f0ec'
                            }}
                          />
                          <p style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontSize: '11px', 
                            color: notesSaved ? '#5d7d5d' : '#888880',
                            marginTop: '6px',
                            transition: 'color 0.3s ease'
                          }}>
                            {notesSaved ? '✓ Saved' : 'Unsaved changes'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* No Earlier Sessions */}
            <div 
              className="border border-dashed border-[#2a2a2a] rounded-[4px] py-[48px] text-center"
            >
              <span 
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
              >
                No earlier sessions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Update Digitals Modal */}
      {showUpdateDigitals && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setShowUpdateDigitals(false)}
        >
          <div 
            className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[32px] max-w-[480px] w-full mx-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <h2 
              className="text-[28px] mb-[12px]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
            >
              Update Digitals — {modelData.name}
            </h2>

            {/* Body Text */}
            <p 
              className="mb-[24px]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a', lineHeight: 1.5 }}
            >
              Uploading new digitals will not delete existing renders. Previous sessions will be labeled with the digitals version used.
            </p>

            {/* Upload Zones Grid */}
            <div 
              className="grid grid-cols-4 gap-[16px] mb-[16px]"
              style={{ maxWidth: '640px' }}>
              {['FRONT', 'PROFILE', '3/4', 'FULL BODY'].map((label) => (
                <div 
                  key={label}
                  className="bg-[#0d0d0d] border border-dashed border-[#2a2a2a] rounded-[4px] flex flex-col items-center justify-center cursor-pointer hover:border-[#3a3a3a] transition-colors"
                  style={{ height: '140px' }}
                >
                  <Upload size={24} style={{ color: '#3a3a3a', marginBottom: '8px' }} />
                  <span 
                    className="text-[10px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Re-run Checkbox */}
            <div className="flex items-center gap-[8px] mb-[16px]">
              <div 
                className="w-[14px] h-[14px] border border-[#2a2a2a] rounded-[2px] cursor-pointer flex items-center justify-center"
                style={{ backgroundColor: reRunContexts ? '#f0f0ec' : 'transparent' }}
                onClick={() => setReRunContexts(!reRunContexts)}
              >
                {reRunContexts && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 5L4 8L9 2" stroke="#080808" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span 
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                Re-run existing render contexts with new digitals automatically
              </span>
            </div>

            {/* Requirements Note */}
            <p 
              className="mb-[24px]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6a6a64' }}
            >
              JPG or PNG · Max 10MB per image · Minimum 800px shortest side
            </p>

            {/* Buttons */}
            <div className="space-y-[10px]">
              <button
                onClick={() => setShowUpdateDigitals(false)}
                className="w-full py-[12px] rounded-[4px] border border-[#2a2a2a] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#1a1a1a]"
                style={{ 
                  fontFamily: 'var(--font-label)',
                  color: '#f0f0ec'
                }}
              >
                CANCEL
              </button>
              <button
                className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{ 
                  fontFamily: 'var(--font-label)',
                  backgroundColor: '#f0f0ec',
                  color: '#080808'
                }}
              >
                UPLOAD & SAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}