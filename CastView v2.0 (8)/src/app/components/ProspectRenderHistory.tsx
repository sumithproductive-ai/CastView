import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ChevronRight, Upload, X } from 'lucide-react';
import { SUMITH_DIGITAL_SET_V1, SUMITH_PROSPECT_NAME } from '../constants/sumithProspect';
import { useProspects, type Prospect } from '../context/ProspectsContext';
import { getRosterModelById } from './Roster';
import type { DigitalSet, Evaluation } from '../types/talent';
import { TutorialOverlay, uploadTutorialSteps } from './TutorialOverlay';

type ProfileType = 'prospect' | 'model';

type ProfileData = {
  name: string;
  status: string;
  statusColor: string;
  signedDate?: string;
  digitalSets: DigitalSet[];
};

function getRosterStatusColor(status: string) {
  if (status === 'ACTIVE') return '#5d7d5d';
  if (status === 'ON HOLD') return '#7d6d4d';
  return '#5d3d3d';
}

const sumithProspectData = {
  name: SUMITH_PROSPECT_NAME,
  status: 'IN REVIEW',
  statusColor: '#C8A96E',
  signedDate: 'May 12, 2026',
  digitalSets: [SUMITH_DIGITAL_SET_V1],
};

const sofiaDigitalSet: DigitalSet = {
  id: 'digitals-v1',
  uploadedAt: 'March 2026',
  title: 'Initial Submission',
  front:
    'https://images.unsplash.com/photo-1761329842950-f3551938e4da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFncmFuY2UlMjBlZGl0b3JpYWwlMjBtb2RlbCUyMHBob3RvfGVufDF8fHx8MTc3MzE2NTMzMnww&ixlib=rb-4.1.0&q=80&w=1080',
  profile:
    'https://images.unsplash.com/photo-1708170236080-6cb6d2d5497c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZGl0b3JpYWwlMjBmYXNoaW9uJTIwdmVydGljYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMxNjUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
  threeQuarter:
    'https://images.unsplash.com/photo-1697677103505-dd4b2dbf1b1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wYWlnbiUyMGZhc2hpb24lMjBzaG9vdHxlbnwxfHx8fDE3NzMxNjUzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  fullBody:
    'https://images.unsplash.com/photo-1759873911657-8140566c29a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBlZGl0b3JpYWwlMjBwb3J0cmFpdCUyMHNxdWFyZXxlbnwxfHx8fDE3NzMxNjUzMzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
  additionalImages: [],
  notes: '',
  tags: [],
  evaluations: [
    {
      id: 'eval-1',
      completedAt: 'March 12, 2026',
      contexts: [
        {
          context: 'Fragrance',
          alignmentScore: 94,
          fitLabel: 'STRONG ALIGNMENT',
          reasoning:
            'Strong bone structure and contrast range align with luxury fragrance casting criteria.',
          strengths: [],
          risks: [],
          marketSignals: [],
          suggestedNextSteps: [],
        },
        {
          context: 'Editorial',
          alignmentScore: 96,
          fitLabel: 'STRONG ALIGNMENT',
          reasoning:
            'Editorial versatility indicators are high with strong framing and posture in digitals.',
          strengths: [],
          risks: [],
          marketSignals: [],
          suggestedNextSteps: [],
        },
        {
          context: 'Campaign',
          alignmentScore: 88,
          fitLabel: 'STRONG ALIGNMENT',
          reasoning:
            'Commercial appeal remains strong across campaign context benchmarks.',
          strengths: [],
          risks: [],
          marketSignals: [],
          suggestedNextSteps: [],
        },
        {
          context: 'Runway',
          alignmentScore: 91,
          fitLabel: 'STRONG ALIGNMENT',
          reasoning:
            'Proportion indicators support runway context with consistent full-body presentation.',
          strengths: [],
          risks: [],
          marketSignals: [],
          suggestedNextSteps: [],
        },
      ],
    },
  ],
};

const prospectData = {
  name: 'Sofia Andersen',
  status: 'IN REVIEW',
  statusColor: '#4d3d5d',
  signedDate: 'February 18, 2026',
  digitalSets: [sofiaDigitalSet],
};

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

function countTotalEvaluations(digitalSets: DigitalSet[]) {
  return digitalSets.reduce((total, set) => total + set.evaluations.length, 0);
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
  prospectId?: string,
  modelId?: string,
  contextProspect?: Prospect,
): ProfileData | null {
  if (profileType === 'model') {
    const model = getRosterModelById(modelId ?? '');
    if (model) {
      return {
        name: model.name,
        status: model.status,
        statusColor: getRosterStatusColor(model.status),
        digitalSets: model.digitalSets,
      };
    }
    return {
      name: 'Unknown Model',
      status: 'ACTIVE',
      statusColor: getRosterStatusColor('ACTIVE'),
      digitalSets: [],
    };
  }

  if (prospectId === 'sumith-chittimalla') {
    return {
      name: sumithProspectData.name,
      status: sumithProspectData.status,
      statusColor: sumithProspectData.statusColor,
      signedDate: sumithProspectData.signedDate,
      digitalSets: sumithProspectData.digitalSets,
    };
  }

  if (contextProspect) {
    return {
      name: contextProspect.name,
      status: contextProspect.status,
      statusColor: contextProspect.statusColor,
      digitalSets: contextProspect.digitalSets,
    };
  }

  return null;
}

export function ProspectRenderHistory({
  profileType = 'prospect',
}: ProspectRenderHistoryProps) {
  const { prospectId, modelId } = useParams();
  const { getProspectById } = useProspects();
  const isProspect = profileType === 'prospect';
  const isModel = profileType === 'model';
  const isSumithProspectPage = isProspect && prospectId === 'sumith-chittimalla';
  const contextProspect =
    isProspect && !isSumithProspectPage
      ? getProspectById(prospectId ?? '')
      : undefined;
  const resolvedProfile = resolveProfileData(
    profileType,
    prospectId,
    modelId,
    contextProspect,
  );

  if (isProspect && !isSumithProspectPage && !resolvedProfile) {
    return (
      <motion.div className="p-[20px] md:p-[48px]">
        <div
          className="text-center py-[64px] text-[13px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
        >
          Prospect not found.
        </div>
      </motion.div>
    );
  }

  const activeProfile = resolvedProfile!;

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
  const navigate = useNavigate();

  const resetUploadFormState = () => {
    setUploadForm((prev) => {
      revokeUploadFormBlobUrls(prev);
      return emptyUploadForm;
    });
    setUploadFileNames({});
  };

  useEffect(() => {
    const profile = resolveProfileData(profileType, prospectId, modelId);
    setDigitalSets([...profile.digitalSets]);
    setStatus(profile.status);
    setStatusColor(profile.statusColor);
    setShowUploadForm(false);
    setUploadForm((prev) => {
      revokeUploadFormBlobUrls(prev);
      return emptyUploadForm;
    });
    setUploadFileNames({});
    setOpenedSetId(null);
  }, [profileType, prospectId, modelId]);

  const digitalSetCount = digitalSets.length;
  const evaluationsCompleted = countTotalEvaluations(digitalSets);
  const hasDigitalSets = digitalSetCount > 0;
  const canCompare = digitalSets.length >= 2;
  const resolvedEntityId = isModel
    ? modelId ?? 'sumith-chittimalla-roster'
    : prospectId ?? 'sumith-chittimalla';
  const profilePath = isModel
    ? `/roster/${resolvedEntityId}`
    : `/prospects/${resolvedEntityId}`;

  const handleCompare = (previousSetId: string) => {
    navigate('/compare', {
      state: {
        prospectId: resolvedEntityId,
        prospectName: activeProfile.name,
        profilePath,
        previousSetId,
        digitalSets: digitalSets.map((set) => ({
          id: set.id,
          title: set.title,
          date: set.uploadedAt,
          thumbnail: set.front || '',
        })),
      },
    });
  };

  const handleCompareDigitals = () => {
    if (!canCompare) return;
    handleCompare(digitalSets[digitalSets.length - 1]?.id ?? digitalSets[0].id);
  };

  const handleSaveDigitalSet = () => {
    const newSet: DigitalSet = {
      id: `digitals-${Date.now()}`,
      title: uploadForm.title.trim() || 'Untitled Set',
      uploadedAt: uploadForm.date.trim() || '—',
      front: uploadForm.front.trim() || null,
      profile: uploadForm.profile.trim() || null,
      threeQuarter: uploadForm.threeQuarter.trim() || null,
      fullBody: uploadForm.fullBody.trim() || null,
      additionalImages: [],
      notes: uploadForm.notes.trim(),
      tags: uploadForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      evaluations: [],
    };
    setDigitalSets((prev) => [newSet, ...prev]);
    resetUploadFormState();
    setShowUploadForm(false);
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
        {digitalSetCount} digital set{digitalSetCount !== 1 ? 's' : ''} · {evaluationsCompleted}{' '}
        evaluation{evaluationsCompleted !== 1 ? 's' : ''} completed
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
              onClick={() => navigate('/profile')}
              className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: '#f0f0ec',
                color: '#080808',
                cursor: 'pointer',
              }}
            >
              RUN EVALUATION
            </button>
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
              onClick={() => navigate('/profile')}
              className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: '#f0f0ec',
                color: '#080808',
                cursor: 'pointer',
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
          <button
            type="button"
            className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
          >
            UPLOAD FIRST DIGITAL SET
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-[16px]" style={sectionLabelStyle}>
            DIGITAL SETS
          </div>

          <div data-tutorial="digital-sets-timeline">
            {digitalSets.map((digitalSet) => {
              const digitalsOnFile = countDigitalsOnFile(digitalSet);
              const evaluationCount = digitalSet.evaluations.length;
              const isOpen = openedSetId === digitalSet.id;
              const contextRows = digitalSet.evaluations.flatMap(getContextEvaluationRows);

              return (
                <div key={digitalSet.id}>
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
                        {digitalSet.title}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: '#888880',
                          marginTop: '4px',
                        }}
                      >
                        {digitalSet.uploadedAt}
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
                      {digitalsOnFile} digital{digitalsOnFile !== 1 ? 's' : ''} · {evaluationCount}{' '}
                      evaluation{evaluationCount !== 1 ? 's' : ''}
                    </div>

                    <div className="flex items-center gap-[8px] flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleOpenSet(digitalSet.id)}
                        className={ghostButtonClass}
                        style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
                      >
                        OPEN
                      </button>
                      <button
                        type="button"
                        disabled={!canCompare}
                        onClick={() => handleCompare(digitalSet.id)}
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
                        onClick={() => navigate('/profile')}
                        className={ghostButtonClass}
                        style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}
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
                        {digitalGridSlots(digitalSet).map((digital) => (
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
                        {formatTagsLine(digitalSet)}
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
                          value={notesBySet[digitalSet.id] ?? digitalSet.notes}
                          onChange={(e) =>
                            setNotesBySet((prev) => ({
                              ...prev,
                              [digitalSet.id]: e.target.value,
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
                        <div style={{ position: 'relative' }}>
                          <img
                            src={uploadForm[fieldKey]}
                            alt={field.label}
                            style={{
                              width: '100%',
                              aspectRatio: '3/4',
                              objectFit: 'cover',
                              objectPosition: 'center 15%',
                              display: 'block',
                              borderRadius: '2px',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(uploadForm[fieldKey]);
                              setUploadForm((prev) => ({
                                ...prev,
                                [fieldKey]: '',
                              }));
                            }}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              background: 'rgba(0,0,0,0.7)',
                              border: '1px solid #333',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#f0f0ec',
                              fontSize: '10px',
                            }}
                          >
                            ×
                          </button>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '8px',
                              color: '#888880',
                              marginTop: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                            }}
                          >
                            {field.label} — UPLOADED
                          </div>
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
    </div>
  );
}
