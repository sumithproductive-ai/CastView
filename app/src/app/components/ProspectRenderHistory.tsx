import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ChevronRight, Upload, X } from 'lucide-react';
import { useProspects, type Prospect } from '../context/ProspectsContext';
import { useRoster, type RosterModel } from '../context/RosterContext';
import { getRosterModelById } from './Roster';
import type { DigitalSet, Evaluation } from '../types/talent';
import { TutorialOverlay, uploadTutorialSteps } from './TutorialOverlay';
import { MessageThread } from './MessageThread';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { DigitalImage } from './DigitalImage';

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

function revokeUploadFormBlobUrls(_form: typeof emptyUploadForm) {}

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
  allContexts: string[];
};

function getContextEvaluationRows(evaluation: Evaluation): ContextEvaluationRow[] {
  return evaluation.contexts.map((contextEvaluation) => ({
    evaluationId: evaluation.id,
    completedAt: evaluation.completedAt,
    context: contextEvaluation.context,
    alignmentScore: contextEvaluation.alignmentScore,
    fitLabel: contextEvaluation.fitLabel,
    reasoning: contextEvaluation.reasoning || '',
    allContexts: evaluation.contexts.map((c) => c.context),
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
  const { agencyId } = useAuth();
  const { getProspectById, updateProspect, loading: prospectsLoading } = useProspects();
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
  const showProspectNotFound = isProspect && !resolvedProfile && !prospectsLoading;
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
  const [openEvalId, setOpenEvalId] = useState<string | null>(null);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [digitalSetsExpanded, setDigitalSetsExpanded] = useState(false);
  const [evaluationsExpanded, setEvaluationsExpanded] = useState(false);
  const [compareSelectMode, setCompareSelectMode] = useState(false);
  const [compareSelectedIds, setCompareSelectedIds] = useState<string[]>([]);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
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
  const allEvaluations = digitalSetsForDisplay
    .flatMap((ds) =>
      (ds.evaluations ?? []).map((ev) => ({
        id: ev.id,
        completedAt: ev.completedAt,
        contexts: ev.contexts,
        allContextNames: ev.contexts.map((c) => c.context),
      })),
    )
    .sort((a, b) => b.id.localeCompare(a.id));
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
  const rosterModelForImage = models.find((m) => m.id === (modelId ?? ''));
  const profileImageSrc = isProspect
    ? (contextProspect?.image ?? null)
    : (rosterModelForImage?.image ?? null);
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
    setUploadForm((prev) => ({ ...prev, [fieldKey]: '' }));
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

      <div className="flex items-start gap-[24px] mb-[48px]">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid #2a2a2a',
              backgroundColor: '#111111',
            }}
          >
            {(contextProspect?.image || (models.find(m => m.id === resolvedEntityId)?.image)) ? (
              <DigitalImage
                storageRef={contextProspect?.image || models.find(m => m.id === resolvedEntityId)?.image}
                alt={activeProfile.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: '20px', color: '#2a2a2a',
              }}>
                {activeProfile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <label
            style={{ cursor: 'pointer', display: 'block', marginTop: '6px' }}
            title="Change profile photo"
          >
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              color: '#666660',
              letterSpacing: '0.08em',
              textAlign: 'center',
              textTransform: 'uppercase',
            }}>
              CHANGE
            </div>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = reader.result as string;
                  if (profileType === 'prospect' && prospectId) {
                    updateProspect(prospectId, { image: base64 });
                  } else if (profileType === 'model' && modelId) {
                    updateModel(modelId, { image: base64 });
                  }
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>

        <div className="flex-1 min-w-0">
          <p className="mb-[4px]" style={sectionLabelStyle}>
            {isModel ? 'ROSTER MODEL' : 'PROSPECT PROFILE'}
          </p>
          <h1
            className="text-[40px] mb-[8px]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec', lineHeight: 1.1 }}
          >
            {activeProfile.name}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880' }}>
            {digitalSetCount} digital set{digitalSetCount !== 1 ? 's' : ''} · {totalEvaluations}{' '}
            evaluation{totalEvaluations !== 1 ? 's' : ''} completed
            {isProspect && activeProfile.signedDate ? ` · Signed ${activeProfile.signedDate}` : ''}
          </p>
        </div>
      </div>

          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#a0a09a',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Signed Status
            </div>
            <select
              value={activeProfile?.signed_status ?? 'pending'}
              onChange={async (e) => {
                const newStatus = e.target.value;
                if (isProspect && prospectId) {
                  await updateProspect(prospectId, { 
                    signed_status: newStatus 
                  } as any);
                } else if (isModel && modelId) {
                  await updateModel(modelId, { 
                    signed_status: newStatus 
                  } as any);
                }
                await supabase.from('events').insert({
                  agency_id: agencyId,
                  event_type: 'signed_status_updated',
                  metadata: { 
                    entityId: prospectId ?? modelId, 
                    status: newStatus 
                  },
                });
              }}
              style={{
                background: '#111111',
                border: '1px solid #2a2a2a',
                borderRadius: '4px',
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#F0F0EC',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                width: '100%',
                maxWidth: '200px',
              }}
            >
              <option value="pending">PENDING</option>
              <option value="signed">SIGNED</option>
              <option value="passed">PASSED</option>
            </select>
          </div>

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
              onClick={() => {
                if (compareSelectMode) {
                  setCompareSelectMode(false);
                  setCompareSelectedIds([]);
                } else {
                  setCompareSelectMode(true);
                  setCompareSelectedIds([]);
                  setDigitalSetsExpanded(true);
                }
              }}
              className="w-full px-[16px] py-[10px] border border-[#2a2a2a] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:border-[#f0f0ec] transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                color: '#a0a09a',
                cursor: 'pointer',
              }}
            >
              {compareSelectMode ? 'CANCEL COMPARE' : 'COMPARE DIGITALS'}
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
                onClick={() =>
                  navigate(
                    isModel && modelId
                      ? `/roster/${modelId}`
                      : `/prospects/${prospectId ?? ''}`,
                  )
                }
                className="flex-1 px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
                style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
              >
                SHARE DEVELOPMENT REPORT
              </button>
              <button
                type="button"
                disabled={!canCompare}
                onClick={() => {
                  if (compareSelectMode) {
                    setCompareSelectMode(false);
                    setCompareSelectedIds([]);
                  } else {
                    setCompareSelectMode(true);
                    setCompareSelectedIds([]);
                    setDigitalSetsExpanded(true);
                  }
                }}
                className="flex-1 px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: '#f0f0ec',
                  cursor: canCompare ? 'pointer' : 'not-allowed',
                  opacity: canCompare ? 1 : 0.4,
                }}
              >
                {compareSelectMode ? 'CANCEL COMPARE' : 'COMPARE DIGITALS'}
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

      {((isProspect && prospectId) || (isModel && modelId)) && (
        <>
          <button
            type="button"
            onClick={() => setIsMessagesOpen((open) => !open)}
            className="mt-[32px] mb-[16px] flex items-center gap-[8px] bg-transparent border-none p-0"
            style={{ cursor: 'pointer' }}
          >
            <span style={sectionLabelStyle}>MESSAGES</span>
            <span style={{ ...sectionLabelStyle, fontSize: '8px' }}>
              {isMessagesOpen ? '▲' : '▼'}
            </span>
          </button>

          {isMessagesOpen && (
            <>
              {isModel && modelId && (
                <MessageThread
                  prospectId={modelId}
                  prospectName={activeProfile.name}
                  prospectEmail={(rosterModelForImage as { email?: string } | undefined)?.email ?? ''}
                />
              )}
              {isProspect && prospectId && (
                <MessageThread
                  prospectId={prospectId}
                  prospectName={activeProfile?.name ?? ''}
                  prospectEmail={(activeProfile as { email?: string } | undefined)?.email ?? ''}
                />
              )}
            </>
          )}
        </>
      )}

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
              onClick={() => navigate(
                `/${profileType === 'model' ? 'roster' : 'prospects'}/${resolvedEntityId}/upload-digitals?profileType=${profileType}`
              )}
              className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
              style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
            >
              UPLOAD FIRST DIGITAL SET
            </button>
          )}
        </div>
      ) : (
        <>
        <div>
          <button
            type="button"
            onClick={() => navigate(
              `/${profileType === 'model' ? 'roster' : 'prospects'}/${resolvedEntityId}/upload-digitals?profileType=${profileType}`
            )}
            data-tutorial="upload-new-set"
            className="w-full mt-[16px] px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
          >
            UPLOAD NEW DIGITAL SET
          </button>

          <button
            type="button"
            onClick={() => setDigitalSetsExpanded(prev => !prev)}
            className="mt-[32px] mb-[16px] flex items-center gap-[8px] bg-transparent border-none p-0"
            style={{ cursor: 'pointer' }}
          >
            <span style={sectionLabelStyle}>DIGITAL SETS</span>
            <span style={{ ...sectionLabelStyle, fontSize: '8px' }}>
              {digitalSetsExpanded ? '▲' : '▼'}
            </span>
          </button>

          {digitalSetsExpanded && (
          <>
          <div data-tutorial="digital-sets-timeline">
            {digitalSetsForDisplay.map((ds) => {
              const digitalsOnFile = countDigitalsOnFile(ds);
              const isOpen = openedSetId === ds.id;
              const contextRows = (ds.evaluations ?? []).flatMap(getContextEvaluationRows);

              return (
                <div key={ds.id}>
                  <div
                    className="flex items-center gap-[24px] py-[16px]"
                    style={{
                      borderBottom: '1px solid #1a1a1a',
                      cursor: 'pointer',
                      opacity:
                        compareSelectMode &&
                        compareSelectedIds.length === 2 &&
                        !compareSelectedIds.includes(ds.id)
                          ? 0.3
                          : 1,
                    }}
                    onClick={() => {
                      if (compareSelectMode) {
                        if (compareSelectedIds.includes(ds.id)) {
                          setCompareSelectedIds((prev) =>
                            prev.filter((id) => id !== ds.id),
                          );
                        } else if (compareSelectedIds.length < 2) {
                          setCompareSelectedIds((prev) => [...prev, ds.id]);
                        }
                      } else {
                        toggleOpenSet(ds.id);
                      }
                    }}
                  >
                    {compareSelectMode && (
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '2px',
                          border: `1px solid ${compareSelectedIds.includes(ds.id) ? '#f0f0ec' : '#2a2a2a'}`,
                          backgroundColor: compareSelectedIds.includes(ds.id)
                            ? '#f0f0ec'
                            : 'transparent',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {compareSelectedIds.includes(ds.id) && (
                          <div
                            style={{
                              width: '10px',
                              height: '10px',
                              backgroundColor: '#080808',
                              borderRadius: '1px',
                            }}
                          />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          color: '#f0f0ec',
                          fontWeight: 700,
                        }}
                      >
                        {ds.title && ds.title !== 'Untitled Set' ? ds.title : ds.uploadedAt}
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
                      {!compareSelectMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOpenSet(ds.id);
                        }}
                        className={ghostButtonClass}
                        style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
                      >
                        OPEN
                      </button>
                      )}
                      {!compareSelectMode && (
                      <button
                        type="button"
                        disabled={digitalsOnFile === 0}
                        title={digitalsOnFile === 0 ? runEvaluationDisabledTitle : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
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
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!window.confirm('Delete this digital set? This cannot be undone.')) return;
                          const updatedSets = activeProfile.digitalSets.filter(
                            (digitalSet) => digitalSet.id !== ds.id
                          );
                          if (profileType === 'prospect') {
                            updateProspect(resolvedEntityId, { digitalSets: updatedSets });
                          } else {
                            updateModel(resolvedEntityId, { digitalSets: updatedSets });
                          }
                        }}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: '#c87a7a',
                          background: 'none',
                          border: '1px solid #3a1a1a',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        DELETE
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
                              <DigitalImage
                                storageRef={digital.url}
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
                                className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] px-[16px] py-[12px] flex items-center gap-[16px] hover:border-[#3a3a3a] transition-colors"
                                onClick={() => {
                                  const contextsParam = row.allContexts.join(',');
                                  navigate(
                                    `/results?name=${encodeURIComponent(activeProfile.name)}&contexts=${contextsParam}&prospectId=${resolvedEntityId}&profileType=${profileType}&evaluationId=${row.evaluationId}`,
                                  );
                                }}
                                style={{
                                  minHeight: '64px',
                                  maxHeight: '72px',
                                  cursor: 'pointer',
                                }}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteEvalTarget({
                                      setId: ds.id,
                                      evalId: row.evaluationId,
                                    });
                                  }}
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

          {compareSelectMode && compareSelectedIds.length === 2 && (
            <button
              type="button"
              onClick={() => {
                setCompareSelectMode(false);
                navigate(
                  `/compare?prospectId=${resolvedEntityId}&profileType=${profileType}&previousSetId=${compareSelectedIds[0]}&currentSetId=${compareSelectedIds[1]}`,
                );
              }}
              className="w-full mt-[16px] py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: '#f0f0ec',
                color: '#080808',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              CONFIRM COMPARISON →
            </button>
          )}

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
          </>
          )}
        </div>

        {allEvaluations.length > 0 && (
          <div className="mt-[48px]">
            <button
              type="button"
              onClick={() => setEvaluationsExpanded(prev => !prev)}
              className="mb-[16px] flex items-center gap-[8px] bg-transparent border-none p-0"
              style={{ cursor: 'pointer' }}
            >
              <span style={sectionLabelStyle}>EVALUATIONS</span>
              <span style={{ ...sectionLabelStyle, fontSize: '8px' }}>
                {evaluationsExpanded ? '▲' : '▼'}
              </span>
            </button>

            {evaluationsExpanded && (
            <div>
              {allEvaluations.map((ev) => {
                const isOpen = openEvalId === ev.id;
                const avgScore =
                  ev.contexts.length > 0
                    ? Math.round(
                        ev.contexts.reduce(
                          (sum, c) => sum + c.alignmentScore,
                          0,
                        ) / ev.contexts.length,
                      )
                    : null;

                return (
                  <div key={ev.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <button
                      type="button"
                      onClick={() => setOpenEvalId(isOpen ? null : ev.id)}
                      className="w-full flex items-center gap-[24px] py-[16px] text-left"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
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
                          {ev.completedAt}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: '#888880',
                            marginTop: '4px',
                          }}
                        >
                          {ev.allContextNames.join('  ·  ')}
                        </div>
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: '#888880',
                          flexShrink: 0,
                        }}
                      >
                        {ev.contexts.length} context
                        {ev.contexts.length !== 1 ? 's' : ''}
                        {avgScore != null ? `  ·  avg ${avgScore}%` : ''}
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: '#888880',
                          flexShrink: 0,
                        }}
                      >
                        {isOpen ? '▲' : '▼'}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="pb-[24px]">
                        <div className="space-y-[8px] mb-[16px]">
                          {ev.contexts.map((ctx) => (
                            <div
                              key={ctx.context}
                              className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] px-[16px] py-[12px] flex items-center gap-[16px]"
                            >
                              <div className="w-[30%] flex-shrink-0">
                                <div
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '11px',
                                    color: '#f0f0ec',
                                    textTransform: 'uppercase',
                                    fontWeight: 700,
                                  }}
                                >
                                  {ctx.context}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <p
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '10px',
                                    color: '#a0a09a',
                                    lineHeight: 1.6,
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {ctx.reasoning}
                                </p>
                              </div>

                              <div className="flex-shrink-0 text-right">
                                <div
                                  style={{
                                    fontFamily: 'Georgia, serif',
                                    fontSize: '24px',
                                    color: '#f0f0ec',
                                    lineHeight: 1,
                                  }}
                                >
                                  {ctx.alignmentScore}
                                </div>
                                <div
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '8px',
                                    color: getFitLabelColor(ctx.fitLabel),
                                    marginTop: '4px',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {ctx.fitLabel}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const contextsParam = ev.allContextNames.join(',');
                            navigate(
                              `/results?name=${encodeURIComponent(activeProfile.name)}&contexts=${contextsParam}&prospectId=${resolvedEntityId}&profileType=${profileType}&evaluationId=${ev.id}`,
                            );
                          }}
                          className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: '#f0f0ec',
                            cursor: 'pointer',
                          }}
                        >
                          VIEW FULL REPORT →
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm('Delete this evaluation? This cannot be undone.')) return;
                            const updatedSets = activeProfile.digitalSets.map((digitalSet) => ({
                              ...digitalSet,
                              evaluations: (digitalSet.evaluations ?? []).filter((e) => e.id !== ev.id),
                            }));
                            if (profileType === 'prospect') {
                              updateProspect(resolvedEntityId, { digitalSets: updatedSets });
                            } else {
                              updateModel(resolvedEntityId, { digitalSets: updatedSets });
                            }
                            localStorage.removeItem(`castview_eval_${ev.id}`);
                          }}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            color: '#c87a7a',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            letterSpacing: '0.05em',
                            padding: 0,
                            marginLeft: '16px',
                            textTransform: 'uppercase',
                          }}
                        >
                          DELETE
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}
        </>
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

                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const base64 = evt.target?.result as string;
                            setUploadForm((prev) => ({
                              ...prev,
                              [fieldKey]: base64,
                            }));
                            setUploadFileNames((prev) => ({
                              ...prev,
                              [fieldKey]: file.name,
                            }));
                          };
                          reader.readAsDataURL(file);
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
