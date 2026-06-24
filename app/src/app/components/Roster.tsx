import React from 'react';
import { authFetch } from '../../lib/apiAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, ChevronDown, Sparkles, X } from 'lucide-react';
import { useRoster, type RosterModel } from '../context/RosterContext';
import type { DigitalSet } from '../types/talent';
import { DigitalImage } from './DigitalImage';
import { ContextCodeChip, PhotoContextBadge } from './TalentCardBadges';

const ROSTER_STORAGE_KEY = 'castview_roster';
const ROSTER_VERSION_KEY = 'castview_roster_version';
const ROSTER_STORAGE_VERSION = 'v4';

function readRosterModelsFromStorage(): RosterModel[] {
  try {
    // Version check removed — RosterContext handles versioning

    const raw = localStorage.getItem(ROSTER_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RosterModel[]) : [];
  } catch {
    return [];
  }
}

const sumithRosterDigitalSets: DigitalSet[] = [
  {
    id: 'ds-roster-2',
    title: 'May 2026 Update',
    uploadedAt: 'May 2026',
    front: 'https://i.imgur.com/jZHp7Ei.jpg',
    profile: 'https://i.imgur.com/aBlfily.jpg',
    threeQuarter: 'https://i.imgur.com/AlYexxj.jpg',
    fullBody: 'https://i.imgur.com/sH8hoNb.jpg',
    additionalImages: [],
    notes: 'Updated digitals post first season.',
    tags: ['updated', 'post-season'],
    evaluations: [],
  },
  {
    id: 'ds-roster-1',
    title: 'Initial Submission',
    uploadedAt: 'January 2026',
    front: 'https://i.imgur.com/jZHp7Ei.jpg',
    profile: 'https://i.imgur.com/aBlfily.jpg',
    threeQuarter: 'https://i.imgur.com/AlYexxj.jpg',
    fullBody: 'https://i.imgur.com/sH8hoNb.jpg',
    additionalImages: [],
    notes: 'First submission after signing.',
    tags: ['initial', 'submission'],
    evaluations: [],
  },
];

export function getRosterModelById(modelId: string) {
  const model = readRosterModelsFromStorage().find((entry) => entry.id === modelId);
  if (!model) return undefined;

  const digitalSets =
    model.digitalSets.length > 0
      ? model.digitalSets
      : modelId === 'sumith-chittimalla-roster'
        ? sumithRosterDigitalSets
        : [];

  return {
    id: model.id,
    name: model.name,
    status: model.status,
    digitalSets,
  };
}

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
        className="flex items-center justify-between gap-[12px] px-[16px] py-[10px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] hover:bg-[var(--cv-elevated)] transition-colors cursor-pointer"
        style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '13px', 
          color: 'var(--cv-primary-text)'
        }}
      >
        <span>{currentLabel}</span>
        <ChevronDown size={14} style={{ color: 'var(--cv-secondary-text)' }} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div 
            className="absolute top-full mt-[4px] left-0 min-w-full bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] overflow-hidden z-20"
            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full text-left px-[16px] py-[10px] hover:bg-[var(--cv-elevated)] transition-colors"
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '13px', 
                  color: value === option.value ? 'var(--cv-primary-text)' : 'var(--cv-secondary-text)'
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

export function Roster() {
  const { models, removeModel } = useRoster();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contextFilter, setContextFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('last-rendered');
  const [briefMatchActive, setBriefMatchActive] = useState(false);
  const [briefQuery, setBriefQuery] = useState('');
  const [showMatchResults, setShowMatchResults] = useState(false);
  const [briefMatchLoading, setBriefMatchLoading] = useState(false);
  const [briefMatchResults, setBriefMatchResults] = useState<
    Array<{ id: string; score: number; reasoning: string }>
  >([]);
  const [showDevReportModal, setShowDevReportModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<RosterModel | null>(null);
  const [showCopiedConfirmation, setShowCopiedConfirmation] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const modelToDelete = models.find((m) => m.id === deleteTargetId) ?? null;
  const navigate = useNavigate();

  const contextCodeMap: Record<string, string> = {
    'fragrance': 'FR',
    'editorial': 'ED',
    'runway':    'RW',
    'campaign':  'CA',
    'beauty':    'BE',
    'sportswear':'SP',
    'couture':   'CO',
    'swimwear':  'SW',
    'street':    'ST'
  };

  const contextOptions = [
    { value: 'all', label: 'All Contexts' },
    { value: 'fragrance', label: 'Fragrance' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'runway', label: 'Runway' },
    { value: 'campaign', label: 'Campaign' }
  ];

  const divisionOptions = [
    { value: 'all', label: 'All Divisions' },
    { value: 'women', label: 'Women' },
    { value: 'men', label: 'Men' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'ACTIVE' },
    { value: 'on-hold', label: 'ON HOLD' },
  ];

  const sortOptions = [
    { value: 'last-rendered', label: 'Sort: Last Rendered' },
    { value: 'top-score', label: 'Sort: Top Score' },
    { value: 'evaluations', label: 'Sort: Evaluations' },
    { value: 'name', label: 'Sort: Name' },
  ];

  const modelEvaluationCount = (model: RosterModel) =>
    model.digitalSets.reduce((sum, ds) => sum + ds.evaluations.length, 0);

  const lastEvaluationRank = (value: string) => {
    const order = [
      '3 days ago', '5 days ago', '1 week ago',
      '2 weeks ago', '3 weeks ago', '1 month ago',
    ];
    const index = order.indexOf(value);
    return index >= 0 ? index : order.length;
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Status', 'Top Score', 'Contexts Evaluated', 'Last Evaluated', 'Date Signed'];
    const rows = models.map(m => [
      m.name,
      m.status,
      m.topScore.toString(),
      m.renderedContexts.join(' | '),
      m.lastEvaluation,
      m.recentlySigned ? 'Recently Signed' : ''
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${v}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'castview-roster.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredModels = models.filter(model => {
    const matchesSearch = search.trim() === ''
      || model.name.toLowerCase()
          .includes(search.trim().toLowerCase());

    const normalizedStatus = model.status.toLowerCase().replace(/\s+/g, '-');
    const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
    
    const matchesContext = contextFilter === 'all'
      || model.primaryContext?.toLowerCase() 
          === contextFilter;
    
    const matchesDivision = divisionFilter === 'all'
      || model.division?.toLowerCase() 
          === divisionFilter;
    return matchesSearch && matchesStatus && matchesContext 
      && matchesDivision;
  })
  .sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'top-score') {
      return (b.topScore || 0) - (a.topScore || 0);
    }
    if (sortBy === 'evaluations') {
      return modelEvaluationCount(b) - modelEvaluationCount(a);
    }
    if (sortBy === 'last-rendered') {
      return lastEvaluationRank(a.lastEvaluation) - lastEvaluationRank(b.lastEvaluation);
    }
    return 0;
  });

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    contextFilter !== 'all' ||
    divisionFilter !== 'all';

  return (
    <div className="p-[20px] md:p-[48px]">
      <div className="flex items-center mb-[48px]">
        <h1 
          className="text-[48px]" 
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
        >
          Roster
        </h1>
        <button
          type="button"
          onClick={() => navigate('/roster/new')}
          className="ml-auto mr-[12px] px-[20px] py-[12px] bg-[var(--cv-primary-text)] text-[var(--cv-background)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
        >
          + ADD MODEL
        </button>
        <button
          type="button"
          onClick={handleExportCSV}
          className="px-[16px] py-[12px] border border-[var(--cv-subtle-border)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[var(--cv-primary-text)] hover:text-[var(--cv-primary-text)]"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
        >
          EXPORT CSV
        </button>
      </div>

      {/* Controls Row */}
      <div 
        className="flex flex-col md:flex-row items-stretch md:items-center gap-[12px] md:gap-[24px] mb-[32px] md:mb-[48px] sticky top-0 z-20 py-[16px] -mx-[20px] px-[20px] md:-mx-[48px] md:px-[48px] bg-[var(--cv-background)]"
        style={{ boxShadow: '0 1px 0 var(--cv-subtle-border)' }}
      >
        {!briefMatchActive ? (
          <>
            {/* Normal Controls - Search Input */}
            <div className="flex-1 relative">
              <Search 
                size={16} 
                className="absolute left-[16px] top-1/2 -translate-y-1/2" 
                style={{ color: 'var(--cv-secondary-text)' }} 
              />
              <input
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-[44px] pr-[16px] py-[10px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]"
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '13px', 
                  color: 'var(--cv-primary-text)'
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

            {/* Division Filter */}
            <Dropdown
              value={divisionFilter}
              onChange={(value) => setDivisionFilter(value)}
              options={divisionOptions}
              currentLabel={divisionOptions.find(opt => opt.value === divisionFilter)?.label || 'All Divisions'}
            />

            {/* Sort Selector */}
            <Dropdown
              value={sortBy}
              onChange={(value) => setSortBy(value)}
              options={sortOptions}
              currentLabel={sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort: Last Rendered'}
            />

            {/* Brief Match Button */}
            <button
              onClick={() => setBriefMatchActive(true)}
              className="flex items-center gap-[8px] px-[16px] py-[10px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] text-[12px] uppercase tracking-[0.1em] hover:bg-[var(--cv-elevated)] transition-colors whitespace-nowrap"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                color: 'var(--cv-primary-text)',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={14} style={{ color: 'var(--cv-primary-text)' }} />
              BRIEF MATCH
            </button>
          </>
        ) : (
          <>
            {/* Brief Match Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Describe the brief — e.g. luxury fragrance, aspirational, European market, strong bone structure..."
                value={briefQuery}
                onChange={(e) => setBriefQuery(e.target.value)}
                className="w-full px-[16px] py-[10px] bg-[var(--cv-surface)] border rounded-[4px]"
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '13px', 
                  color: 'var(--cv-primary-text)',
                  borderColor: 'var(--cv-primary-text)'
                }}
              />
            </div>

            {/* Match Button */}
            <button
              onClick={async () => {
                if (!briefQuery.trim() || briefMatchLoading) return;
                setBriefMatchLoading(true);
                setShowMatchResults(false);
                try {
                  const response = await authFetch('/api/brief-match', {
                    method: 'POST',
                    body: JSON.stringify({
                      brief: briefQuery,
                      models: models.map((m) => ({
                        id: m.id,
                        name: m.name,
                        topScore: m.topScore,
                        contexts: m.contexts,
                        division: m.division,
                      })),
                    }),
                  });
                  if (response.status === 402) return;
                  const data = await response.json();
                  if (response.ok && data.matches) {
                    setBriefMatchResults(data.matches);
                    setShowMatchResults(true);
                  }
                } catch {
                  // silently fail — keep results hidden
                } finally {
                  setBriefMatchLoading(false);
                }
              }}
              className="px-[16px] py-[10px] rounded-[4px] text-[12px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 whitespace-nowrap"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                backgroundColor: 'var(--cv-primary-text)',
                color: 'var(--cv-background)'
              }}
            >
              {briefMatchLoading ? 'MATCHING...' : 'MATCH'}
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => {
                setBriefMatchActive(false);
                setShowMatchResults(false);
                setBriefQuery('');
                setBriefMatchResults([]);
              }}
              className="px-[16px] py-[10px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] hover:bg-[var(--cv-elevated)] transition-colors"
            >
              <X size={16} style={{ color: 'var(--cv-primary-text)' }} />
            </button>
          </>
        )}
      </div>

      {/* Match Results Strip */}
      {showMatchResults && briefMatchActive && (
        <div 
          className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[16px] mb-[16px]"
        >
          <div 
            className="text-[11px] uppercase tracking-[0.1em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
          >
            TOP MATCHES
          </div>

          {/* Match Results */}
          <div className="space-y-[1px]">
            {(briefMatchResults.length > 0 ? briefMatchResults : [...models]
              .sort((a, b) => b.topScore - a.topScore)
              .map((m) => ({ id: m.id, score: m.topScore, reasoning: '' }))
            ).map((match, index) => {
              const model = models.find((m) => m.id === match.id);
              if (!model) return null;
              return (
                <div
                  key={match.id}
                  className="flex flex-col py-[12px]"
                  style={{ borderTop: index > 0 ? '1px solid var(--cv-elevated)' : 'none' }}
                >
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[40px] h-[40px] bg-[var(--cv-elevated)] rounded-[4px] overflow-hidden flex-shrink-0">
                      <DigitalImage
                        storageRef={model.image}
                        alt={model.name}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 15%' }}
                      />
                    </div>
                    <div className="flex-1 text-[13px]"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}>
                      {model.name}
                    </div>
                    <div className="text-[16px] font-bold"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}>
                      {match.score}%
                    </div>
                    <div
                      className="text-[12px] cursor-pointer hover:opacity-70 transition-opacity"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
                      onClick={() => navigate(`/roster/${match.id}/history`)}
                    >
                      VIEW →
                    </div>
                  </div>
                  {match.reasoning && (
                    <div
                      className="mt-[6px]"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: 'var(--cv-secondary-text)',
                        lineHeight: 1.6,
                        paddingLeft: '52px',
                      }}
                    >
                      {match.reasoning}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Model Cards Grid or Empty State */}
      {filteredModels.length === 0 ? (
        models.length > 0 ? (
          <div
            className="py-[48px] text-center"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--cv-secondary-text)',
            }}
          >
            {search.trim()
              ? `No models match "${search}"`
              : 'No models match your filters'}
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center py-[64px] border border-dashed border-[var(--cv-subtle-border)] bg-[var(--cv-background)] rounded-[4px]"
          >
            <div 
              className="text-[14px] mb-[8px]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
            >
              No models on the roster yet.
            </div>
            <div 
              className="text-[13px] mb-[24px]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
            >
              Sign a prospect to get started.
            </div>
            <button
              onClick={() => navigate('/prospects')}
              className="px-[24px] py-[12px] bg-[var(--cv-surface)] border border-[var(--cv-primary-text)] rounded-[4px] text-[13px] transition-opacity hover:opacity-80"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                color: 'var(--cv-primary-text)'
              }}
            >
              Go to Prospects
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-[20px]">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              onClick={() => navigate(`/roster/${model.id}/history`)}
              className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] overflow-hidden hover:border-[var(--cv-elevated)] transition-colors cursor-pointer"
            >
              {/* Image with Badge */}
              <div className="relative bg-[var(--cv-elevated)] h-[160px] md:h-[220px]">
                <DigitalImage
                  storageRef={model.image}
                  alt={model.name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 15%' }}
                />
                
                {/* New to Roster Badge - Top Right */}
                {model.recentlySigned && (
                  <div 
                    className="absolute top-[8px] right-[8px] px-[10px] py-[6px] rounded-[4px] text-[10px] uppercase tracking-tight"
                    style={{ 
                      fontFamily: 'var(--font-label)', 
                      backgroundColor: 'var(--cv-primary-text)',
                      color: 'var(--cv-background)'
                    }}
                  >
                    NEW TO ROSTER
                  </div>
                )}
                
                {/* Primary Context Badge - Bottom Left */}
                {model.primaryContext && (
                  <PhotoContextBadge
                    label={
                      contextCodeMap[model.primaryContext.toLowerCase()] ?? model.primaryContext
                    }
                  />
                )}
              </div>

              {/* Card Content */}
              <div className="p-[14px]">
                {/* Model Name */}
                <div 
                  className="text-[20px] mb-[12px]"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
                >
                  {model.name}
                </div>

                {/* Context Chips */}
                <div className="flex gap-[8px] mb-[16px]">
                  {model.contexts.map((context) => (
                    <ContextCodeChip
                      key={context}
                      code={context}
                      rendered={model.renderedContexts.includes(context)}
                    />
                  ))}
                </div>

                {/* Score and Date */}
                <div className="flex items-center justify-between mb-[16px]">
                  <div 
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--cv-primary-text)' }}
                  >
                    {model.topScore}%
                  </div>
                  <div 
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-secondary-text)' }}
                  >
                    {model.lastEvaluation}
                  </div>
                </div>

                {/* Separator */}
                <div className="h-[1px] bg-[var(--cv-subtle-border)] mb-[12px]" />

                {/* Status */}
                <div 
                  className="text-[9px] uppercase tracking-[0.1em] mb-[8px]"
                  style={{ 
                    fontFamily: 'var(--font-label)',
                    color: model.status === 'ACTIVE' ? '#5d7d5d' : '#7d6d4d'
                  }}
                >
                  {model.status}
                </div>

                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/compare?prospectId=${model.id}`);
                  }}
                  className="text-[11px] hover:opacity-70 transition-opacity cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--cv-secondary-text)',
                  }}
                >
                  COMPARE DIGITALS
                </div>

                {/* Development Report Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedModel(model);
                    setShowDevReportModal(true);
                  }}
                  className="w-full mt-[12px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-all hover:border-[var(--cv-primary-text)] hover:text-[var(--cv-primary-text)]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    height: '36px',
                    borderColor: 'var(--cv-subtle-border)',
                    color: 'var(--cv-secondary-text)',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  ↗ SHARE DEVELOPMENT REPORT
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTargetId(model.id);
                  }}
                  className="w-full mt-[8px] border border-[#c87a7a] text-[#c87a7a] bg-transparent rounded-[4px] text-[9px] uppercase tracking-[0.1em] px-[10px] py-[6px] hover:bg-[#c87a7a] hover:text-[var(--cv-background)] transition-colors cursor-pointer"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  DELETE MODEL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deleteTargetId !== null && (
        <div
          className="fixed inset-0 bg-[rgba(8,8,8,0.85)] flex items-center justify-center z-50"
          onClick={() => setDeleteTargetId(null)}
        >
          <div
            className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[32px] max-w-[400px] w-full mx-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-[28px] mb-[16px]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
            >
              Remove from roster?
            </h2>
            <p
              className="mb-[24px]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-secondary-text)', lineHeight: 1.8 }}
            >
              This will permanently remove {modelToDelete?.name} from your roster. Their digital sets and evaluation history will be deleted. This cannot be undone.
            </p>
            <div className="flex gap-[12px]">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 px-[16px] py-[10px] border border-[var(--cv-subtle-border)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[var(--cv-primary-text)]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)', backgroundColor: 'transparent' }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTargetId) {
                    removeModel(deleteTargetId);
                    if (selectedModel?.id === deleteTargetId) {
                      setSelectedModel(null);
                      setShowDevReportModal(false);
                    }
                    setDeleteTargetId(null);
                  }
                }}
                className="flex-1 px-[16px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{ fontFamily: 'var(--font-mono)', backgroundColor: '#c87a7a', color: 'var(--cv-background)' }}
              >
                REMOVE MODEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Development Report Modal */}
      {showDevReportModal && selectedModel && (
        <>
          {/* Modal Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            onClick={() => {
              setShowDevReportModal(false);
              setShowCopiedConfirmation(false);
            }}
          >
            {/* Modal */}
            <div 
              className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[32px]"
              style={{ width: '480px' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <h2 
                className="text-[24px] mb-[24px]"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
              >
                Development Report — {selectedModel.name}
              </h2>

              {/* Preview Summary - hardcoded for Sofia Andersen, generic for others */}
              <div 
                className="mb-[32px] text-[12px] leading-relaxed whitespace-pre-line"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-accent)' }}
              >
                {selectedModel.id === 'sofia-andersen' ? (
                  `July 2025 (Prospect era)
Fragrance 71% · Editorial 72%

November 2025
Fragrance 81% · Editorial 83% · Campaign 78%

March 2026
Fragrance 94% · Editorial 96% · Campaign 88% · Beauty 91%

Overall trajectory: +23 points across primary contexts since signing.`
                ) : (
                  `Development data for ${selectedModel.name} will be available after multiple evaluation sessions.`
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-between gap-[12px]">
                {/* Cancel Button */}
                <button
                  onClick={() => {
                    setShowDevReportModal(false);
                    setShowCopiedConfirmation(false);
                  }}
                  className="px-[16px] py-[10px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[var(--cv-primary-text)]"
                  style={{ 
                    fontFamily: 'var(--font-mono)',
                    borderColor: 'var(--cv-subtle-border)',
                    color: 'var(--cv-secondary-text)',
                    backgroundColor: 'transparent'
                  }}
                >
                  CANCEL
                </button>

                {/* Copy Share Link Button */}
                <button
                  onClick={() => {
                    setShowCopiedConfirmation(true);
                    setTimeout(() => {
                      setShowCopiedConfirmation(false);
                    }, 2000);
                  }}
                  className="px-[16px] py-[10px] rounded-[4px] text-[12px] transition-opacity hover:opacity-80"
                  style={{ 
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'var(--cv-primary-text)',
                    color: 'var(--cv-background)'
                  }}
                >
                  {showCopiedConfirmation ? (
                    <span style={{ color: 'var(--cv-secondary-text)', backgroundColor: 'transparent', fontSize: '11px' }}>
                      Link copied to clipboard
                    </span>
                  ) : (
                    'COPY SHARE LINK'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}