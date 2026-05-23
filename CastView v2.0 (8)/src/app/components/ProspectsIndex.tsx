import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, ChevronDown, Plus, X } from 'lucide-react';
import { useProspects, type Prospect } from '../context/ProspectsContext';

type Source = 'SCOUT' | 'INSTAGRAM' | 'EMAIL' | 'OPEN CALL' | 'REFERRAL' | 'DIRECT';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  currentLabel: string;
}

function Dropdown({ value, onChange, options, currentLabel }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-[12px] px-[16px] py-[10px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
        style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '13px', 
          color: '#f0f0ec'
        }}
      >
        <span>{currentLabel}</span>
        <ChevronDown size={14} style={{ color: '#a0a09a' }} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div 
            className="absolute top-full mt-[4px] left-0 min-w-full bg-[#111111] border border-[#2a2a2a] rounded-[4px] overflow-hidden z-20"
            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full text-left px-[16px] py-[10px] hover:bg-[#1a1a1a] transition-colors"
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '13px', 
                  color: value === option.value ? '#f0f0ec' : '#a0a09a'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ProspectsIndex() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contextFilter, setContextFilter] = useState('all');
  const [sortBy, setSortBy] = useState('submission-date');
  const navigate = useNavigate();
  const { prospects, addProspect, updateProspect } = useProspects();
  
  // Multi-select state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [sourceFilters, setSourceFilters] = useState<Set<Source>>(new Set());
  const [pendingBulkAction, setPendingBulkAction] = useState<null | { 
    ids: string[], 
    status: string, 
    statusColor: string, 
    previousStates: {id: string, status: string, statusColor: string}[] 
  }>(null);
  
  // Quick add state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'DRAFT' },
    { value: 'new', label: 'NEW' },
    { value: 'in-review', label: 'IN REVIEW' },
    { value: 'shortlisted', label: 'SHORTLISTED' },
    { value: 'passed', label: 'PASSED' },
  ];

  const contextOptions = [
    { value: 'all', label: 'All Contexts' },
    { value: 'fragrance', label: 'Fragrance' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'runway', label: 'Runway' },
    { value: 'campaign', label: 'Campaign' }
  ];

  const sortOptions = [
    { value: 'submission-date', label: 'Sort: Submission Date' },
    { value: 'top-score', label: 'Sort: Top Alignment Score' },
    { value: 'name', label: 'Sort: Name' }
  ];

  const draftCount = prospects.filter(p => p.status === 'DRAFT').length;

  const handleProspectStatus = (
    prospectId: string,
    newStatus: string,
    newStatusColor: string
  ) => {
    updateProspect(prospectId, {
      status: newStatus,
      statusColor: newStatusColor,
    });
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelected(new Set(prospects.map(p => p.id)));
  };

  const handleDeselectAll = () => {
    setSelected(new Set());
  };

  const handleBulkAction = (newStatus: string, newStatusColor: string) => {
    const previousStates = prospects
      .filter(p => selected.has(p.id))
      .map(p => ({ id: p.id, status: p.status, statusColor: p.statusColor }));
    
    selected.forEach((id) => {
      updateProspect(id, { status: newStatus, statusColor: newStatusColor });
    });
    
    setPendingBulkAction({ 
      ids: Array.from(selected), 
      status: newStatus, 
      statusColor: newStatusColor, 
      previousStates 
    });
    setSelected(new Set());
    
    setTimeout(() => setPendingBulkAction(null), 5000);
  };

  const handleUndoBulkAction = () => {
    if (!pendingBulkAction) return;
    pendingBulkAction.previousStates.forEach((prev_state) => {
      updateProspect(prev_state.id, {
        status: prev_state.status,
        statusColor: prev_state.statusColor,
      });
    });
    setPendingBulkAction(null);
  };

  const toggleSourceFilter = (source: Source | 'ALL') => {
    if (source === 'ALL') {
      setSourceFilters(new Set());
    } else {
      setSourceFilters(prev => {
        const newSet = new Set(prev);
        if (newSet.has(source)) {
          newSet.delete(source);
        } else {
          newSet.add(source);
        }
        return newSet;
      });
    }
  };

  const isCheckboxVisible = (id: string) => {
    return selected.has(id) || hoveredRow === id || selected.size > 0;
  };

  // Filter prospects based on source filter
  const filteredProspects = prospects
    .filter(p => {
      const matchesSource = sourceFilters.size === 0 
        || (p.source && sourceFilters.has(p.source))
        || (!p.source);
      const matchesSearch = search.trim() === '' 
        || p.name.toLowerCase()
            .includes(search.trim().toLowerCase());
      const matchesStatus = statusFilter === 'all' 
        || p.status.toLowerCase().replace(' ', '-') 
            === statusFilter;
      
      const contextCodeMap: Record<string, string> = {
        'fragrance': 'FR',
        'editorial': 'ED',
        'runway':    'RW',
        'campaign':  'CA'
      };

      const matchesContext = contextFilter === 'all'
        || p.renderedContexts.includes(
            contextCodeMap[contextFilter] || 
            contextFilter.toUpperCase()
          );
      
      return matchesSource && matchesSearch 
        && matchesStatus && matchesContext;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'top-score') {
        return (b.evaluations || 0) - (a.evaluations || 0);
      }
      // Default: submission-date — keep original order
      return 0;
    });

  const handleExportCSV = () => {
    const headers = ['Name', 'Status', 'Source', 'Evaluations', 'Submitted', 'Contexts'];
    const rows = filteredProspects.map(p => [
      p.name,
      p.status,
      p.source || '',
      p.evaluations.toString(),
      p.submissionDate,
      p.renderedContexts.join(' | ')
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `\"${v}\"`).join(','))
      .join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'castview-prospects.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQuickAdd = () => {
    if (!quickName.trim()) return;
    
    const newProspect: Prospect = {
      id: quickName.toLowerCase().replace(/\s+/g, '-'),
      name: quickName,
      status: 'DRAFT',
      statusColor: '#666666',
      evaluations: 0,
      submissionDate: 'Today',
      image: null,
      contexts: ['FR', 'ED', 'RW', 'CA'],
      renderedContexts: [],
      source: 'EMAIL' as Source,
      digitalSets: [],
    };
    
    addProspect(newProspect);
    setQuickName('');
    setQuickAddOpen(false);
  };

  return (
    <div className="p-[20px] md:p-[48px]" style={{ paddingBottom: selected.size > 0 ? '120px' : '48px' }}>
      {/* Header with Title and Add Button */}
      <div className="flex items-center mb-[48px]">
        <h1 
          className="text-[48px]" 
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
        >
          Prospects
        </h1>
        <button
          onClick={() => setStatusFilter('draft')}
          className="ml-auto mr-[16px] text-[13px] transition-opacity hover:opacity-70"
          style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
        >
          {draftCount} draft{draftCount !== 1 ? 's' : ''}
        </button>
        <button
          onClick={handleExportCSV}
          className="px-[16px] py-[12px] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[#f0f0ec] hover:text-[#f0f0ec] mr-[16px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
        >
          EXPORT CSV
        </button>
        <button
          onClick={() => setQuickAddOpen(true)}
          className="text-[11px] uppercase tracking-[0.05em] hover:opacity-70 transition-opacity mr-[12px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#888880', cursor: 'pointer' }}
        >
          QUICK ADD
        </button>
        <button
          onClick={() => navigate('/prospects/new')}
          className="flex items-center gap-[8px] px-[20px] py-[12px] bg-[#f0f0ec] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
          style={{ 
            fontFamily: 'var(--font-mono)', 
            color: '#080808'
          }}
          data-tutorial="add-prospect-button"
        >
          <Plus size={14} />
          ADD PROSPECT
        </button>
      </div>

      {/* Controls Row */}
      <div 
        className="flex flex-col md:flex-row items-stretch md:items-center gap-[12px] md:gap-[24px] mb-[32px] md:mb-[48px] sticky top-0 z-20 py-[16px] -mx-[48px] px-[48px] bg-[#080808]"
        style={{ boxShadow: '0 1px 0 #1e1e1e' }}
      >
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search 
            size={16} 
            className="absolute left-[16px] top-1/2 -translate-y-1/2" 
            style={{ color: '#6a6a64' }} 
          />
          <input
            type="text"
            placeholder="Search prospects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-[44px] pr-[16px] py-[10px] bg-[#111111] border border-[#2a2a2a] rounded-[4px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '13px', 
              color: '#f0f0ec'
            }}
          />
        </div>

        {/* Status Filter */}
        <Dropdown
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          options={statusOptions}
          currentLabel={statusOptions.find(opt => opt.value === statusFilter)?.label || 'All Statuses'}
        />

        {/* Context Filter */}
        <Dropdown
          value={contextFilter}
          onChange={(value) => setContextFilter(value)}
          options={contextOptions}
          currentLabel={contextOptions.find(opt => opt.value === contextFilter)?.label || 'All Contexts'}
        />

        {/* Sort Selector */}
        <Dropdown
          value={sortBy}
          onChange={(value) => setSortBy(value)}
          options={sortOptions}
          currentLabel={sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort: Submission Date'}
        />
      </div>

      {/* Source Filter Row */}
      <div className="flex items-center gap-[12px] mb-[24px] overflow-x-auto pb-[4px] scrollbar-hide">
        <span 
          className="text-[9px] uppercase tracking-[0.1em]"
          style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
        >
          FILTER BY SOURCE:
        </span>
        <button
          onClick={() => toggleSourceFilter('ALL')}
          className="px-[14px] py-[6px] rounded-full text-[11px] uppercase tracking-[0.05em] transition-colors border cursor-pointer"
          style={{
            fontFamily: 'var(--font-mono)',
            backgroundColor: sourceFilters.size === 0 ? '#f0f0ec' : 'transparent',
            borderColor: sourceFilters.size === 0 ? '#f0f0ec' : '#444440',
            color: sourceFilters.size === 0 ? '#080808' : '#888880'
          }}
        >
          ALL
        </button>
        {(['SCOUT', 'INSTAGRAM', 'EMAIL', 'OPEN CALL', 'REFERRAL'] as Source[]).map((source) => (
          <button
            key={source}
            onClick={() => toggleSourceFilter(source)}
            className="px-[14px] py-[6px] rounded-full text-[11px] uppercase tracking-[0.05em] transition-colors border cursor-pointer"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: sourceFilters.has(source) ? '#f0f0ec' : 'transparent',
              borderColor: sourceFilters.has(source) ? '#f0f0ec' : '#444440',
              color: sourceFilters.has(source) ? '#080808' : '#888880'
            }}
          >
            {source}
          </button>
        ))}
      </div>

      {/* Select All Link - only shown when checkboxes are visible */}
      <div className="mb-[16px]" style={{ height: '20px' }}>
        <button
          onClick={handleSelectAll}
          className="text-[11px] uppercase tracking-[0.05em] hover:opacity-70 transition-opacity"
          style={{ 
            fontFamily: 'var(--font-mono)', 
            color: '#888880',
            visibility: (hoveredRow !== null || selected.size > 0) 
              ? 'visible' : 'hidden',
            opacity: (hoveredRow !== null || selected.size > 0) ? 1 : 0,
            transition: 'opacity 150ms ease',
            cursor: 'pointer'
          }}
        >
          SELECT ALL
        </button>
      </div>

      {/* Prospect Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[20px]">
        {filteredProspects.map((prospect) => (
          <div
            key={prospect.id}
            className="relative"
            onMouseEnter={() => setHoveredRow(prospect.id)}
            onMouseLeave={() => setHoveredRow(null)}
          >
            {/* Checkbox - positioned absolutely on the left */}
            <div 
              className="absolute top-[12px] left-[12px] z-10 cursor-pointer"
              style={{
                opacity: isCheckboxVisible(prospect.id) ? 1 : 0,
                transition: 'opacity 200ms ease'
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(prospect.id)}
                onChange={(e) => handleToggleSelect(prospect.id, e as any)}
                onClick={(e) => e.stopPropagation()}
                className="w-[20px] h-[20px] cursor-pointer"
                style={{
                  accentColor: '#f0f0ec',
                  backgroundColor: '#111111',
                  border: '1px solid #f0f0ec'
                }}
              />
            </div>

            <Link
              to={prospect.status === 'DRAFT' ? `/prospects/${prospect.id}/draft` : `/prospects/${prospect.id}`}
              className="block bg-[#111111] border border-[#2a2a2a] rounded-[4px] overflow-hidden hover:border-[#3a3a3a] transition-colors"
            >
              {/* Image with Status Badge */}
              <div className="relative bg-[#1a1a1a]" style={{ height: '220px' }}>
                {prospect.image ? (
                  <img 
                    src={prospect.image} 
                    alt={prospect.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center 15%' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: '#6a6a64',
                        letterSpacing: '0.05em'
                      }}
                    >
                      NO EVALUATIONS YET
                    </div>
                  </div>
                )}
                
                {/* Status Badge */}
                <div 
                  className="absolute bottom-[12px] left-[12px] px-[10px] py-[4px] rounded-full text-[9px] uppercase tracking-[0.1em]"
                  style={{ 
                    fontFamily: 'var(--font-label)', 
                    backgroundColor: 'rgba(8, 8, 8, 0.8)',
                    color: prospect.statusColor,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${prospect.statusColor}`
                  }}
                >
                  {prospect.status}
                </div>

                {/* Source Badge - bottom right */}
                {prospect.source && (
                  <div 
                    className="absolute bottom-[12px] right-[12px] px-[8px] py-[4px] rounded-[4px] text-[10px] uppercase tracking-[0.05em]"
                    style={{ 
                      fontFamily: 'var(--font-mono)', 
                      backgroundColor: 'transparent',
                      color: '#888880',
                      border: '1px solid #333333'
                    }}
                  >
                    {prospect.source}
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-[14px]">
                {/* Prospect Name */}
                <div 
                  className="text-[20px] mb-[12px]"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
                >
                  {prospect.name}
                </div>

                {/* Context Chips */}
                <div className="flex gap-[8px] mb-[16px]">
                  {prospect.contexts.map((context) => {
                    const isRendered = prospect.renderedContexts.includes(context);
                    return (
                      <div
                        key={context}
                        className="w-[24px] h-[24px] rounded-[4px] border flex items-center justify-center text-[8px] uppercase tracking-[0.1em]"
                        style={{
                          fontFamily: 'var(--font-label)',
                          backgroundColor: isRendered ? '#f0f0ec' : 'transparent',
                          borderColor: isRendered ? '#f0f0ec' : '#2a2a2a',
                          color: isRendered ? '#080808' : '#6a6a64'
                        }}
                      >
                        {context}
                      </div>
                    );
                  })}
                </div>

                {/* Render Count and Submission Date OR Complete Profile for DRAFT */}
                {prospect.status === 'DRAFT' ? (
                  <div className="mb-[16px]">
                    <div 
                      className="text-[12px] uppercase tracking-[0.05em]"
                      style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
                    >
                      COMPLETE PROFILE →
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-[16px]">
                    <div 
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a' }}
                    >
                      {prospect.evaluations} evaluation{prospect.evaluations !== 1 ? 's' : ''}
                    </div>
                    <div 
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#a0a09a' }}
                    >
                      {prospect.submissionDate}
                    </div>
                  </div>
                )}

                {/* Separator */}
                <div className="h-[1px] bg-[#2a2a2a] mb-[12px]" />

                {/* Status */}
                <div 
                  className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
                  style={{ 
                    fontFamily: 'var(--font-label)',
                    color: prospect.statusColor
                  }}
                >
                  {prospect.status}
                </div>

                {prospect.status !== 'DRAFT' && (
                  <div onClick={(e) => e.preventDefault()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/profile');
                      }}
                      className="w-full mb-[8px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: '#f0f0ec',
                        color: '#080808',
                        cursor: 'pointer',
                      }}
                    >
                      RUN EVALUATION
                    </button>
                    <div className="flex gap-[8px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProspectStatus(prospect.id, 'SHORTLISTED', '#7d6d4d');
                        }}
                        className="flex-1 px-[10px] py-[6px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[9px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
                        style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
                      >
                        SHORTLIST
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProspectStatus(prospect.id, 'PASSED', '#5d3d3d');
                        }}
                        className="flex-1 px-[10px] py-[6px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[9px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
                        style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
                      >
                        PASS
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Zero State */}
      {filteredProspects.length === 0 && (
        <div 
          className="col-span-4 py-[48px] text-center"
          style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '13px', 
            color: '#666660' 
          }}
        >
          No prospects match "{search}"
        </div>
      )}

      {/* Bulk Action Bar - slides up from bottom */}
      {selected.size > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 h-[56px] bg-[#1a1a1a] border-t border-[#333333] flex items-center px-[48px] z-50"
          style={{
            animation: 'slideUp 200ms ease-out'
          }}
        >
          <style>{`
            @keyframes slideUp {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
          `}</style>

          {/* Selected Count */}
          <div 
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
          >
            {selected.size} selected
          </div>

          {/* Action Buttons */}
          <div className="ml-auto flex items-center gap-[12px]">
            <button
              onClick={() => handleBulkAction('SHORTLISTED', '#7d6d4d')}
              className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
              style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
            >
              MOVE TO SHORTLISTED
            </button>

            <button
              onClick={() => handleBulkAction('IN REVIEW', '#4d3d5d')}
              className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
              style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
            >
              MOVE TO IN REVIEW
            </button>

            <button
              onClick={() => handleBulkAction('PASSED', '#5d3d3d')}
              className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
              style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
            >
              MARK AS PASSED
            </button>

            {/* Close Button */}
            <button
              onClick={handleDeselectAll}
              className="ml-[12px] p-[8px] hover:opacity-70 transition-opacity"
            >
              <X size={20} color="#f0f0ec" />
            </button>
          </div>
        </div>
      )}

      {/* Undo Toast */}
      {pendingBulkAction && (
        <div 
          className="fixed left-1/2 -translate-x-1/2 flex items-center gap-[16px] px-[20px] py-[14px] border rounded-[4px] z-[60]"
          style={{ 
            backgroundColor: '#1a1a1a',
            borderColor: '#2a2a2a',
            bottom: selected.size > 0 ? '72px' : '24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            transition: 'bottom 200ms ease'
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}>
            {pendingBulkAction.ids.length} prospect{pendingBulkAction.ids.length !== 1 ? 's' : ''} moved to {pendingBulkAction.status}
          </span>
          <button
            onClick={handleUndoBulkAction}
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

      {/* Quick Add Modal */}
      {quickAddOpen && (
        <div 
          className="fixed inset-0 bg-[rgba(8,8,8,0.85)] flex items-center justify-center z-40"
          onClick={() => setQuickAddOpen(false)}
        >
          <div 
            className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] max-w-[380px] w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Headline */}
            <h2 
              className="text-[24px] mb-[8px]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
            >
              Quick add prospect
            </h2>

            {/* Sub-label */}
            <p 
              className="mb-[20px]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880' }}
            >
              Name only — fill details later
            </p>

            {/* Name Input */}
            <input
              type="text"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleQuickAdd();
                } else if (e.key === 'Escape') {
                  setQuickAddOpen(false);
                }
              }}
              placeholder="Prospect name"
              autoFocus
              className="w-full px-[16px] py-[12px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] mb-[24px]"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '13px', 
                color: '#f0f0ec'
              }}
            />

            {/* Buttons */}
            <div className="flex gap-[12px]">
              <button
                onClick={() => {
                  setQuickAddOpen(false);
                  setQuickName('');
                }}
                className="flex-1 px-[16px] py-[12px] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[#f0f0ec]"
                style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
              >
                CANCEL
              </button>
              <button
                onClick={handleQuickAdd}
                className="flex-1 px-[16px] py-[12px] bg-[#f0f0ec] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{ fontFamily: 'var(--font-mono)', color: '#080808' }}
              >
                ADD TO DRAFTS →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}