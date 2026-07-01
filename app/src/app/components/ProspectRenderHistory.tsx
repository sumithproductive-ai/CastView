import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ChevronRight, Upload, X } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
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
  signed_status?: string;
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
  color: 'var(--cv-secondary-text)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

const ghostButtonClass =
  'px-[10px] py-[6px] border border-[var(--cv-primary-text)] bg-transparent rounded-[4px] text-[9px] uppercase tracking-[0.1em] hover:bg-[var(--cv-primary-text)] hover:text-[var(--cv-background)] transition-colors';

function countDigitalsOnFile(digitalSet: DigitalSet) {
  return [digitalSet.front, digitalSet.profile, digitalSet.threeQuarter, digitalSet.fullBody].filter(
    Boolean
  ).length;
}

function getFitLabelColor(fitLabel: string) {
  if (fitLabel.includes('STRONG')) return '#4a7a4a';
  if (fitLabel.includes('MODERATE')) return 'var(--cv-secondary-text)';
  if (fitLabel.includes('LOW')) return '#c87a7a';
  return 'var(--cv-secondary-text)';
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
  color: 'var(--cv-secondary-text)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

const formInputStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  color: 'var(--cv-primary-text)',
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
        signed_status: contextProspect.signed_status,
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
    statusColor: 'var(--cv-secondary-text)',
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
  const [isMessagesOpen, setIsMessagesOpen] = useState(
    () => searchParams.get('tab') === 'messages',
  );
  const [signedStatusSaveConfirmed, setSignedStatusSaveConfirmed] = useState(false);
  const [digitalSetsExpanded, setDigitalSetsExpanded] = useState(false);
  const [evaluationsExpanded, setEvaluationsExpanded] = useState(false);
  const [selectedEvalIds, setSelectedEvalIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [compareSelectMode, setCompareSelectMode] = useState(false);
  const [compareSelectedIds, setCompareSelectedIds] = useState<string[]>([]);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [isDigitalSetsModalOpen, setIsDigitalSetsModalOpen] = useState(false);
  const [selectedDigitalSet, setSelectedDigitalSet] = useState<DigitalSet | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('tab') === 'messages') {
      setIsMessagesOpen(true);
    }
  }, [searchParams]);

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

  const digitalSetCount = digitalSets.length;
  const totalEvaluations = digitalSets.reduce(
    (sum, ds) => sum + (ds.evaluations?.length || 0),
    0,
  );
  const hasDigitalSets = digitalSetCount > 0;
  const digitalSetsForDisplay = digitalSets;
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

  const removeEvaluationFromProfile = async (evalId: string) => {
    try {
      const { error: contextError } = await supabase
        .from('context_evaluations')
        .delete()
        .eq('evaluation_id', evalId);
      if (contextError) throw contextError;

      const { error: evalError } = await supabase
        .from('evaluations')
        .delete()
        .eq('id', evalId);
      if (evalError) throw evalError;

      localStorage.removeItem(`castview_persisted_${evalId}`);
      localStorage.removeItem(`castview_eval_${evalId}`);

      const updatedSets = digitalSets.map((set) => ({
        ...set,
        evaluations: (set.evaluations ?? []).filter((e) => e.id !== evalId),
      }));

      setDigitalSets(updatedSets);
      setSelectedEvalIds((prev) => {
        if (!prev.has(evalId)) return prev;
        const next = new Set(prev);
        next.delete(evalId);
        return next;
      });

      if (isProspect && prospectId) {
        await updateProspect(prospectId, { digitalSets: updatedSets });
      } else if (isModel && modelId) {
        await updateModel(modelId, { digitalSets: updatedSets });
      }

      if (openEvalId === evalId) setOpenEvalId(null);
    } catch (error) {
      console.error('[ProspectRenderHistory] delete evaluation failed:', error);
      window.alert('Could not delete evaluation. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEvalIds.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedEvalIds.size} evaluation${selectedEvalIds.size !== 1 ? 's' : ''}? This cannot be undone.`,
    );
    if (!confirmed) return;
    setBulkDeleting(true);
    for (const evalId of Array.from(selectedEvalIds)) {
      await removeEvaluationFromProfile(evalId);
    }
    setSelectedEvalIds(new Set());
    setBulkDeleting(false);
  };

  const handleConfirmDeleteEvaluation = async () => {
    if (!deleteEvalTarget) return;
    const { evalId } = deleteEvalTarget;
    setDeleteEvalTarget(null);
    await removeEvaluationFromProfile(evalId);
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

  const handleStatusChange = async (newStatus: string, newColor: string) => {
    setPendingStatusChange({
      previousStatus: status,
      previousColor: statusColor,
      newStatus: newStatus,
      newColor: newColor,
    });
    setStatus(newStatus);
    setStatusColor(newColor);
    setTimeout(() => setPendingStatusChange(null), 5000);

    if (isProspect && prospectId) {
      await updateProspect(prospectId, { status: newStatus, statusColor: newColor });
    } else if (isModel && modelId) {
      await updateModel(modelId, { status: newStatus });
    }
  };

  const handleUndoStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { previousStatus, previousColor } = pendingStatusChange;
    setStatus(previousStatus);
    setStatusColor(previousColor);
    setPendingStatusChange(null);

    if (isProspect && prospectId) {
      await updateProspect(prospectId, { status: previousStatus, statusColor: previousColor });
    } else if (isModel && modelId) {
      await updateModel(modelId, { status: previousStatus });
    }
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
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            Prospect not found.
          </p>
          <Link
            to="/prospects"
            className="text-[13px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            ← Back to Prospects
          </Link>
        </div>
      ) : (
        <>
      <div className="flex items-center justify-between mb-[32px]">
        <div className="flex items-center gap-[8px]">
          <Link
            to={isModel ? '/roster' : '/prospects'}
            className="text-[13px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            {isModel ? 'Roster' : 'Prospects'}
          </Link>
          <ChevronRight size={14} style={{ color: 'var(--cv-secondary-text)' }} />
          <span
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
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
            color: 'var(--cv-secondary-text)',
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

      <div className="flex items-start gap-[24px] mb-[32px]">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid var(--cv-subtle-border)',
              backgroundColor: 'var(--cv-surface)',
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
                fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--cv-subtle-border)',
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
              color: 'var(--cv-secondary-text)',
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
            style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)', lineHeight: 1.1 }}
          >
            {activeProfile.name}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}>
            {digitalSetCount} digital set{digitalSetCount !== 1 ? 's' : ''} · {totalEvaluations}{' '}
            evaluation{totalEvaluations !== 1 ? 's' : ''} completed
            {isProspect && activeProfile.signedDate ? ` · Signed ${activeProfile.signedDate}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-[32px] items-start">

        {/* LEFT: primary workflow */}
        <div>
          <div className="flex flex-col gap-[12px] mb-[32px]">
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
                backgroundColor: 'var(--cv-primary-text)',
                color: 'var(--cv-background)',
                cursor: canRunEvaluationOnSelected ? 'pointer' : 'not-allowed',
                opacity: canRunEvaluationOnSelected ? 1 : 0.4,
              }}
            >
              RUN EVALUATION
            </button>
          </div>

          {/* Messages */}
          {((isProspect && prospectId) || (isModel && modelId)) && (
            <div className="mb-[32px]">
              <button
                type="button"
                onClick={() => setIsMessagesOpen((open) => !open)}
                className="flex items-center gap-[8px] bg-transparent border-none p-0 w-full mb-[0px]"
                style={{ cursor: 'pointer' }}
              >
                <span style={sectionLabelStyle}>MESSAGES</span>
                <span style={{ ...sectionLabelStyle, fontSize: '8px' }}>
                  {isMessagesOpen ? '▲' : '▼'}
                </span>
              </button>
              {isMessagesOpen && (
                <div className="mt-[16px]">
                  {isModel && modelId && (
                    <MessageThread
                      prospectId={modelId}
                      prospectName={activeProfile.name}
                      prospectEmail={rosterModelForImage?.email ?? ''}
                    />
                  )}
                  {isProspect && prospectId && (
                    <MessageThread
                      prospectId={prospectId}
                      prospectName={activeProfile?.name ?? ''}
                      prospectEmail={(activeProfile as { email?: string } | undefined)?.email ?? ''}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="w-full h-[1px] bg-[var(--cv-subtle-border)] mb-[32px]" />

          {!hasDigitalSets ? (
            <div className="py-[48px] text-center">
              <p
                className="mb-[24px]"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)' }}
              >
                No digital sets uploaded yet.
              </p>
              <button
                type="button"
                onClick={() => navigate(
                  `/${profileType === 'model' ? 'roster' : 'prospects'}/${resolvedEntityId}/upload-digitals?profileType=${profileType}`
                )}
                className="px-[16px] py-[10px] border border-[var(--cv-primary-text)] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[var(--cv-primary-text)] hover:text-[var(--cv-background)] transition-colors"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)', cursor: 'pointer' }}
              >
                UPLOAD FIRST DIGITAL SET
              </button>
            </div>
          ) : allEvaluations.length > 0 ? (
            <div>
              <div className="mb-[16px] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEvaluationsExpanded(prev => !prev)}
                  className="flex items-center gap-[8px] bg-transparent border-none p-0"
                  style={{ cursor: 'pointer' }}
                >
                  <span style={sectionLabelStyle}>EVALUATIONS</span>
                  <span style={{ ...sectionLabelStyle, fontSize: '8px' }}>
                    {evaluationsExpanded ? '▲' : '▼'}
                  </span>
                </button>
                {evaluationsExpanded && allEvaluations.length > 0 && (
                  <div className="flex items-center">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        const allIds = allEvaluations.map((r) => r.id);
                        if (selectedEvalIds.size === allIds.length) {
                          setSelectedEvalIds(new Set());
                        } else {
                          setSelectedEvalIds(new Set(allIds));
                        }
                      }}
                      style={{
                        fontFamily: 'DM Mono, monospace',
                        fontSize: '11px',
                        color: 'var(--cv-secondary-text)',
                        cursor: 'pointer',
                        marginRight: '12px',
                      }}
                    >
                      {selectedEvalIds.size > 0 ? 'DESELECT ALL' : 'SELECT ALL'}
                    </span>
                    {selectedEvalIds.size > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleBulkDelete();
                        }}
                        disabled={bulkDeleting}
                        style={{
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '11px',
                          color: '#c87a7a',
                          border: '1px solid #c87a7a',
                          background: 'transparent',
                          padding: '3px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        {bulkDeleting ? 'DELETING...' : `DELETE (${selectedEvalIds.size})`}
                      </button>
                    )}
                  </div>
                )}
              </div>

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
                    <div key={ev.id} style={{ borderBottom: '1px solid var(--cv-elevated)' }}>
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
                        <input
                          type="checkbox"
                          checked={selectedEvalIds.has(ev.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedEvalIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) {
                                next.add(ev.id);
                              } else {
                                next.delete(ev.id);
                              }
                              return next;
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            accentColor: '#c8a96e',
                            width: '14px',
                            height: '14px',
                            cursor: 'pointer',
                            marginRight: '10px',
                            flexShrink: 0,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '12px',
                              color: 'var(--cv-primary-text)',
                              fontWeight: 700,
                            }}
                          >
                            {ev.completedAt}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '9px',
                              color: 'var(--cv-secondary-text)',
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
                            color: 'var(--cv-secondary-text)',
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
                            color: 'var(--cv-secondary-text)',
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
                                className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] px-[16px] py-[12px] flex items-center gap-[16px]"
                              >
                                <div className="w-[30%] flex-shrink-0">
                                  <div
                                    style={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '11px',
                                      color: 'var(--cv-primary-text)',
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
                                      color: 'var(--cv-secondary-text)',
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
                                      color: 'var(--cv-primary-text)',
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
                            className="px-[16px] py-[10px] border border-[var(--cv-primary-text)] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[var(--cv-primary-text)] hover:text-[var(--cv-background)] transition-colors"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--cv-primary-text)',
                              cursor: 'pointer',
                            }}
                          >
                            VIEW FULL REPORT →
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm('Delete this evaluation? This cannot be undone.')) return;
                              await removeEvaluationFromProfile(ev.id);
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
          ) : null}
        </div>

        {/* RIGHT: management sidebar */}
        <div
          style={{
            background: 'var(--cv-surface)',
            border: '1px solid var(--cv-subtle-border)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          {/* Status section */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--cv-elevated)' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: 'var(--cv-secondary-text)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Signed Status
            </div>
            <select
              value={activeProfile?.signed_status ?? 'pending'}
              onChange={async (e) => {
                const newStatus = e.target.value;
                if (isProspect && prospectId) {
                  await updateProspect(prospectId, { signed_status: newStatus });
                } else if (isModel && modelId) {
                  await updateModel(modelId, {
                    signed_status: newStatus,
                  } as Parameters<typeof updateModel>[1]);
                }
                await supabase.from('events').insert({
                  agency_id: agencyId,
                  event_type: 'signed_status_updated',
                  metadata: {
                    entityId: prospectId ?? modelId,
                    status: newStatus,
                  },
                });
                setSignedStatusSaveConfirmed(true);
                setTimeout(() => setSignedStatusSaveConfirmed(false), 1500);
              }}
              style={{
                background: 'var(--cv-elevated)',
                border: `1px solid ${signedStatusSaveConfirmed ? '#4a7a4a' : 'var(--cv-subtle-border)'}`,
                borderRadius: '4px',
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--cv-primary-text)',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <option value="pending">PENDING</option>
              <option value="signed">SIGNED</option>
              <option value="passed">PASSED</option>
            </select>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: 'var(--cv-secondary-text)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginTop: '16px',
                marginBottom: '6px',
              }}
            >
              Current Status
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                color: statusColor,
                marginBottom: isProspect ? '16px' : '0',
              }}
            >
              {status}
            </div>

            {isProspect && (
              <div className="flex gap-[8px]">
                <button
                  type="button"
                  onClick={() => handleStatusChange('SHORTLISTED', '#7d6d4d')}
                  className="flex-1 px-[12px] py-[8px] border border-[var(--cv-primary-text)] bg-transparent rounded-[4px] text-[10px] uppercase tracking-[0.1em] hover:bg-[var(--cv-primary-text)] hover:text-[var(--cv-background)] transition-colors"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)', cursor: 'pointer' }}
                >
                  SHORTLIST
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('PASSED', '#5d3d3d')}
                  className="flex-1 px-[12px] py-[8px] border border-[var(--cv-primary-text)] bg-transparent rounded-[4px] text-[10px] uppercase tracking-[0.1em] hover:bg-[var(--cv-primary-text)] hover:text-[var(--cv-background)] transition-colors"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)', cursor: 'pointer' }}
                >
                  PASS
                </button>
              </div>
            )}
          </div>

          {/* Digitals section */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--cv-elevated)' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: 'var(--cv-secondary-text)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              DIGITALS
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--cv-primary-text)',
                marginBottom: '14px',
              }}
            >
              {digitalSetCount} set{digitalSetCount !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-col gap-[8px]">
              <button
                type="button"
                onClick={() => setIsDigitalSetsModalOpen(true)}
                className="w-full px-[12px] py-[8px] border border-[var(--cv-subtle-border)] bg-transparent rounded-[4px] text-[10px] uppercase tracking-[0.1em] hover:border-[var(--cv-primary-text)] transition-colors"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)', cursor: 'pointer' }}
              >
                VIEW DIGITALS
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
                    setIsDigitalSetsModalOpen(true);
                  }
                }}
                className="w-full px-[12px] py-[8px] border border-[var(--cv-subtle-border)] bg-transparent rounded-[4px] text-[10px] uppercase tracking-[0.1em] hover:border-[var(--cv-primary-text)] transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: compareSelectMode ? 'var(--cv-primary-text)' : 'var(--cv-secondary-text)',
                  cursor: canCompare ? 'pointer' : 'not-allowed',
                  opacity: canCompare ? 1 : 0.4,
                }}
              >
                {compareSelectMode ? 'CANCEL COMPARE' : 'COMPARE DIGITALS'}
              </button>
              {!canCompare && (
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--cv-secondary-text)',
                    letterSpacing: '0.03em',
                    margin: '0',
                    lineHeight: '1.5',
                    opacity: 0.6,
                  }}
                >
                  Add another set to compare progress.
                </p>
              )}
              <button
                type="button"
                data-tutorial="upload-new-set"
                onClick={() => navigate(
                  `/${profileType === 'model' ? 'roster' : 'prospects'}/${resolvedEntityId}/upload-digitals?profileType=${profileType}`
                )}
                className="w-full px-[12px] py-[8px] border border-[var(--cv-subtle-border)] bg-transparent rounded-[4px] text-[10px] uppercase tracking-[0.1em] hover:border-[var(--cv-primary-text)] transition-colors"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)', cursor: 'pointer' }}
              >
                UPLOAD NEW DIGITAL SET
              </button>
            </div>
          </div>

          {/* Share Development Report (model only) */}
          {isModel && (
            <div style={{ padding: '20px', borderBottom: '1px solid var(--cv-elevated)' }}>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    isModel && modelId
                      ? `/roster/${modelId}`
                      : `/prospects/${prospectId ?? ''}`,
                  )
                }
                className="w-full px-[12px] py-[8px] border border-[var(--cv-primary-text)] bg-transparent rounded-[4px] text-[10px] uppercase tracking-[0.1em] hover:bg-[var(--cv-primary-text)] hover:text-[var(--cv-background)] transition-colors"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)', cursor: 'pointer' }}
              >
                SHARE DEVELOPMENT REPORT
              </button>
            </div>
          )}

          {/* Danger Zone */}
          {isModel && (
            <div style={{ padding: '20px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: '#c87a7a',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  opacity: 0.6,
                }}
              >
                DANGER ZONE
              </div>
              <button
                type="button"
                onClick={() => navigate('/roster')}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: '#c87a7a',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  padding: 0,
                  textTransform: 'uppercase',
                  opacity: 0.7,
                }}
              >
                delete model
              </button>
            </div>
          )}
        </div>

      </div>

      {showUploadForm && (
            <div className="mt-[12px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[20px]">
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
                    className="w-full px-[12px] py-[12px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px]"
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
                    className="w-full px-[12px] py-[12px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px]"
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
                              color: 'var(--cv-primary-text)',
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
                          className="relative bg-[var(--cv-background)] border border-dashed rounded-[4px] cursor-pointer hover:border-[var(--cv-elevated)] transition-colors"
                          style={{ borderColor: 'var(--cv-subtle-border)', height: '80px' }}
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
                              style={{ color: 'var(--cv-secondary-text)', marginBottom: '8px' }}
                            />
                            <div
                              className="text-[9px] uppercase tracking-[0.1em]"
                              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-primary-text)' }}
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
                    className="w-full px-[12px] py-[12px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px] resize-none"
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
                    className="w-full px-[12px] py-[12px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px]"
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
                      backgroundColor: 'var(--cv-primary-text)',
                      color: 'var(--cv-background)',
                      cursor: 'pointer',
                    }}
                  >
                    SAVE DIGITAL SET
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="flex-1 py-[12px] border border-[var(--cv-primary-text)] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[var(--cv-primary-text)] hover:text-[var(--cv-background)] transition-colors"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)', cursor: 'pointer' }}
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
            className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[32px] max-w-[380px] w-full mx-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="mb-[12px]"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 300,
                color: 'var(--cv-primary-text)',
              }}
            >
              Delete evaluation?
            </h3>
            <p
              className="mb-[24px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--cv-secondary-text)',
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
                className="flex-1 py-[12px] border border-[var(--cv-subtle-border)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:border-[var(--cv-primary-text)] transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cv-secondary-text)',
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
                  color: 'var(--cv-background)',
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
            backgroundColor: 'var(--cv-elevated)',
            borderColor: 'var(--cv-subtle-border)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)' }}>
            Status updated
          </span>
          <button
            onClick={handleUndoStatusChange}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--cv-primary-text)',
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

      <Dialog
        open={isDigitalSetsModalOpen}
        onOpenChange={(open) => {
          setIsDigitalSetsModalOpen(open);
          if (!open) {
            setSelectedDigitalSet(null);
            setCompareSelectMode(false);
            setCompareSelectedIds([]);
          }
        }}
      >
        <DialogContent
          className={selectedDigitalSet
            ? 'max-w-[80vw] w-[80vw] max-h-[90vh] p-0 overflow-y-auto'
            : 'max-w-2xl p-0 overflow-hidden'}
          overlayClassName="bg-black/70 backdrop-blur-md"
          style={{ background: 'var(--cv-background)', borderColor: 'var(--cv-subtle-border)' }}
        >
          {!selectedDigitalSet ? (
            /* List view */
            <div style={{ padding: '32px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: 'var(--cv-secondary-text)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '24px',
                }}
              >
                {compareSelectMode ? 'SELECT TWO DIGITALS TO COMPARE' : 'DIGITALS'}
              </div>
              {digitalSetsForDisplay.length === 0 ? (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)' }}>
                  No digital sets uploaded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {digitalSetsForDisplay.map((ds) => {
                    const isSelected = compareSelectedIds.includes(ds.id);
                    const isDisabled = compareSelectMode && compareSelectedIds.length === 2 && !isSelected;
                    return (
                      <button
                        key={ds.id}
                        type="button"
                        onClick={() => {
                          if (compareSelectMode) {
                            if (isSelected) {
                              setCompareSelectedIds((prev) => prev.filter((id) => id !== ds.id));
                            } else if (compareSelectedIds.length < 2) {
                              setCompareSelectedIds((prev) => [...prev, ds.id]);
                            }
                          } else {
                            setSelectedDigitalSet(ds);
                          }
                        }}
                        style={{
                          background: isSelected ? 'var(--cv-elevated)' : 'var(--cv-surface)',
                          border: `1px solid ${isSelected ? 'var(--cv-primary-text)' : 'var(--cv-subtle-border)'}`,
                          borderRadius: '4px',
                          padding: '16px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          opacity: isDisabled ? 0.3 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                        onMouseEnter={(e) => {
                          if (!isDisabled && !isSelected)
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cv-primary-text)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected)
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cv-subtle-border)';
                        }}
                      >
                        {compareSelectMode && (
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '2px',
                              border: `1px solid ${isSelected ? 'var(--cv-primary-text)' : 'var(--cv-subtle-border)'}`,
                              backgroundColor: isSelected ? 'var(--cv-primary-text)' : 'transparent',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSelected && (
                              <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--cv-background)', borderRadius: '1px' }} />
                            )}
                          </div>
                        )}
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)', marginBottom: '4px' }}>
                            {ds.title && ds.title !== 'Untitled Set' ? ds.title : ds.uploadedAt}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}>
                            {countDigitalsOnFile(ds)} digital{countDigitalsOnFile(ds) !== 1 ? 's' : ''} · {ds.uploadedAt}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {compareSelectMode && compareSelectedIds.length === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    const ids = compareSelectedIds;
                    setIsDigitalSetsModalOpen(false);
                    setCompareSelectMode(false);
                    setCompareSelectedIds([]);
                    navigate(
                      `/compare?prospectId=${resolvedEntityId}&profileType=${profileType}&previousSetId=${ids[0]}&currentSetId=${ids[1]}`,
                    );
                  }}
                  className="w-full mt-[16px] py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'var(--cv-primary-text)',
                    color: 'var(--cv-background)',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  CONFIRM COMPARISON →
                </button>
              )}
              {compareSelectMode && !canCompare && (
                <p
                  className="mt-[8px] mb-[4px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: 'var(--cv-secondary-text)',
                    fontStyle: 'italic',
                  }}
                >
                  Upload a second digital set to compare progression.
                </p>
              )}
            </div>
          ) : (
            /* Detail view */
            <div style={{ padding: '32px', overflowY: 'auto', maxHeight: '90vh' }}>
              <button
                type="button"
                onClick={() => setSelectedDigitalSet(null)}
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
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)', marginBottom: '4px' }}>
                {selectedDigitalSet.title && selectedDigitalSet.title !== 'Untitled Set'
                  ? selectedDigitalSet.title
                  : selectedDigitalSet.uploadedAt}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)', marginBottom: '24px' }}>
                {selectedDigitalSet.uploadedAt}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {digitalGridSlots(selectedDigitalSet).map((d) => (
                  <div key={d.label}>
                    <div
                      style={{
                        height: '36vh',
                        background: 'var(--cv-surface)',
                        border: '1px solid var(--cv-subtle-border)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {d.url && (
                        <DigitalImage
                          storageRef={d.url}
                          alt={d.label}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: 'var(--cv-secondary-text)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                      }}
                    >
                      {d.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
