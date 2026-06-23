import React from 'react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import type { DigitalSet } from '../types/talent';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import { TutorialOverlay, compareTutorialSteps } from './TutorialOverlay';
import { DigitalImage } from './DigitalImage';
import { saveComparisonResults } from '../../lib/comparisonStorage';
import {
  compressImageUrlForEvaluation,
  fetchEvaluateContext,
} from '../utils/compressEvaluationImage';

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

function getDigitalSetDisplayTitle(title: string | null | undefined): string {
  const trimmed = title?.trim();
  if (!trimmed || trimmed === 'Untitled Set') {
    return 'Unnamed Set';
  }
  return trimmed;
}

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

function countImageUrls(set: DigitalSetOption): number {
  return [set.front, set.profile, set.threeQuarter, set.fullBody].filter(Boolean)
    .length;
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

const sectionLabelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  color: 'var(--cv-secondary-text)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

export function CompareMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modelId = searchParams.get('modelId');
  const prospectIdFromQuery = searchParams.get('prospectId');
  const navigationState = (location.state ?? null) as CompareNavigationState | null;
  const { getProspectById } = useProspects();
  const { getModelById } = useRoster();

  const resolvedProspectId =
    prospectIdFromQuery ?? navigationState?.prospectId ?? null;

  const sourceDigitalSets = useMemo((): DigitalSet[] => {
    if (modelId) {
      return getModelById(modelId)?.digitalSets ?? [];
    }

    if (resolvedProspectId) {
      if (searchParams.get('profileType') === 'model') {
        return getModelById(resolvedProspectId)?.digitalSets ?? [];
      }

      const prospect = getProspectById(resolvedProspectId);
      return prospect?.digitalSets ?? [];
    }

    return [];
  }, [modelId, resolvedProspectId, getModelById, getProspectById, searchParams]);

  const prospectDigitalSets = useMemo(
    () => sourceDigitalSets.map(digitalSetToOption),
    [sourceDigitalSets],
  );

  const rosterModelFromQuery =
    modelId && !prospectIdFromQuery
      ? getModelById(modelId)
      : searchParams.get('profileType') === 'model'
        ? getModelById(resolvedProspectId ?? '')
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

  const previousSetIdFromUrl = searchParams.get('previousSetId');
  const currentSetIdFromUrl = searchParams.get('currentSetId');

  const [selectedSetIds, setSelectedSetIds] = useState<string[]>(() => {
    const sets = prospectDigitalSets;
    if (
      previousSetIdFromUrl &&
      currentSetIdFromUrl &&
      sets.some((s) => s.id === previousSetIdFromUrl) &&
      sets.some((s) => s.id === currentSetIdFromUrl)
    ) {
      return [previousSetIdFromUrl, currentSetIdFromUrl];
    }
    if (sets.length >= 2) return [sets[sets.length - 1].id, sets[0].id];
    if (sets.length === 1) return [sets[0].id];
    return [];
  });
  const [selectedContexts, setSelectedContexts] = useState<string[]>([
    'Fragrance',
    'Editorial',
  ]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparingStatus, setComparingStatus] = useState('');
  const profileType = searchParams.get('profileType') || 'prospect';

  if (prospectDigitalSets.length === 0) {
    return (
      <div className="p-[32px] min-h-screen flex flex-col items-center justify-center text-center">
        <p
          className="mb-[24px] max-w-[420px]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)', lineHeight: 1.6 }}
        >
          No digital sets on file. Upload digitals from the prospect profile to begin comparing.
        </p>
        <button
          type="button"
          onClick={() => navigate(profilePath)}
          className="px-[16px] py-[10px] border border-[var(--cv-primary-text)] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[var(--cv-primary-text)] hover:text-[var(--cv-background)] transition-colors"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)', cursor: 'pointer' }}
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
          style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)', lineHeight: 1.6 }}
        >
          Upload a second digital set to compare progression.
        </p>
        <p
          className="mb-[24px]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)', lineHeight: 1.6 }}
        >
          {getDigitalSetDisplayTitle(onlySet.title)} · {onlySet.date}
        </p>
        <button
          type="button"
          onClick={() => navigate(profilePath)}
          className="px-[16px] py-[10px] border border-[var(--cv-primary-text)] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[var(--cv-primary-text)] hover:text-[var(--cv-background)] transition-colors"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)', cursor: 'pointer' }}
        >
          UPLOAD NEW DIGITAL SET
        </button>
      </div>
    );
  }

  const previousSet =
    prospectDigitalSets.find((s) => s.id === selectedSetIds[0]) ?? prospectDigitalSets[0];
  const currentSet =
    prospectDigitalSets.find((s) => s.id === selectedSetIds[1]) ?? prospectDigitalSets[1];

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

  const handleRunComparison = async () => {
    if (isComparing || selectedContexts.length === 0) return;
    if (!previousSet || !currentSet) return;

    setIsComparing(true);
    setComparingStatus('Compressing digitals...');

    try {
      // Compress images for both sets
      const compressSet = async (set: DigitalSetOption, label: string) => {
        const urls = [set.front, set.profile, set.threeQuarter, set.fullBody]
          .filter((u): u is string => Boolean(u));

        console.log('[CompareMode] compressing set', {
          label,
          setId: set.id,
          urlCount: urls.length,
        });

        const compressed = await Promise.all(
          urls.map(async (url) => {
            const result = await compressImageUrlForEvaluation(url);
            if (!result) {
              console.warn('[CompareMode] failed to compress image', {
                label,
                setId: set.id,
                url: url.slice(0, 120),
              });
            }
            return result;
          }),
        );
        return compressed.filter((img): img is NonNullable<typeof img> => Boolean(img));
      };

      setComparingStatus('Preparing digital sets...');
      const [prevImages, currImages] = await Promise.all([
        compressSet(previousSet, 'before'),
        compressSet(currentSet, 'after'),
      ]);

      if (prevImages.length === 0 || currImages.length === 0) {
        setIsComparing(false);
        setComparingStatus('');
        console.error('[CompareMode] image preparation failed', {
          beforeSetId: previousSet.id,
          afterSetId: currentSet.id,
          beforeUrlCount: countImageUrls(previousSet),
          afterUrlCount: countImageUrls(currentSet),
          beforeCompressed: prevImages.length,
          afterCompressed: currImages.length,
        });
        alert(
          prevImages.length === 0 && currImages.length === 0
            ? 'Could not load images from either digital set. Re-upload digitals for both sets, then try again.'
            : prevImages.length === 0
              ? 'Could not load images from the BEFORE digital set. Re-upload digitals for that set, then try again.'
              : 'Could not load images from the AFTER digital set. Re-upload digitals for that set, then try again.',
        );
        return;
      }

      // Evaluate both sets for all selected contexts in parallel
      const comparisonResults: Array<{
        context: string;
        oldScore: number;
        newScore: number;
        direction: 'improved' | 'declined' | 'stable';
        reasoning: string;
        nextStep: string;
      }> = [];

      for (let i = 0; i < selectedContexts.length; i++) {
        const context = selectedContexts[i];
        setComparingStatus(
          `Evaluating ${context}... (${i + 1} of ${selectedContexts.length})`,
        );

        // Evaluate previous and current set in parallel for this context
        const [prevResult, currResult] = await Promise.all([
          fetchEvaluateContext({
            prospectName,
            selectedContexts: [context],
            images: prevImages,
          }),
          fetchEvaluateContext({
            prospectName,
            selectedContexts: [context],
            images: currImages,
          }),
        ]);

        const prevEval = prevResult.ok
          ? prevResult.data?.contextEvaluations?.[0]
          : null;
        const currEval = currResult.ok
          ? currResult.data?.contextEvaluations?.[0]
          : null;

        if (!prevEval || !currEval) continue;

        const oldScore = prevEval.alignmentScore;
        const newScore = currEval.alignmentScore;
        const diff = newScore - oldScore;
        const direction: 'improved' | 'declined' | 'stable' =
          diff > 2 ? 'improved' : diff < -2 ? 'declined' : 'stable';

        comparisonResults.push({
          context,
          oldScore,
          newScore,
          direction,
          reasoning: currEval.reasoning,
          nextStep:
            currEval.suggestedNextSteps?.[0] ??
            'Reassess after next digital set upload.',
        });
      }

      if (comparisonResults.length === 0) {
        setIsComparing(false);
        setComparingStatus('');
        alert('Evaluation failed for all selected contexts. Please try again.');
        return;
      }

      setComparingStatus('Building report...');

      const comparisonPayload = {
        results: comparisonResults,
        previousSet: {
          title: previousSet.title,
          date: previousSet.date,
        },
        currentSet: {
          title: currentSet.title,
          date: currentSet.date,
        },
        improvedCount: comparisonResults.filter((r) => r.direction === 'improved')
          .length,
        stableCount: comparisonResults.filter((r) => r.direction === 'stable')
          .length,
        declinedCount: comparisonResults.filter((r) => r.direction === 'declined')
          .length,
      };

      saveComparisonResults(resolvedProspectId ?? '', comparisonPayload);

      navigate(
        `/compare/results?name=${encodeURIComponent(prospectName)}&prospectId=${resolvedProspectId ?? ''}&profileType=${profileType}`,
        { state: { comparisonData: comparisonPayload } },
      );
    } catch (err) {
      console.error('[CompareMode] comparison error:', err);
      setIsComparing(false);
      setComparingStatus('');
      alert('Something went wrong during comparison. Please try again.');
    }
  };

  return (
    <div className="p-[32px] min-h-screen flex flex-col overflow-y-auto">
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
          marginBottom: '24px',
          display: 'block',
        }}
      >
        ← BACK
      </button>

      <div className="flex items-baseline justify-between mb-[20px] flex-shrink-0">
        <div>
          <div className="mb-[4px]">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--cv-secondary-text)',
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
              color: 'var(--cv-primary-text)',
              lineHeight: 1.1,
            }}
          >
            Digital Set Comparison
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--cv-secondary-text)',
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
            color: 'var(--cv-secondary-text)',
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
      <div className="mb-[32px]" data-tutorial="compare-selectors">
        <div className="mb-[12px]" style={sectionLabelStyle}>
          SELECT 2 DIGITAL SETS TO COMPARE
        </div>
        <div className="space-y-[8px]">
          {prospectDigitalSets.map((set) => {
            const isSelected = selectedSetIds.includes(set.id);
            const isDisabled = !isSelected && selectedSetIds.length >= 2;
            const selectionIndex = selectedSetIds.indexOf(set.id);

            return (
              <button
                key={set.id}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  setSelectedSetIds((prev) =>
                    prev.includes(set.id)
                      ? prev.filter((id) => id !== set.id)
                      : [...prev, set.id],
                  );
                }}
                className="w-full flex items-center gap-[16px] p-[14px] rounded-[4px] text-left transition-colors"
                style={{
                  backgroundColor: 'var(--cv-surface)',
                  border: `1px solid ${isSelected ? 'var(--cv-primary-text)' : 'var(--cv-subtle-border)'}`,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.35 : 1,
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '2px',
                    border: `1px solid ${isSelected ? 'var(--cv-primary-text)' : 'var(--cv-secondary-text)'}`,
                    backgroundColor: isSelected ? 'var(--cv-primary-text)' : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && (
                    <span style={{ color: 'var(--cv-background)', fontSize: '10px', lineHeight: 1 }}>
                      ✓
                    </span>
                  )}
                </div>

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--cv-elevated)',
                    flexShrink: 0,
                  }}
                >
                  {set.front && (
                    <DigitalImage
                      storageRef={set.front}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 15%',
                      }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: 'var(--cv-primary-text)',
                    }}
                  >
                    {set.date || getDigitalSetDisplayTitle(set.title)}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--cv-secondary-text)',
                      marginTop: '2px',
                    }}
                  >
                    {set.date}
                  </div>
                </div>

                {isSelected && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color: 'var(--cv-secondary-text)',
                      letterSpacing: '0.08em',
                      flexShrink: 0,
                    }}
                  >
                    {selectionIndex === 0 ? 'BEFORE' : 'AFTER'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {selectedSetIds.length === 2 && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--cv-secondary-text)',
              marginTop: '10px',
            }}
          >
            Comparing{' '}
            {prospectDigitalSets.find((s) => s.id === selectedSetIds[0])?.date} →{' '}
            {prospectDigitalSets.find((s) => s.id === selectedSetIds[1])?.date}
          </div>
        )}
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
                  backgroundColor: isSelected ? 'var(--cv-primary-text)' : 'transparent',
                  borderColor: isSelected ? 'var(--cv-primary-text)' : 'var(--cv-subtle-border)',
                  color: isSelected ? 'var(--cv-background)' : 'var(--cv-secondary-text)',
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
              color: 'var(--cv-secondary-text)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            SELECT ALL
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}>
            ·
          </span>
          <button
            type="button"
            onClick={handleClear}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--cv-secondary-text)',
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
        onClick={handleRunComparison}
        disabled={isComparing || selectedContexts.length === 0 || selectedSetIds.length !== 2}
        data-tutorial="compare-run"
        className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity mb-[32px]"
        style={{
          fontFamily: 'var(--font-mono)',
          backgroundColor: isComparing ? 'var(--cv-subtle-border)' : 'var(--cv-primary-text)',
          color: isComparing ? 'var(--cv-secondary-text)' : 'var(--cv-background)',
          cursor:
            isComparing || selectedContexts.length === 0 || selectedSetIds.length !== 2
              ? 'not-allowed'
              : 'pointer',
          opacity:
            selectedContexts.length === 0 || selectedSetIds.length !== 2 ? 0.4 : 1,
        }}
      >
        {isComparing ? comparingStatus || 'COMPARING...' : 'RUN COMPARISON'}
      </button>

      {showTutorial && (
        <TutorialOverlay
          onClose={() => setShowTutorial(false)}
          steps={compareTutorialSteps}
        />
      )}
    </div>
  );
}
