import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { ChevronDown } from 'lucide-react';
import type { DigitalSet } from '../types/talent';
import { useProspects } from '../context/ProspectsContext';
import { TutorialOverlay, compareTutorialSteps } from './TutorialOverlay';
import { getRosterModelById } from './Roster';

type DigitalSetOption = {
  id: string;
  title: string;
  date: string;
  thumbnail: string;
  front: string | null;
  profile: string | null;
  threeQuarter: string | null;
  fullBody: string | null;
};

const DIGITAL_PREVIEW_FIELDS = [
  { key: 'front' as const, label: 'FRONT' },
  { key: 'profile' as const, label: 'PROFILE' },
  { key: 'threeQuarter' as const, label: '3/4' },
  { key: 'fullBody' as const, label: 'FULL BODY' },
];

function getDigitalSetDisplayTitle(title: string | null | undefined): string {
  const trimmed = title?.trim();
  if (!trimmed || trimmed === 'Untitled Set') {
    return 'Unnamed Set';
  }
  return trimmed;
}

function hasDigitalImageValue(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

type MockResult = {
  context: string;
  oldScore: number;
  newScore: number;
  change: 'improved' | 'declined' | 'stable';
  reasoning: string;
  nextStep: string;
};

type CompareNavigationState = {
  prospectId?: string;
  prospectName?: string;
  profilePath?: string;
  previousSetId?: string;
  digitalSets?: DigitalSetOption[];
};

function digitalSetToOption(set: DigitalSet): DigitalSetOption {
  return {
    id: set.id,
    title: set.title,
    date: set.uploadedAt,
    thumbnail: set.front || '',
    front: set.front,
    profile: set.profile,
    threeQuarter: set.threeQuarter,
    fullBody: set.fullBody,
  };
}

function navDigitalSetToOption(navSet: {
  id: string;
  title: string;
  date: string;
  thumbnail: string;
}): DigitalSetOption {
  return {
    id: navSet.id,
    title: navSet.title,
    date: navSet.date,
    thumbnail: navSet.thumbnail,
    front: navSet.thumbnail || null,
    profile: null,
    threeQuarter: null,
    fullBody: null,
  };
}

function resolveCompareSelection(
  sets: DigitalSetOption[],
  previousSetIdFromNav?: string
) {
  if (sets.length === 0) {
    return { previousSetId: '', currentSetId: '' };
  }
  if (sets.length === 1) {
    return { previousSetId: sets[0].id, currentSetId: sets[0].id };
  }

  const newest = sets[0];
  const oldest = sets[sets.length - 1];

  if (previousSetIdFromNav && sets.some((set) => set.id === previousSetIdFromNav)) {
    const currentSetId =
      sets.find((set) => set.id !== previousSetIdFromNav)?.id ?? newest.id;
    return { previousSetId: previousSetIdFromNav, currentSetId };
  }

  return { previousSetId: oldest.id, currentSetId: newest.id };
}

const contexts = [
  'Fragrance',
  'Editorial',
  'Runway',
  'Campaign',
  'Beauty',
  'Sportswear',
  'Couture',
  'Swimwear',
  'Streetwear',
  'E-commerce',
];

const mockResults: MockResult[] = [
  {
    context: 'Fragrance',
    oldScore: 78,
    newScore: 91,
    change: 'improved',
    reasoning:
      'Updated digitals show improved bone structure visibility and stronger contrast range. More aligned with current luxury fragrance casting criteria.',
    nextStep: 'Prioritise fragrance test shoot within next 30 days.',
  },
  {
    context: 'Editorial',
    oldScore: 82,
    newScore: 88,
    change: 'improved',
    reasoning:
      'Improved posture and framing in new digitals. Editorial versatility score has increased.',
    nextStep: 'Submit to editorial clients in NYC and London markets.',
  },
  {
    context: 'Runway',
    oldScore: 74,
    newScore: 71,
    change: 'declined',
    reasoning:
      'Slight decline in proportion indicators. May reflect digital quality rather than actual change.',
    nextStep:
      'Upload full body digital with better lighting for more accurate runway assessment.',
  },
  {
    context: 'Campaign',
    oldScore: 85,
    newScore: 85,
    change: 'stable',
    reasoning:
      'Commercial appeal indicators remain consistent across both digital sets.',
    nextStep: 'Maintain current positioning for commercial campaign submissions.',
  },
  {
    context: 'Beauty',
    oldScore: 79,
    newScore: 86,
    change: 'improved',
    reasoning:
      'Skin clarity and facial detail improved in updated digitals. Better alignment with beauty context criteria.',
    nextStep: 'Consider beauty and grooming campaign submissions.',
  },
  {
    context: 'Sportswear',
    oldScore: 81,
    newScore: 83,
    change: 'improved',
    reasoning: 'Slight improvement in physicality indicators from updated digitals.',
    nextStep: 'Athletic and activewear submissions viable.',
  },
  {
    context: 'Couture',
    oldScore: 76,
    newScore: 79,
    change: 'improved',
    reasoning: 'Marginal improvement. Couture alignment remains moderate.',
    nextStep: 'Focus on editorial and fragrance first before couture submissions.',
  },
  {
    context: 'Swimwear',
    oldScore: 80,
    newScore: 80,
    change: 'stable',
    reasoning: 'Consistent alignment across both digital sets for swimwear context.',
    nextStep: 'Swimwear submissions viable when seasonally relevant.',
  },
  {
    context: 'Streetwear',
    oldScore: 88,
    newScore: 90,
    change: 'improved',
    reasoning:
      'Strong contemporary style alignment. Updated digitals reinforce street style positioning.',
    nextStep: 'High priority for streetwear and contemporary brand submissions.',
  },
  {
    context: 'E-commerce',
    oldScore: 83,
    newScore: 84,
    change: 'stable',
    reasoning: 'Consistent commercial versatility across both digital sets.',
    nextStep: 'Suitable for e-commerce and product campaign work.',
  },
];

const sectionLabelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  color: '#888880',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

function toScoreLabel(date: string | null | undefined) {
  const trimmed = date?.trim();
  if (!trimmed || trimmed === '—') {
    return '—';
  }
  const [month, year] = trimmed.split(' ');
  if (!month || !year) {
    return trimmed;
  }
  return `${month.slice(0, 3).toUpperCase()} ${year}`;
}

function getCompareChangeTag(change: MockResult['change']) {
  if (change === 'improved') {
    return { text: 'IMPROVED', color: '#4a7a4a' };
  }
  if (change === 'declined') {
    return { text: 'DECLINED', color: '#c87a7a' };
  }
  return { text: 'STABLE', color: '#888880' };
}

function DigitalSetSelector({
  panelLabel,
  selectedId,
  onSelect,
  sets,
}: {
  panelLabel: string;
  selectedId: string;
  onSelect: (id: string) => void;
  sets: DigitalSetOption[];
}) {
  return (
    <div className="flex-1 min-w-0">
      <div
        className="mb-[12px]"
        style={sectionLabelStyle}
      >
        {panelLabel}
      </div>
      <div className="space-y-[8px]">
        {sets.map((set) => {
          const isSelected = selectedId === set.id;
          return (
            <button
              key={set.id}
              type="button"
              onClick={() => onSelect(set.id)}
              className="w-full flex items-center gap-[12px] p-[12px] rounded-[4px] text-left transition-colors"
              style={{
                backgroundColor: '#111111',
                border: `1px solid ${isSelected ? '#f0f0ec' : '#2a2a2a'}`,
                cursor: 'pointer',
              }}
            >
              <div
                className="flex-shrink-0 overflow-hidden rounded-[4px] bg-[#1a1a1a]"
                style={{ width: '48px', height: '48px' }}
              >
                <img
                  src={set.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#f0f0ec',
                  }}
                >
                  {getDigitalSetDisplayTitle(set.title)}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: '#555550',
                    marginTop: '2px',
                  }}
                >
                  {set.date}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DigitalsPreviewGrid({
  selectedId,
  sets,
}: {
  selectedId: string;
  sets: DigitalSetOption[];
}) {
  if (!selectedId) {
    return (
      <p
        className="mt-[16px]"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: '#888880',
        }}
      >
        Select a digital set to preview
      </p>
    );
  }

  const selectedSet = sets.find((set) => set.id === selectedId);
  if (!selectedSet) {
    return (
      <p
        className="mt-[16px]"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: '#888880',
        }}
      >
        Select a digital set to preview
      </p>
    );
  }

  return (
    <div className="flex flex-row flex-wrap gap-[8px] mt-[16px]">
      {DIGITAL_PREVIEW_FIELDS.map(({ key, label }) => {
        const value = selectedSet[key];
        const slotStyle = { width: 'calc(50% - 4px)' };

        if (hasDigitalImageValue(value)) {
          return (
            <div key={key} style={slotStyle}>
              <div
                style={{
                  aspectRatio: '3/4',
                  overflow: 'hidden',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px',
                  background: '#111111',
                }}
              >
                <img
                  src={value}
                  alt={label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 15%',
                  }}
                />
              </div>
              <div
                className="uppercase mt-[4px]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  color: '#888880',
                }}
              >
                {label}
              </div>
            </div>
          );
        }

        return (
          <div key={key} style={slotStyle}>
            <div
              className="bg-[#0d0d0d] border border-dashed border-[#2a2a2a] flex items-center justify-center"
              style={{ aspectRatio: '3/4', borderRadius: '4px' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: '#444440',
                }}
              >
                —
              </span>
            </div>
            <div
              className="uppercase mt-[4px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                color: '#888880',
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CompareMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modelId = searchParams.get('modelId');
  const prospectIdFromQuery = searchParams.get('prospectId');
  const navigationState = (location.state ?? null) as CompareNavigationState | null;
  const { getProspectById } = useProspects();

  const resolvedProspectId =
    prospectIdFromQuery ?? navigationState?.prospectId ?? null;

  const sourceDigitalSets = useMemo((): DigitalSet[] => {
    if (modelId) {
      const model = getRosterModelById(modelId);
      return model?.digitalSets ?? [];
    }

    if (resolvedProspectId) {
      const prospect = getProspectById(resolvedProspectId);
      if (prospect?.digitalSets.length) {
        return prospect.digitalSets;
      }
      if (resolvedProspectId.endsWith('-roster')) {
        const rosterModel = getRosterModelById(resolvedProspectId);
        return rosterModel?.digitalSets ?? [];
      }
    }

    return [];
  }, [modelId, resolvedProspectId, getProspectById]);

  const prospectDigitalSets = useMemo(() => {
    const fromSource = sourceDigitalSets.map(digitalSetToOption);

    if (navigationState?.digitalSets?.length) {
      if (fromSource.length) {
        return navigationState.digitalSets.map((navSet) => {
          const full = fromSource.find((set) => set.id === navSet.id);
          return full ?? navDigitalSetToOption(navSet);
        });
      }
      return navigationState.digitalSets.map(navDigitalSetToOption);
    }

    return fromSource;
  }, [navigationState, sourceDigitalSets]);

  const rosterModelFromQuery =
    modelId && !prospectIdFromQuery
      ? getRosterModelById(modelId)
      : resolvedProspectId?.endsWith('-roster')
        ? getRosterModelById(resolvedProspectId)
        : null;
  const prospectFromContext = resolvedProspectId
    ? getProspectById(resolvedProspectId)
    : undefined;

  const canCompare = prospectDigitalSets.length >= 2;
  const prospectName =
    navigationState?.prospectName ??
    prospectFromContext?.name ??
    rosterModelFromQuery?.name ??
    'Prospect';
  const profilePath =
    navigationState?.profilePath ??
    (modelId || resolvedProspectId?.endsWith('-roster')
      ? `/roster/${modelId ?? resolvedProspectId}/history`
      : `/prospects/${resolvedProspectId ?? ''}`);

  const initialSelection = useMemo(
    () =>
      resolveCompareSelection(
        prospectDigitalSets,
        modelId ? undefined : navigationState?.previousSetId
      ),
    [prospectDigitalSets, navigationState?.previousSetId, modelId]
  );

  const [previousSetId, setPreviousSetId] = useState(initialSelection.previousSetId);
  const [currentSetId, setCurrentSetId] = useState(initialSelection.currentSetId);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([
    'Fragrance',
    'Editorial',
  ]);
  const [showResults, setShowResults] = useState(false);
  const [openCompareContext, setOpenCompareContext] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [agentNotes, setAgentNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canCompare) return;
    const next = resolveCompareSelection(
      prospectDigitalSets,
      modelId ? undefined : navigationState?.previousSetId
    );
    setPreviousSetId(next.previousSetId);
    setCurrentSetId(next.currentSetId);
    setShowResults(false);
  }, [location.key, prospectDigitalSets, navigationState?.previousSetId, canCompare, modelId]);

  if (prospectDigitalSets.length === 0) {
    return (
      <div className="p-[32px] min-h-screen flex flex-col items-center justify-center text-center">
        <p
          className="mb-[24px] max-w-[420px]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#666660', lineHeight: 1.6 }}
        >
          No digital sets on file. Upload digitals from the prospect profile to begin comparing.
        </p>
        <button
          type="button"
          onClick={() => navigate(profilePath)}
          className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
          style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
        >
          UPLOAD NEW DIGITAL SET
        </button>
      </div>
    );
  }

  if (!canCompare) {
    const onlySet = prospectDigitalSets[0];
    return (
      <div className="p-[32px] min-h-screen flex flex-col items-center justify-center text-center">
        <p
          className="mb-[12px] max-w-[420px]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#666660', lineHeight: 1.6 }}
        >
          Upload a second digital set to compare progression.
        </p>
        <p
          className="mb-[24px]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880', lineHeight: 1.6 }}
        >
          {getDigitalSetDisplayTitle(onlySet.title)} · {onlySet.date}
        </p>
        <button
          type="button"
          onClick={() => navigate(profilePath)}
          className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
          style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
        >
          UPLOAD NEW DIGITAL SET
        </button>
      </div>
    );
  }

  const previousSet =
    prospectDigitalSets.find((set) => set.id === previousSetId) ?? prospectDigitalSets[0];
  const currentSet =
    prospectDigitalSets.find((set) => set.id === currentSetId) ??
    prospectDigitalSets[prospectDigitalSets.length - 1];

  const previousScoreLabel = toScoreLabel(previousSet.date);
  const currentScoreLabel = toScoreLabel(currentSet.date);

  const toggleContext = (context: string) => {
    setSelectedContexts((prev) =>
      prev.includes(context)
        ? prev.filter((c) => c !== context)
        : [...prev, context]
    );
  };

  const handleSelectAll = () => {
    setSelectedContexts([...contexts]);
  };

  const handleClear = () => {
    setSelectedContexts([]);
  };

  const visibleResults = mockResults.filter((result) =>
    selectedContexts.includes(result.context)
  );

  const summaryCounts = visibleResults.reduce(
    (acc, result) => {
      acc[result.change] += 1;
      return acc;
    },
    { improved: 0, stable: 0, declined: 0 }
  );

  return (
    <div className="p-[32px] min-h-screen flex flex-col overflow-y-auto">
      <div className="flex items-baseline justify-between mb-[20px] flex-shrink-0">
        <div>
          <div className="mb-[4px]">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#6a6a64',
              }}
            >
              Prospects › {prospectName} › Compare
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: '28px',
              color: '#f0f0ec',
              lineHeight: 1.1,
            }}
          >
            Digital Set Comparison
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#a0a09a',
              marginTop: '4px',
            }}
          >
            {prospectName} · {getDigitalSetDisplayTitle(previousSet.title)} ·{' '}
            {previousSet.date} → {getDigitalSetDisplayTitle(currentSet.title)} ·{' '}
            {currentSet.date}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: '#888880',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          HOW TO USE COMPARE MODE
        </button>
      </div>

      {/* STEP 1 — Digital Set Selection */}
      <div className="flex gap-[16px] mb-[32px]" data-tutorial="compare-selectors">
        <div className="flex-1 min-w-0">
          <DigitalSetSelector
            panelLabel="PREVIOUS DIGITALS"
            selectedId={previousSetId}
            onSelect={setPreviousSetId}
            sets={prospectDigitalSets}
          />
          <DigitalsPreviewGrid
            selectedId={previousSetId}
            sets={prospectDigitalSets}
          />
        </div>
        <div className="flex-1 min-w-0">
          <DigitalSetSelector
            panelLabel="CURRENT DIGITALS"
            selectedId={currentSetId}
            onSelect={setCurrentSetId}
            sets={prospectDigitalSets}
          />
          <DigitalsPreviewGrid
            selectedId={currentSetId}
            sets={prospectDigitalSets}
          />
        </div>
      </div>

      {/* STEP 2 — Context Selection */}
      <div className="mb-[24px]">
        <div className="mb-[12px]" style={sectionLabelStyle}>
          SELECT CONTEXTS TO COMPARE
        </div>
        <div className="grid grid-cols-5 gap-[12px]" data-tutorial="compare-contexts">
          {contexts.map((context) => {
            const isSelected = selectedContexts.includes(context);
            return (
              <button
                key={context}
                type="button"
                onClick={() => toggleContext(context)}
                className="px-[16px] py-[10px] border rounded-[4px] transition-all text-[11px] uppercase tracking-[0.1em] w-full cursor-pointer"
                style={{
                  fontFamily: 'var(--font-label)',
                  backgroundColor: isSelected ? '#f0f0ec' : 'transparent',
                  borderColor: isSelected ? '#f0f0ec' : '#2a2a2a',
                  color: isSelected ? '#080808' : '#a0a09a',
                }}
              >
                {context}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-[8px] mt-[12px]">
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#888880',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            SELECT ALL
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880' }}>
            ·
          </span>
          <button
            type="button"
            onClick={handleClear}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#888880',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* STEP 3 — Run Comparison */}
      <button
        type="button"
        onClick={() => setShowResults(true)}
        data-tutorial="compare-run"
        className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 mb-[32px]"
        style={{
          fontFamily: 'var(--font-mono)',
          backgroundColor: '#f0f0ec',
          color: '#080808',
          cursor: 'pointer',
        }}
      >
        RUN COMPARISON
      </button>

      {showResults && (
        <div data-tutorial="compare-results">
          <div className="mb-[8px]" style={sectionLabelStyle}>
            PROGRESSION ANALYSIS
          </div>
          <p
            className="mb-[20px]"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#888880',
            }}
          >
            {getDigitalSetDisplayTitle(previousSet.title)} →{' '}
            {getDigitalSetDisplayTitle(currentSet.title)}
          </p>

          {/* Summary bar */}
          <div
            className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[20px] mb-[16px] flex gap-[24px]"
          >
            {(
              [
                { key: 'improved' as const, label: 'IMPROVED', color: '#4a7a4a' },
                { key: 'stable' as const, label: 'STABLE', color: '#888880' },
                { key: 'declined' as const, label: 'DECLINED', color: '#c87a7a' },
              ] as const
            ).map((stat) => (
              <div key={stat.key} className="flex-1 text-center">
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '24px',
                    color: stat.color,
                  }}
                >
                  {summaryCounts[stat.key]}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: stat.color,
                    marginTop: '4px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Result accordions */}
          <div>
            {visibleResults.map((result) => {
              const changeTag = getCompareChangeTag(result.change);
              const isOpen = openCompareContext === result.context;
              return (
                <div key={result.context}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenCompareContext(isOpen ? null : result.context)
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
                      <div className="flex items-center gap-[12px]">
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '13px',
                            color: '#f0f0ec',
                          }}
                        >
                          {result.oldScore} → {result.newScore}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: changeTag.color,
                            letterSpacing: '0.08em',
                          }}
                        >
                          {changeTag.text}
                        </span>
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
                  </button>

                  {isOpen && (
                    <div className="bg-[#0d0d0d] border border-t-0 border-[#2a2a2a] rounded-b-[4px] px-[24px] py-[20px] mb-[8px]">
                      <div className="flex items-center gap-[16px]">
                        <div className="flex-1">
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '9px',
                              color: '#888880',
                              marginBottom: '4px',
                            }}
                          >
                            {previousScoreLabel}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: '48px',
                              fontWeight: 300,
                              color: '#f0f0ec',
                            }}
                          >
                            {result.oldScore}
                          </div>
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '14px',
                            color: '#888880',
                          }}
                        >
                          →
                        </span>
                        <div className="flex-1 text-right">
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '9px',
                              color: '#888880',
                              marginBottom: '4px',
                            }}
                          >
                            {currentScoreLabel}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: '48px',
                              fontWeight: 300,
                              color: '#f0f0ec',
                            }}
                          >
                            {result.newScore}
                          </div>
                        </div>
                      </div>

                      <div className="h-[1px] bg-[#2a2a2a] my-[16px]" />

                      <div
                        className="uppercase mb-[8px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: '#888880',
                          letterSpacing: '0.1em',
                        }}
                      >
                        ANALYSIS
                      </div>
                      <p
                        className="mb-[16px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          color: '#c0c0ba',
                          lineHeight: 1.8,
                        }}
                      >
                        {result.reasoning}
                      </p>

                      <div
                        className="uppercase mb-[8px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: '#888880',
                          letterSpacing: '0.1em',
                        }}
                      >
                        SUGGESTED NEXT STEP
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          color: '#a0a09a',
                          lineHeight: 1.8,
                        }}
                      >
                        → {result.nextStep}
                      </p>

                      <div
                        className="uppercase mb-[8px] mt-[16px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: '#888880',
                          letterSpacing: '0.1em',
                        }}
                      >
                        AGENT NOTE
                      </div>
                      <textarea
                        value={agentNotes[result.context] ?? ''}
                        onChange={(e) =>
                          setAgentNotes((prev) => ({
                            ...prev,
                            [result.context]: e.target.value,
                          }))
                        }
                        placeholder="Add agent note for this context..."
                        rows={2}
                        className="w-full px-[12px] py-[10px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] resize-none"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: '#f0f0ec',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showTutorial && (
        <TutorialOverlay
          onClose={() => setShowTutorial(false)}
          steps={compareTutorialSteps}
        />
      )}
    </div>
  );
}
