import React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check } from 'lucide-react';
import { getContextData } from '../constants/contextMockData';
import { useProspects } from '../context/ProspectsContext';
import {
  compressImageUrlForEvaluation,
  getEvaluationPayloadByteSize,
  logCompressedImageSizesInDev,
  MAX_EVALUATION_PAYLOAD_BYTES,
} from '../utils/compressEvaluationImage';

const EVALUATION_STORAGE_KEY = 'castview_evaluation_results';
const EVALUATION_ERROR_KEY = 'castview_evaluation_error';
const EVALUATION_UNAVAILABLE_MSG = 'Evaluation temporarily unavailable.';

type ContextEvaluationResult = {
  context: string;
  alignmentScore: number;
  fitLabel: string;
  reasoning: string;
  strengths: string[];
  risks: string[];
  marketSignals: string[];
  suggestedNextSteps: string[];
};

type EvaluationApiData = {
  contextEvaluations: ContextEvaluationResult[];
  unavailableContexts?: string[];
};

function saveEvaluationSuccess(data: EvaluationApiData) {
  sessionStorage.removeItem(EVALUATION_ERROR_KEY);
  sessionStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(data));
}

function saveEvaluationFailure(message: string) {
  sessionStorage.removeItem(EVALUATION_STORAGE_KEY);
  sessionStorage.setItem(EVALUATION_ERROR_KEY, message);
}

async function readApiErrorMessage(response: Response): Promise<string> {
  if (import.meta.env.DEV) {
    try {
      const body = await response.json();
      if (typeof body?.error === 'string' && body.error.trim()) {
        console.error('[CastView] /api/evaluate failed:', body);
        return EVALUATION_UNAVAILABLE_MSG;
      }
    } catch {
      // ignore parse errors
    }
  }
  return EVALUATION_UNAVAILABLE_MSG;
}

function handleEvaluationFailure(
  contexts: string[],
  message: string,
  setError: (value: string | null) => void,
) {
  setError(message);

  if (import.meta.env.DEV) {
    saveEvaluationSuccess(buildMockEvaluationData(contexts));
    return;
  }

  saveEvaluationFailure(message);
}

function buildMockEvaluationData(contexts: string[]): EvaluationApiData {
  return {
    contextEvaluations: contexts.map((context) => {
      const mock = getContextData(context);
      return {
        context,
        alignmentScore: mock.score,
        fitLabel: mock.fitLabel,
        reasoning: mock.reasoning,
        strengths: mock.strengths,
        risks: mock.risks,
        marketSignals: mock.marketSignals,
        suggestedNextSteps: mock.suggestedNextSteps,
      };
    }),
  };
}

export function Rendering() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getProspectById, updateProspect } = useProspects();
  const prospectName = searchParams.get('name')
    ? decodeURIComponent(searchParams.get('name')!)
    : 'Prospect';
  const contextsParam = searchParams.get('contexts') || '';
  const selectedContexts = useMemo(
    () => contextsParam.split(',').filter(Boolean),
    [contextsParam],
  );

  const steps = useMemo(
    () => [
      { name: 'Analysing Digitals', duration: 2000 },
      ...selectedContexts.map((ctx) => ({
        name: ctx,
        duration: 2500,
      })),
      { name: 'Alignment', duration: 2000 },
    ],
    [selectedContexts],
  );

  const prospectId = searchParams.get('prospectId') || '';
  const profileType = searchParams.get('profileType') || 'prospect';
  const resultsPath = `/results?name=${encodeURIComponent(prospectName)}&contexts=${contextsParam}&prospectId=${prospectId}&profileType=${profileType}`;
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedContextCount, setCompletedContextCount] = useState(0);
  const [evaluatingContextLabel, setEvaluatingContextLabel] = useState<string | null>(
    null,
  );
  const [evaluationComplete, setEvaluationComplete] = useState(false);
  const [evaluationReady, setEvaluationReady] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const queueProgress =
    selectedContexts.length > 0
      ? (completedContextCount / selectedContexts.length) * 100
      : 0;

  const runEvaluation = useCallback(async () => {
    const contextsToEvaluate = selectedContexts;

    if (contextsToEvaluate.length === 0) {
      setEvaluationError('Select at least one context to evaluate.');
      setEvaluationReady(true);
      return;
    }

    try {
      setCurrentStep(0);
      setProgress(0);
      setCompletedContextCount(0);
      setEvaluatingContextLabel(null);

      const prospect = getProspectById(prospectId);
      const digitalSet = prospect?.digitalSets?.[0];

      const imageUrls = [
        digitalSet?.front,
        digitalSet?.profile,
        digitalSet?.threeQuarter,
        digitalSet?.fullBody,
      ].filter(Boolean) as string[];

      const images = (
        await Promise.all(imageUrls.map((url) => compressImageUrlForEvaluation(url)))
      ).filter((img): img is NonNullable<typeof img> => Boolean(img));

      logCompressedImageSizesInDev(images, 'evaluation');

      if (images.length === 0) {
        handleEvaluationFailure(
          contextsToEvaluate,
          'Missing digitals for evaluation.',
          setEvaluationError,
        );
        return;
      }

      setProgress(100);

      const combinedEvaluations: ContextEvaluationResult[] = [];
      const unavailableContexts: string[] = [];

      for (let index = 0; index < contextsToEvaluate.length; index += 1) {
        const context = contextsToEvaluate[index];
        const stepIndex = index + 1;

        setCurrentStep(stepIndex);
        setProgress(0);
        setEvaluatingContextLabel(`Evaluating ${context}...`);

        const requestBody = {
          prospectName,
          selectedContexts: [context],
          images,
        };

        const payloadBytes = getEvaluationPayloadByteSize(requestBody);

        if (import.meta.env.DEV) {
          console.log(
            `[CastView] ${context} payload: ${(payloadBytes / 1024).toFixed(1)} KB`,
          );
        }

        if (payloadBytes > MAX_EVALUATION_PAYLOAD_BYTES) {
          unavailableContexts.push(context);
          setCompletedContextCount(index + 1);
          setProgress(100);
          continue;
        }

        try {
          const response = await fetch('/api/evaluate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const data = (await response.json()) as EvaluationApiData;
            const evaluation = data.contextEvaluations?.find(
              (entry) =>
                entry.context.toLowerCase() === context.toLowerCase(),
            );

            if (evaluation) {
              combinedEvaluations.push({ ...evaluation, context });
            } else {
              unavailableContexts.push(context);
            }
          } else {
            if (import.meta.env.DEV) {
              await readApiErrorMessage(response);
            }
            unavailableContexts.push(context);
          }
        } catch (error) {
          console.error(`Evaluation API error for ${context}:`, error);
          unavailableContexts.push(context);
        }

        setCompletedContextCount(index + 1);
        setProgress(100);
      }

      setEvaluatingContextLabel(null);

      if (combinedEvaluations.length === 0) {
        handleEvaluationFailure(
          contextsToEvaluate,
          EVALUATION_UNAVAILABLE_MSG,
          setEvaluationError,
        );
        return;
      }

      const combinedReport: EvaluationApiData = {
        contextEvaluations: combinedEvaluations,
        unavailableContexts,
      };

      saveEvaluationSuccess(combinedReport);

      if (prospectId) {
        try {
          const newEvaluation = {
            id: `eval-${Date.now()}`,
            completedAt: new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            contexts: combinedEvaluations,
          };

          const currentProspect = getProspectById(prospectId);
          if (currentProspect?.digitalSets?.length) {
            const updatedSets = [...currentProspect.digitalSets];
            updatedSets[0] = {
              ...updatedSets[0],
              evaluations: [
                newEvaluation,
                ...(updatedSets[0].evaluations || []),
              ],
            };
            updateProspect(prospectId, {
              digitalSets: updatedSets,
            });
          }
        } catch (saveError) {
          console.warn('Could not save evaluation:', saveError);
        }
      }

      if (unavailableContexts.length > 0) {
        setEvaluationError(
          `${unavailableContexts.length} context(s) unavailable. Showing completed results.`,
        );
      }

      setCurrentStep(steps.length - 1);
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentStep(steps.length);
      setEvaluationComplete(true);

      if ('Notification' in window) {
        const body = `${prospectName} · ${combinedEvaluations.length} of ${contextsToEvaluate.length} contexts ready`;
        if (Notification.permission === 'granted') {
          new Notification('Evaluation Results Ready', {
            body,
            icon: '/favicon.svg',
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification('Evaluation Results Ready', {
                body,
                icon: '/favicon.svg',
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Evaluation API error:', error);
      handleEvaluationFailure(
        contextsToEvaluate,
        EVALUATION_UNAVAILABLE_MSG,
        setEvaluationError,
      );
    } finally {
      setEvaluationReady(true);
    }
  }, [
    prospectId,
    prospectName,
    selectedContexts,
    steps.length,
    getProspectById,
    updateProspect,
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await runEvaluation();
      if (!cancelled) setEvaluationReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [runEvaluation]);

  useEffect(() => {
    if (currentStep < steps.length) return;
    if (!evaluationReady) return;
    const timer = setTimeout(() => {
      navigate(resultsPath);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentStep, steps.length, evaluationReady, navigate, resultsPath]);

  useEffect(() => {
    if (currentStep >= steps.length) {
      return;
    }
    
    const stepDuration = steps[currentStep].duration;
    const interval = 50;
    const increment = 100 / (stepDuration / interval);
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return Math.min(95, prev + increment);
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [currentStep, navigate, resultsPath, steps]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (evaluationComplete) {
      const dismissTimer = setTimeout(() => {
        setEvaluationComplete(false);
      }, 6000);
      return () => clearTimeout(dismissTimer);
    }
  }, [evaluationComplete]);
  
  const totalSteps = steps.length;
  const completedSteps = currentStep;
  const estimatedRemaining = steps.slice(currentStep).reduce((sum, step) => sum + step.duration, 0) / 1000;
  
  return (
    <div className="flex items-center justify-center min-h-screen p-[48px]">
      <div className="w-full max-w-[500px]">
        <h1 
          className="text-[48px] text-center mb-[80px]" 
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
        >
          {prospectName}
        </h1>
        
        <div className="space-y-[32px] mb-[80px]">
          {steps.map((step, index) => {
            const isComplete = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;
            
            return (
              <div key={step.name} className="flex items-center gap-[24px]">
                <div 
                  className="w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center"
                  style={{ 
                    borderColor: isComplete || isActive ? '#f0f0ec' : '#2a2a2a',
                    backgroundColor: isComplete ? '#f0f0ec' : 'transparent'
                  }}
                >
                  {isComplete && <Check size={14} style={{ color: '#080808' }} />}
                  {isActive && (
                    <div 
                      className="w-[8px] h-[8px] rounded-full animate-pulse"
                      style={{ backgroundColor: '#f0f0ec' }}
                    />
                  )}
                </div>
                
                <div className="flex-1">
                  <div 
                    style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '14px', 
                      color: isComplete || isActive ? '#f0f0ec' : '#6a6a64' 
                    }}
                  >
                    {step.name}
                  </div>
                  {isActive && (
                    <div className="mt-[8px] h-[2px] bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#f0f0ec] transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <div 
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '13px', 
                    color: '#6a6a64' 
                  }}
                >
                  {isComplete ? '100%' : isActive ? `${Math.round(progress)}%` : '—'}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-center">
          <div 
            className="text-[11px] uppercase tracking-[0.1em] mb-[8px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            Estimated Time Remaining
          </div>
          <div 
            className="text-[32px]" 
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 300, color: '#f0f0ec' }}
          >
            {Math.ceil(estimatedRemaining)}s
          </div>
          {evaluatingContextLabel && (
            <div
              className="mt-[12px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#b9b9b2',
              }}
            >
              {evaluatingContextLabel}
            </div>
          )}
          {selectedContexts.length > 0 && (
            <div
              className="mt-[8px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#888880',
              }}
            >
              {completedContextCount} of {selectedContexts.length} contexts complete
            </div>
          )}
        </div>

        {/* Queue Status Block */}
        <div 
          className="border rounded-[4px] p-[20px] max-w-[400px] mx-auto mt-[32px]"
          style={{ backgroundColor: '#111111', borderColor: '#2a2a2a' }}
        >
          {/* Queue Position */}
          <div className="flex items-center justify-between mb-[12px]">
            <div 
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
            >
              QUEUE POSITION
            </div>
            <div 
              className="text-[24px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
            >
              {Math.min(completedContextCount + 1, selectedContexts.length)} of{' '}
              {selectedContexts.length || 1}
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center justify-between mb-[16px]">
            <div 
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
            >
              ESTIMATED TIME
            </div>
            <div 
              className="text-[16px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#c8c8c2' }}
            >
              ~4 minutes
            </div>
          </div>

          {/* Progress Bar */}
          <div 
            className="w-full h-[2px] rounded overflow-hidden"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <div 
              className="h-full transition-all duration-100 ease-linear"
              style={{ 
                backgroundColor: '#f0f0ec',
                width: `${queueProgress}%`
              }}
            />
          </div>
        </div>

        {/* Queue Another Prospect Button */}
        <div className="text-center mt-[24px]">
          <button
            onClick={() => navigate('/prospects')}
            className="border rounded-[4px] px-[20px] py-[10px] text-[11px] uppercase transition-colors hover:border-[#f0f0ec] hover:text-[#f0f0ec] cursor-pointer"
            style={{ 
              fontFamily: 'var(--font-mono)',
              borderColor: '#2a2a2a',
              color: '#888880'
            }}
          >
            + QUEUE ANOTHER PROSPECT
          </button>
          <div 
            className="text-[11px] italic mt-[8px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
          >
            You'll be notified when this evaluation completes.
          </div>
          {evaluationError && (
            <div
              className="text-[11px] mt-[10px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#b9b9b2' }}
            >
              {evaluationError}
            </div>
          )}
        </div>

        {/* Evaluation Complete Toast */}
        {evaluationComplete && (
          <div 
            className="fixed bottom-[48px] left-1/2 -translate-x-1/2 rounded-[4px] px-[24px] py-[14px] shadow-lg z-50 flex items-center gap-[16px]"
            style={{ backgroundColor: '#f0f0ec', color: '#080808' }}
          >
            <div 
              className="text-[13px]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              ✓ Evaluation Results Ready — {prospectName}
            </div>
            <button
              onClick={() => navigate(resultsPath)}
              className="text-[11px] uppercase hover:underline"
              style={{ fontFamily: 'var(--font-mono)', color: '#080808' }}
            >
              VIEW RESULTS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}