import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronRight, ChevronDown } from 'lucide-react';

const prospectData = {
  name: 'Sofia Andersen',
  status: 'IN REVIEW',
  statusColor: '#4d3d5d',
  sessions: [
    {
      date: 'March 12, 2026',
      contextsCount: 4,
      topScore: 96,
      renders: [
        {
          id: 1,
          context: 'Fragrance',
          score: 94,
          image: 'https://images.unsplash.com/photo-1761329842950-f3551938e4da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFncmFuY2UlMjBlZGl0b3JpYWwlMjBtb2RlbCUyMHBob3RvfGVufDF8fHx8MTc3MzE2NTMzMnww&ixlib=rb-4.1.0&q=80&w=1080'
        },
        {
          id: 2,
          context: 'Editorial',
          score: 96,
          image: 'https://images.unsplash.com/photo-1708170236080-6cb6d2d5497c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZGl0b3JpYWwlMjBmYXNoaW9uJTIwdmVydGljYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMxNjUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080'
        },
        {
          id: 3,
          context: 'Campaign',
          score: 88,
          image: 'https://images.unsplash.com/photo-1697677103505-dd4b2dbf1b1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wYWlnbiUyMGZhc2hpb24lMjBzaG9vdHxlbnwxfHx8fDE3NzMxNjUzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
        },
        {
          id: 4,
          context: 'Runway',
          score: 91,
          image: 'https://images.unsplash.com/photo-1759873911657-8140566c29a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBlZGl0b3JpYWwlMjBwb3J0cmFpdCUyMHNxdWFyZXxlbnwxfHx8fDE3NzMxNjUzMzN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        }
      ],
      expanded: true
    }
  ]
};

export function ProspectRenderHistory() {
  const [status, setStatus] = useState(prospectData.status);
  const [statusColor, setStatusColor] = useState(prospectData.statusColor);
  const [pendingStatusChange, setPendingStatusChange] = useState<null | {
    previousStatus: string;
    previousColor: string;
    newStatus: string;
    newColor: string;
  }>(null);
  const [expandedSessions, setExpandedSessions] = useState([0]);
  const navigate = useNavigate();
  
  // Autosave state for session notes
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesValue, setNotesValue] = useState('Re-ran after digitals update...');

  const handleStatusChange = (newStatus: string, newColor: string) => {
    setPendingStatusChange({
      previousStatus: status,
      previousColor: statusColor,
      newStatus: newStatus,
      newColor: newColor
    });

    setStatus(newStatus);
    setStatusColor(newColor);

    setTimeout(() => setPendingStatusChange(null), 5000);
  };

  const handleUndoStatusChange = () => {
    if (!pendingStatusChange) return;
    setStatus(pendingStatusChange.previousStatus);
    setStatusColor(pendingStatusChange.previousColor);
    setPendingStatusChange(null);
  };

  const toggleSession = (index: number) => {
    setExpandedSessions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="p-[20px] md:p-[48px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-[8px] mb-[48px]">
        <Link 
          to="/prospects"
          className="text-[13px] hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
        >
          Prospects
        </Link>
        <ChevronRight size={14} style={{ color: '#6a6a64' }} />
        <span 
          className="text-[13px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
        >
          {prospectData.name}
        </span>
      </div>

      <h1 
        className="text-[48px] mb-[48px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        {prospectData.name} — Render History
      </h1>

      {/* Status Actions */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] mb-[24px]">
        <div 
          className="text-[10px] uppercase tracking-[0.12em] mb-[16px]"
          style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
        >
          CURRENT STATUS
        </div>
        
        <div 
          className="text-[16px] mb-[24px]"
          style={{ fontFamily: 'var(--font-mono)', color: statusColor }}
        >
          {status}
        </div>

        <div className="flex gap-[12px]">
          <button
            onClick={() => handleStatusChange('SHORTLISTED', '#7d6d4d')}
            className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
          >
            SHORTLIST
          </button>

          <button
            onClick={() => handleStatusChange('PASSED', '#5d3d3d')}
            className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
          >
            PASS
          </button>
        </div>
      </div>

      {/* Evaluation Sessions */}
      <div className="space-y-[24px] mb-[48px]">
        {prospectData.sessions.map((session, index) => {
          const isExpanded = expandedSessions.includes(index);
          
          return (
            <div key={index}>
              <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] overflow-hidden">
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
                  {!isExpanded && (
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

                {/* Session Content */}
                {isExpanded && session.renders.length > 0 && (
                  <div className="p-[24px]">
                    {/* Render Grid */}
                    <div className="grid grid-cols-4 gap-[12px] mb-[24px]">
                      {session.renders.map((render) => (
                        <div 
                          key={render.id}
                          className="rounded-[4px] overflow-hidden relative group"
                        >
                          {/* Download Button */}
                          <a
                            href={render.image}
                            download={`${prospectData.name.replace(' ', '-')}-${render.context}.jpg`}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-[8px] right-[8px] w-[28px] h-[28px] bg-[#080808] bg-opacity-80 border border-[#2a2a2a] rounded-[4px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Download render"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="#f0f0ec" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </a>

                          {/* Render Image */}
                          <div className="bg-[#1a1a1a]" style={{ height: '180px' }}>
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
                      ))}
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
                        placeholder="e.g. Re-ran after digitals update"
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
      </div>

      {/* Undo Toast */}
      {pendingStatusChange && (
        <div 
          className="fixed bottom-[80px] left-1/2 -translate-x-1/2 flex items-center gap-[16px] px-[20px] py-[14px] border rounded-[4px] z-50"
          style={{ 
            backgroundColor: '#1a1a1a',
            borderColor: '#2a2a2a',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)' 
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}>
            Status updated
          </span>
          <button
            onClick={handleUndoStatusChange}
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '11px', 
              color: '#f0f0ec',
              textDecoration: 'underline', 
              cursor: 'pointer' 
            }}
          >
            UNDO
          </button>
        </div>
      )}
    </div>
  );
}