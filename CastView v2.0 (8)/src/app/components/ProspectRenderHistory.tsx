import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ChevronRight, Upload, X } from 'lucide-react';
import { useProspects, type Prospect } from '../context/ProspectsContext';
import { useRoster, type RosterModel } from '../context/RosterContext';
import { getRosterModelById } from './Roster';
import type { DigitalSet, Evaluation } from '../types/talent';
import { TutorialOverlay, uploadTutorialSteps } from './TutorialOverlay';

type ProfileType = 'prospect' | 'model';

type ProfileData = {
  name: string;
  status: string;
  statusColor: string;
  signedDate?: string;
  evaluations?: number;
  digitalSets: DigitalSet[];
};

function getRosterStatusColor(status: string) {
  if (status === 'ACTIVE') return '#5d7d5d';
  if (status === 'ON HOLD') return '#7d6d4d';
  return '#5d3d3d';
}

const sectionLabelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  color: '#888880',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

const ghostButtonClass =
  'px-[10px] py-[6px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[9px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors';

function countDigitalsOnFile(digitalSet: DigitalSet) {
  return [digitalSet.front, digitalSet.profile, digitalSet.threeQuarter, digitalSet.fullBody].filter(
    Boolean
  ).length;
}

function getFitLabelColor(fitLabel: string) {
  if (fitLabel.includes('STRONG')) return '#4a7a4a';
  if (fitLabel.includes('MODERATE')) return '#888880';
  if (fitLabel.includes('LOW')) return '#c87a7a';
  return '#888880';
}

function digitalGridSlots(digitalSet: DigitalSet) {
  return [
    { label: 'FRONT', url: digitalSet.front },
    { label: 'PROFILE', url: digitalSet.profile },
    { label: '3/4', url: digitalSet.threeQuarter },
    { label: 'FULL BODY', url: digitalSet.fullBody },
  ];
}

const emptyUploadForm = {
  title: '',
  date: '',
  front: '',
  profile: '',
  threeQuarter: '',
  fullBody: '',
  notes: '',
  tags: '',
};

type UploadFormImageKey = 'front' | 'profile' | 'threeQuarter' | 'fullBody';

const uploadFormImageKeys: UploadFormImageKey[] = [
  'front',
  'profile',
  'threeQuarter',
  'fullBody',
];

function revokeUploadFormBlobUrls(form: typeof emptyUploadForm) {
  uploadFormImageKeys.forEach((key) => {
    const url = form[key];
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
}

const formFieldLabelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  color: '#888880',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

const formInputStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  color: '#f0f0ec',
};

function formatTagsLine(digitalSet: DigitalSet) {
  const tags =
    digitalSet.tags.length > 0 ? digitalSet.tags.join(', ') : 'no tags';
  return `Uploaded ${digitalSet.uploadedAt}  ·  ${tags}`;
}

type ContextEvaluationRow = {
  evaluationId: string;
  completedAt: string;
  context: string;
  alignmentScore: number;
  fitLabel: string;
  reasoning: string;
};

function getContextEvaluationRows(evaluation: Evaluation): ContextEvaluationRow[] {
  return evaluation.contexts.map((contextEvaluation) => ({
    evaluationId: evaluation.id,
    completedAt: evaluation.completedAt,
    context: contextEvaluation.context,
    alignmentScore: contextEvaluation.alignmentScore,
    fitLabel: contextEvaluation.fitLabel,
    reasoning:
      contextEvaluation.reasoning ||
      'Alignment analysis completed from uploaded digitals.',
  }));
}

type ProspectRenderHistoryProps = {
  profileType?: ProfileType;
};

function resolveProfileData(
  profileType: ProfileType,
  modelId?: string,
  contextProspect?: Prospect,
  models: RosterModel[] = [],
  searchParams?: URLSearchParams | null,
): ProfileData | null {
  if (profileType === 'model') {
    const model = getRosterModelById(modelId ?? '');
    const contextModel = !model
      ? models.find((m) => m.id === (modelId ?? ''))
      : null;
    const resolvedModel = model ?? contextModel;
    if (resolvedModel) {
      return {
        name: resolvedModel.name,
        status: resolvedModel.status,
        statusColor: getRosterStatusColor(resolvedModel.status),
        digitalSets: resolvedModel.digitalSets,
      };
    }
    return {
      name: searchParams?.get('name')
        ? decodeURIComponent(searchParams.get('name')!)
        : 'Unknown Model',
      status: 'ACTIVE',
      statusColor: getRosterStatusColor('ACTIVE'),
      digitalSets: [],
    };
  }

  if (contextProspect) {
    return {
      name: contextProspect.name,
      status: contextProspect.status,
      statusColor: contextProspect.statusColor,
      evaluations: contextProspect.evaluations,
      digitalSets: contextProspect.digitalSets,
    };
  }

  return null;
}

export function ProspectRenderHistory({
  profileType = 'prospect',
}: ProspectRenderHistoryProps) {
  const { prospectId, modelId } = useParams();
  const [searchParams] = useSearchParams();
  const { getProspectById, updateProspect } = useProspects();
  const { updateModel, models } = useRoster();
  const isProspect = profileType === 'prospect';
  const isModel = profileType === 'model';
  const contextProspect = isProspect
    ? getProspectById(prospectId ?? '')
    : undefined;
  const resolvedProfile = resolveProfileData(
    profileType,
    modelId,
    contextProspect,
    models,
    searchParams,
  );
  const showProspectNotFound = isProspect && !resolvedProfile;
  const activeProfile: ProfileData = resolvedProfile ?? {
    name: '',
    status: '',
    statusColor: '#888880',
    digitalSets: [],
  };

  const [status, setStatus] = useState(activeProfile.status);
  const [statusColor, setStatusColor] = useState(activeProfile.statusColor);
  const [pendingStatusChange, setPendingStatusChange] = useState<null | {
    previousStatus: string;
    previousColor: string;
    newStatus: string;
    newColor: string;
  }>(null);
  const [openedSetId, setOpenedSetId] = useState<string | null>(null);
  const [notesBySet, setNotesBySet] = useState<Record<string, string>>({});
  const [digitalSets, setDigitalSets] = useState<DigitalSet[]>(activeProfile.digitalSets);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [uploadForm, setUploadForm] = useState(emptyUploadForm);
  const [uploadFileNames, setUploadFileNames] = useState<
    Partial<Record<UploadFormImageKey, string>>
  >({});
  const [deleteEvalTarget, setDeleteEvalTarget] = useState<{
    setId: string;
    evalId: string;
  } | null>(null);
  const navigate = useNavigate();

  const resetUploadFormState = () => {
    setUploadForm((prev) => {
      revokeUploadFormBlobUrls(prev);
      return emptyUploadForm;
    });
    setUploadFileNames({});
  };

  useEffect(() => {
    if (showUploadForm) return;
    const profile = resolveProfileData(
      profileType,
      modelId,
      contextProspect,
      models,
      searchParams,
    );
    if (!profile) return;
    setDigitalSets([...profile.digitalSets]);
    setStatus(profile.status);
    setStatusColor(profile.statusColor);
    setUploadForm((prev) => {
      revokeUploadFormBlobUrls(prev);
      return emptyUploadForm;
    });
    setUploadFileNames({});
    setOpenedSetId(null);
  }, [
    profileType,
    prospectId,
    modelId,
    contextProspect,
    models,
    searchParams,
  ]);

  const profileDigitalSets = activeProfile.digitalSets;
  const digitalSetCount = profileDigitalSets.length;
  const totalEvaluations =
    typeof activeProfile?.evaluations === 'number'
      ? activeProfile.evaluations
      : activeProfile?.digitalSets?.reduce(
          (sum, ds) => sum + (ds.evaluations?.length || 0),
          0,
        ) ?? 0;
  const hasDigitalSets = digitalSetCount > 0;
  const digitalSetsForDisplay = isProspect ? profileDigitalSets : digitalSets;
  const canCompare = digitalSetsForDisplay.length >= 2;
  const selectedDigitalSetForEvaluation =
    (openedSetId
      ? digitalSetsForDisplay.find((set) => set.id === openedSetId)
      : digitalSetsForDisplay[0]) ?? null;
  const canRunEvaluationOnSelected =
    selectedDigitalSetForEvaluation !== null &&
    (countDigitalsOnFile(selectedDigitalSetForEvaluation) > 0 || isProspect);
  const runEvaluationDisabledTitle = 'Upload digitals before running evaluation';
  const resolvedEntityId = isModel
    ? modelId ?? 'sumith-chittimalla-roster'
    : prospectId ?? 'sumith-chittimalla';
  const profilePath = isModel
    ? `/roster/${resolvedEntityId}`
    : `/prospects/${resolvedEntityId}`;

  const handleCompare = (_previousSetId: string) => {
    navigate(
      `/compare?prospectId=${resolvedEntityId}&profileType=${isModel ? 'model' : 'prospect'}`,
    );
  };

  const handleCompareDigitals = () => {
    if (!canCompare) return;
    handleCompare(digitalSets[digitalSets.length - 1]?.id ?? digitalSets[0].id);
  };

  const handleConfirmDeleteEvaluation = () => {
    if (!deleteEvalTarget) return;
    const { setId, evalId } = deleteEvalTarget;
    const sourceSets = isProspect
      ? (contextProspect?.digitalSets ?? profileDigitalSets)
      : digitalSets;
    const updatedSets = sourceSets.map((set) =>
      set.id === setId
        ? {
            ...set,
            evaluations: (set.evaluations ?? []).filter(
              (evaluation) => evaluation.id !== evalId,
            ),
          }
        : set,
    );

    if (isProspect && prospectId && contextProspect) {
      updateProspect(prospectId, { digitalSets: updatedSets });
    } else if (isModel && modelId) {
      updateModel(modelId, { digitalSets: updatedSets });
      setDigitalSets(updatedSets);
    }

    setDeleteEvalTarget(null);
  };

  const handleSaveDigitalSet = () => {
    const newSet: DigitalSet = {
      id: Date.now().toString(),
      title: uploadForm.title.trim() || 'Untitled Set',
      uploadedAt: uploadForm.date.trim() || '—',
      front: uploadForm.front.trim() || '',
      profile: uploadForm.profile.trim() || '',
      threeQuarter: uploadForm.threeQuarter.trim() || '',
      fullBody: uploadForm.fullBody.trim() || '',
      additionalImages: [],
      notes: uploadForm.notes.trim(),
      tags: [],
      evaluations: [],
    };
    const updatedSets = [newSet, ...digitalSets];
    setDigitalSets(updatedSets);

    if (isProspect && prospectId) {
      const currentProspect = getProspectById(prospectId);
      const baseSets = currentProspect?.digitalSets ?? digitalSets;
      updateProspect(prospectId, {
        digitalSets: [newSet, ...baseSets],
      });
    } else if (isModel && modelId) {
      updateModel(modelId, {
        digitalSets: updatedSets,
      });
    }

    resetUploadFormState();
    setTimeout(() => setShowUploadForm(false), 200);
  };

  const handleCancelUpload = () => {
    resetUploadFormState();
    setShowUploadForm(false);
  };

  const handleClearUploadField = (fieldKey: UploadFormImageKey) => {
    setUploadForm((prev) => {
      const current = prev[fieldKey];
      if (current.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }
      return { ...prev, [fieldKey]: '' };
    });
    setUploadFileNames((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const handleStatusChange = (newStatus: string, newColor: string) => {
    setPendingStatusChange({
      previousStatus: status,
      previousColor: statusColor,
      newStatus: newStatus,
      newColor: newColor,
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

  const toggleOpenSet = (setId: string) => {
    setOpenedSetId((current) => (current === setId ? null : setId));
  };

  return (
    <div className="p-[20px] md:p-[48px]">
      {showProspectNotFound ? (
        <div className="text-center py-[64px]">
          <p
            className="text-[13px] mb-[16px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
          >
            Prospect not found.
          </p>
          <Link
            to="/prospects"
            className="text-[13px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
          >
            ← Back to Prospects
          </Link>
        </div>
      ) : (
        <>
      <div className="flex items-center justify-between mb-[48px]">
        <div className="flex items-center gap-[8px]">
          <Link
            to={isModel ? '/roster' : '/prospects'}
            className="text-[13px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
          >
            {isModel ? 'Roster' : 'Prospects'}
          </Link>
          <ChevronRight size={14} style={{ color: '#6a6a64' }} />
          <span
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
          >
            {activeProfile.name}
          </span>
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
          HOW TO USE DIGITAL SETS
        </button>
      </div>

      <button
        type="button"
        onClick={() =>
          navigate(profileType === 'model' ? '/roster' : '/prospects')
        }
        className="mb-[24px] text-[11px] uppercase tracking-[0.1em] bg-transparent border-none hover:opacity-70 transition-opacity"
        style={{
          fontFamily: 'var(--font-mono)',
          color: '#888880',
          cursor: 'pointer',
        }}
      >
        {profileType === 'model'
          ? '← BACK TO ROSTER'
          : '← BACK TO PROSPECTS'}
      </button>

      <p
        className="mb-[8px]"
        style={sectionLabelStyle}
      >
        {isModel ? 'ROSTER MODEL' : 'PROSPECT PROFILE'}
      </p>

      <h1
        className="text-[48px] mb-[12px]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        {activeProfile.name} — {isModel ? 'Development History' : 'Evaluation History'}
      </h1>

      <p
        className="mb-[12px]"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880' }}
      >
        {isModel
          ? 'Development history'
          : 'Evaluation history for this prospect'}
      </p>

      <p
        className="mb-[48px]"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880' }}
      >
        {digitalSetCount} digital set{digitalSetCount !== 1 ? 's' : ''} · {totalEvaluations}{' '}
        evaluation{totalEvaluations !== 1 ? 's' : ''} completed
        {isProspect && activeProfile.signedDate ? ` · Signed ${activeProfile.signedDate}` : ''}
      </p>

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] mb-[48px]">
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
        {isProspect ? (
          <div className="flex flex-col gap-[12px]">
            <button
              type="button"
              disabled={!canRunEvaluationOnSelected}
              title={!canRunEvaluationOnSelected ? runEvaluationDisabledTitle : undefined}
              onClick={() => {
                if (canRunEvaluationOnSelected) {
                  navigate(
                    `/profile?name=${encodeURIComponent(activeProfile.name)}&prospectId=${resolvedEntityId}&profileType=${profileType}`
                  );
                }
              }}
              className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: '#f0f0ec',
                color: '#080808',
                cursor: canRunEvaluationOnSelected ? 'pointer' : 'not-allowed',
                opacity: canRunEvaluationOnSelected ? 1 : 0.4,
              }}
            >
              RUN EVALUATION
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/compare?prospectId=${resolvedEntityId}&profileType=${isModel ? 'model' : 'prospect'}`,
                )
              }
              className="w-full px-[16px] py-[10px] border border-[#2a2a2a] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:border-[#f0f0ec] transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                color: '#a0a09a',
                cursor: 'pointer',
              }}
            >
              COMPARE DIGITALS
            </button>
            <div className="w-full h-[1px] bg-[#2a2a2a] my-[4px]" />
            <div
              className="text-[9px] uppercase tracking-[0.1em]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: '#666660',
              }}
            >
              PIPELINE DECISION
            </div>
            <div className="flex gap-[12px]">
              <button
                type="button"
                onClick={() => handleStatusChange('SHORTLISTED', '#7d6d4d')}
                className="flex-1 px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
                style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
              >
                SHORTLIST
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('PASSED', '#5d3d3d')}
                className="flex-1 px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
                style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
              >
                PASS
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-[12px]">
            <button
              type="button"
              disabled={!canRunEvaluationOnSelected}
              title={!canRunEvaluationOnSelected ? runEvaluationDisabledTitle : undefined}
              onClick={() => {
                if (canRunEvaluationOnSelected) {
                  navigate(
                    `/profile?name=${encodeURIComponent(activeProfile.name)}&prospectId=${resolvedEntityId}&profileType=${profileType}`
                  );
                }
              }}
              className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: '#f0f0ec',
                color: '#080808',
                cursor: canRunEvaluationOnSelected ? 'pointer' : 'not-allowed',
                opacity: canRunEvaluationOnSelected ? 1 : 0.4,
              }}
            >
              RUN EVALUATION
            </button>
            <div className="flex gap-[12px]">
              <button
                type="button"
                onClick={() => navigate('/share')}
                className="flex-1 px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
                style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
              >
                SHARE DEVELOPMENT REPORT
              </button>
              <button
                type="button"
                disabled={!canCompare}
                onClick={handleCompareDigitals}
                className="flex-1 px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: '#f0f0ec',
                  cursor: canCompare ? 'pointer' : 'not-allowed',
                  opacity: canCompare ? 1 : 0.4,
                }}
              >
                COMPARE DIGITALS
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/roster')}
              className="w-full px-[16px] py-[10px] border border-[#c87a7a] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors"
              style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a', cursor: 'pointer' }}
            >
              DELETE MODEL
            </button>
          </div>
        )}
      </div>

      {!hasDigitalSets ? (
        <div className="text-center py-[80px]">
          <p
            className="mb-[24px]"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#666660' }}
          >
            No digital sets uploaded yet.
          </p>
          {!showUploadForm && (
            <button
              type="button"
              onClick={() => setShowUploadForm(true)}
              className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
              style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
            >
              UPLOAD FIRST DIGITAL SET
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-[16px]" style={sectionLabelStyle}>
            DIGITAL SETS
          </div>

          <div data-tutorial="digital-sets-timeline">
            {digitalSetsForDisplay.map((ds) => {
              const digitalsOnFile = countDigitalsOnFile(ds);
              const isOpen = openedSetId === ds.id;
              const contextRows = (ds.evaluations ?? []).flatMap(getContextEvaluationRows);

              return (
                <div key={ds.id}>
                  <div
                    className="flex items-center gap-[24px] py-[16px]"
                    style={{ borderBottom: '1px solid #1a1a1a' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          color: '#f0f0ec',
                          fontWeight: 700,
                        }}
                      >
                        {ds.title}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: '#888880',
                          marginTop: '4px',
                        }}
                      >
                        {ds.uploadedAt}
                      </div>
                    </div>

                    <div
                      className="flex-shrink-0"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: '#888880',
                      }}
                    >
                      {digitalsOnFile} digital{digitalsOnFile !== 1 ? 's' : ''} ·{' '}
                      {`${ds.evaluations?.length || 0} evaluation${ds.evaluations?.length !== 1 ? 's' : ''}`}
                    </div>

                    <div className="flex items-center gap-[8px] flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleOpenSet(ds.id)}
                        className={ghostButtonClass}
                        style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
                      >
                        OPEN
                      </button>
                      <button
                        type="button"
                        disabled={!canCompare}
                        onClick={() => handleCompare(ds.id)}
                        className={ghostButtonClass}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: '#f0f0ec',
                          cursor: canCompare ? 'pointer' : 'not-allowed',
                          opacity: canCompare ? 1 : 0.4,
                        }}
                      >
                        {isModel ? 'COMPARE DIGITALS' : 'COMPARE'}
                      </button>
                      <button
                        type="button"
                        disabled={digitalsOnFile === 0}
                        title={digitalsOnFile === 0 ? runEvaluationDisabledTitle : undefined}
                        onClick={() => {
                          if (digitalsOnFile > 0) {
                            navigate(
                              `/profile?name=${encodeURIComponent(activeProfile.name)}&prospectId=${resolvedEntityId}&profileType=${profileType}`
                            );
                          }
                        }}
                        className={ghostButtonClass}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: '#f0f0ec',
                          cursor: digitalsOnFile > 0 ? 'pointer' : 'not-allowed',
                          opacity: digitalsOnFile > 0 ? 1 : 0.4,
                        }}
                      >
                        RUN EVALUATION
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="pb-[32px] pt-[24px]">
                      <div
                        data-tutorial="digital-grid"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '2px',
                          width: '100%',
                          maxWidth: '600px',
                          marginBottom: '12px',
                        }}
                      >
                        {digitalGridSlots(ds).map((digital) => (
                          <div key={digital.label} style={{ position: 'relative' }}>
                            {digital.url && (
                              <img
                                src={digital.url}
                                alt={digital.label}
                                style={{
                                  width: '100%',
                                  aspectRatio: '3/4',
                                  objectFit: 'cover',
                                  objectPosition: 'center 15%',
                                  display: 'block',
                                }}
                              />
                            )}
                            <div
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '8px',
                                color: '#666660',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                marginTop: '4px',
                              }}
                            >
                              {digital.label}
                            </div>
                          </div>
                        ))}
                      </div>

                      <p
                        className="mb-[32px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: '#888880',
                        }}
                      >
                        {formatTagsLine(ds)}
                      </p>

                      {contextRows.length > 0 && (
                        <div className="mb-[32px]">
                          <div className="mb-[12px]" style={sectionLabelStyle}>
                            EVALUATIONS
                          </div>
                          <div className="space-y-[8px]">
                            {contextRows.map((row) => (
                              <div
                                key={`${row.evaluationId}-${row.context}`}
                                className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] px-[16px] py-[12px] flex items-center gap-[16px]"
                                style={{ minHeight: '64px', maxHeight: '72px' }}
                              >
                                <div className="w-[25%] flex-shrink-0">
                                  <div
                                    style={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '11px',
                                      color: '#f0f0ec',
                                      textTransform: 'uppercase',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {row.context}
                                  </div>
                                  <div
                                    style={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '9px',
                                      color: '#888880',
                                      marginTop: '4px',
                                    }}
                                  >
                                    {row.completedAt}
                                  </div>
                                </div>

                                <div className="w-[50%] min-w-0">
                                  <p
                                    className="overflow-hidden"
                                    style={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '10px',
                                      color: '#a0a09a',
                                      lineHeight: 1.6,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                    }}
                                  >
                                    {row.reasoning}
                                  </p>
                                </div>

                                <div className="w-[25%] flex-shrink-0 text-right">
                                  <div
                                    style={{
                                      fontFamily: 'Georgia, serif',
                                      fontSize: '28px',
                                      color: '#f0f0ec',
                                      lineHeight: 1,
                                    }}
                                  >
                                    {row.alignmentScore}
                                  </div>
                                  <div
                                    style={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '8px',
                                      color: getFitLabelColor(row.fitLabel),
                                      marginTop: '4px',
                                      letterSpacing: '0.12em',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    {row.fitLabel}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteEvalTarget({
                                      setId: ds.id,
                                      evalId: row.evaluationId,
                                    })
                                  }
                                  className="flex-shrink-0 font-mono text-[9px] text-[#c87a7a] border border-[#c87a7a] bg-transparent px-[8px] py-[3px] rounded-[2px] hover:bg-[#c87a7a] hover:text-[#080808] transition-colors cursor-pointer uppercase tracking-[0.1em]"
                                >
                                  DELETE
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div
                          className="mb-[8px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: '#666660',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          }}
                        >
                          NOTES
                        </div>
                        <textarea
                          value={notesBySet[ds.id] ?? ds.notes}
                          onChange={(e) =>
                            setNotesBySet((prev) => ({
                              ...prev,
                              [ds.id]: e.target.value,
                            }))
                          }
                          placeholder="Agent notes..."
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: '#888880',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #1a1a1a',
                            padding: '4px 0',
                            width: '100%',
                            resize: 'vertical',
                            minHeight: '40px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!canCompare && (
            <p
              className="mt-[8px] mb-[4px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: '#666660',
                fontStyle: 'italic',
              }}
            >
              Upload a second digital set to compare progression.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowUploadForm(true)}
            data-tutorial="upload-new-set"
            className="w-full mt-[16px] px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
          >
            UPLOAD NEW DIGITAL SET
          </button>
        </div>
      )}

      {showUploadForm && (
            <div className="mt-[12px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[20px]">
              <div className="space-y-[16px]">
                <div>
                  <label className="block mb-[8px]" style={formFieldLabelStyle}>
                    SET TITLE
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Post-Cut Digitals, July 2026 Update"
                    className="w-full px-[12px] py-[12px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
                    style={formInputStyle}
                  />
                </div>

                <div>
                  <label className="block mb-[8px]" style={formFieldLabelStyle}>
                    DATE
                  </label>
                  <input
                    type="text"
                    value={uploadForm.date}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, date: e.target.value }))}
                    placeholder="e.g. June 2026"
                    className="w-full px-[12px] py-[12px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
                    style={formInputStyle}
                  />
                </div>

                {(
                  [
                    { key: 'front' as const, label: 'FRONT' },
                    { key: 'profile' as const, label: 'PROFILE' },
                    { key: 'threeQuarter' as const, label: '3/4' },
                    { key: 'fullBody' as const, label: 'FULL BODY' },
                  ] as const
                ).map((field) => {
                  const fieldKey = field.key;
                  const imageUrl = uploadForm[fieldKey];

                  return (
                    <div key={fieldKey}>
                      <label className="block mb-[8px]" style={formFieldLabelStyle}>
                        {field.label}
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        id={`upload-${fieldKey}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setUploadForm((prev) => {
                            const current = prev[fieldKey];
                            if (current.startsWith('blob:')) {
                              URL.revokeObjectURL(current);
                            }
                            const url = URL.createObjectURL(file);
                            return {
                              ...prev,
                              [fieldKey]: url,
                            };
                          });
                          setUploadFileNames((prev) => ({
                            ...prev,
                            [fieldKey]: file.name,
                          }));
                          e.target.value = '';
                        }}
                      />
                      {imageUrl ? (
                        <div
                          style={{
                            width: '100%',
                            height: '80px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '8px',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#1a2a1a',
                              border: '1px solid #4a7a4a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <span style={{ color: '#4a7a4a', fontSize: '14px' }}>
                              ✓
                            </span>
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '9px',
                              color: '#4a7a4a',
                              textAlign: 'center',
                              wordBreak: 'break-all',
                              lineHeight: 1.4,
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {uploadFileNames[fieldKey] ?? 'Uploaded'}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(uploadForm[fieldKey]);
                              setUploadForm((prev) => ({
                                ...prev,
                                [fieldKey]: '',
                              }));
                              setUploadFileNames((prev) => {
                                const next = { ...prev };
                                delete next[fieldKey];
                                return next;
                              });
                            }}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(0,0,0,0.7)',
                              border: '1px solid #333',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#f0f0ec',
                              fontSize: '10px',
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div
                          role="button"
                          tabIndex={0}
                          className="relative bg-[#0d0d0d] border border-dashed rounded-[4px] cursor-pointer hover:border-[#3a3a3a] transition-colors"
                          style={{ borderColor: '#2a2a2a', height: '80px' }}
                          onClick={() =>
                            document.getElementById(`upload-${fieldKey}`)?.click()
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              document.getElementById(`upload-${fieldKey}`)?.click();
                            }
                          }}
                        >
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <Upload
                              size={24}
                              style={{ color: '#6a6a64', marginBottom: '8px' }}
                            />
                            <div
                              className="text-[9px] uppercase tracking-[0.1em]"
                              style={{ fontFamily: 'var(--font-label)', color: '#f0f0ec' }}
                            >
                              {field.label}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div>
                  <label className="block mb-[8px]" style={formFieldLabelStyle}>
                    NOTES
                  </label>
                  <textarea
                    rows={2}
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes about this set"
                    className="w-full px-[12px] py-[12px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] resize-none"
                    style={formInputStyle}
                  />
                </div>

                <div>
                  <label className="block mb-[8px]" style={formFieldLabelStyle}>
                    TAGS
                  </label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g. post-shoot, updated, cut"
                    className="w-full px-[12px] py-[12px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
                    style={formInputStyle}
                  />
                </div>

                <div className="flex gap-[12px] pt-[4px]">
                  <button
                    type="button"
                    onClick={handleSaveDigitalSet}
                    className="flex-1 py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: '#f0f0ec',
                      color: '#080808',
                      cursor: 'pointer',
                    }}
                  >
                    SAVE DIGITAL SET
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="flex-1 py-[12px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
                    style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
      )}

      {deleteEvalTarget && (
        <div
          className="fixed inset-0 bg-[rgba(8,8,8,0.85)] flex items-center justify-center z-50"
          onClick={() => setDeleteEvalTarget(null)}
        >
          <div
            className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[32px] max-w-[380px] w-full mx-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="mb-[12px]"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 300,
                color: '#f0f0ec',
              }}
            >
              Delete evaluation?
            </h3>
            <p
              className="mb-[24px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#a0a09a',
                lineHeight: 1.8,
              }}
            >
              This will permanently remove this evaluation from the digital set.
              This cannot be undone.
            </p>
            <div className="flex gap-[12px]">
              <button
                type="button"
                onClick={() => setDeleteEvalTarget(null)}
                className="flex-1 py-[12px] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:border-[#f0f0ec] transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: '#a0a09a',
                }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEvaluation}
                className="flex-1 py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: '#c87a7a',
                  color: '#080808',
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingStatusChange && (
        <div
          className="fixed bottom-[80px] left-1/2 -translate-x-1/2 flex items-center gap-[16px] px-[20px] py-[14px] border rounded-[4px] z-50"
          style={{
            backgroundColor: '#1a1a1a',
            borderColor: '#2a2a2a',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
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
              cursor: 'pointer',
            }}
          >
            UNDO
          </button>
        </div>
      )}

      {showTutorial && (
        <TutorialOverlay
          onClose={() => setShowTutorial(false)}
          steps={uploadTutorialSteps}
        />
      )}
        </>
      )}
    </div>
  );
}
