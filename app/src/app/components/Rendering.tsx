import React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check } from 'lucide-react';
import { getContextData } from '../constants/contextMockData';
import { useProspects } from '../context/ProspectsContext';
import {
  compressImageUrlForEvaluation,
  EVALUATION_REQUEST_TIMEOUT_MS,
  fetchEvaluateContext,
  getEvaluationPayloadByteSize,
  logCompressedImageSizesInDev,
  MAX_EVALUATION_PAYLOAD_BYTES,
} from '../utils/compressEvaluationImage';
import {
  createEvaluationId,
  saveEvaluationError,
  saveEvaluationReport,
  type StoredContextEvaluation,
  type StoredEvaluationReport,
} from '../utils/evaluationStorage';

const EVALUATION_UNAVAILABLE_MSG = 'Evaluation temporarily unavailable.';

type ContextEvaluationResult = StoredContextEvaluation;

function logEvaluation(event: string, details: Record<string, unknown> = {}) {
  console.log(`[CastView evaluation] ${event}`, details);
}

function buildMockEvaluationData(
  contexts: string[],
  meta: {
    evaluationId: string;
    prospectName: string;
    prospectId: string;
    contextsParam: string;
    profileType: string;
  },
): StoredEvaluationReport {
  return {
    evaluationId: meta.evaluationId,
    prospectName: meta.prospectName,
    prospectId: meta.prospectId,
    contextsParam: meta.contextsParam,
    profileType: meta.profileType,
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
    unavailableContexts: [],
    updatedAt: new Date().toISOString(),
  };
}

function buildReport(
  evaluationId: string,
  prospectName: string,
  prospectId: string,
  contextsParam: string,
  profileType: string,
  contextEvaluations: ContextEvaluationResult[],
  unavailableContexts: string[],
): StoredEvaluationReport {
  return {
    evaluationId,
    prospectName,
    prospectId,
    contextsParam,
    profileType,
    contextEvaluations,
    unavailableContexts,
    updatedAt: new Date().toISOString(),
  };
}

function showEvaluationReadyNotification(
  prospectName: string,
  evaluationId: string,
  resultsPath: string,
  navigate: (path: string) => void,
) {
  if (!('Notification' in window)) return;

  const notify = () => {
    const notification = new Notification('Evaluation Results Ready', {
      body: `${prospectName} · tap to view report`,
      icon: '/favicon.svg',
      tag: evaluationId,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
      navigate(`${resultsPath}&evaluationId=${evaluationId}`);
    };
  };

  if (Notification.permission === 'granted') {
    notify();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') notify();
    });
  }
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
  const [flowFinished, setFlowFinished] = useState(false);
  const [completedEvaluationId, setCompletedEvaluationId] = useState<string | null>(
    null,
  );

  const finalizeCalledRef = useRef(false);
  const pendingTimersRef = useRef<number[]>([]);

  const queueProgress =
    selectedContexts.length > 0
      ? (completedContextCount / selectedContexts.length) * 100
      : 0;

  const runEvaluation = useCallback(async () => {
    const contextsToEvaluate = selectedContexts;
    const evaluationId = createEvaluationId();
    const totalSelectedContexts = contextsToEvaluate.length;

    finalizeCalledRef.current = false;
    pendingTimersRef.current.forEach((id) => window.clearTimeout(id));
    pendingTimersRef.current = [];

    if (totalSelectedContexts === 0) {
      setEvaluationError('Select at least one context to evaluate.');
      setFlowFinished(true);
      setEvaluationReady(true);
      return;
    }

    logEvaluation('flow_start', {
      evaluationId,
      contexts: contextsToEvaluate,
      totalSelectedContexts,
    });

    const combinedEvaluations: ContextEvaluationResult[] = [];
    const unavailableContexts: string[] = [];
    let processedContexts = 0;

    const persistPartialReport = () => {
      const report = buildReport(
        evaluationId,
        prospectName,
        prospectId,
        contextsParam,
        profileType,
        combinedEvaluations,
        unavailableContexts,
      );
      saveEvaluationReport(report);
      logEvaluation('results_save_trigger', {
        evaluationId,
        successfulContexts: combinedEvaluations.length,
        unavailableContexts: unavailableContexts.length,
        processedContexts,
        totalSelectedContexts,
      });
    };

    const clearPendingTimers = () => {
      pendingTimersRef.current.forEach((id) => window.clearTimeout(id));
      pendingTimersRef.current = [];
    };

    const finalizeEvaluation = () => {
      if (finalizeCalledRef.current) return;
      finalizeCalledRef.current = true;

      const successfulContexts = combinedEvaluations.length;
      const resultsUrl = `${resultsPath}&evaluationId=${evaluationId}`;

      logEvaluation('finalizeEvaluation triggered', {
        evaluationId,
        processedContexts,
        totalSelectedContexts,
        successfulContexts,
        failedContexts: unavailableContexts.length,
      });

      clearPendingTimers();
      setEvaluatingContextLabel(null);
      setCurrentStep(steps.length);
      setProgress(100);
      setCompletedContextCount(totalSelectedContexts);
      setEvaluationComplete(successfulContexts > 0);
      setFlowFinished(true);
      setEvaluationReady(true);
      setCompletedEvaluationId(evaluationId);

      persistPartialReport();

      if (successfulContexts > 0) {
        if (prospectId) {
          try {
            const newEvaluation = {
              id: evaluationId,
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

        showEvaluationReadyNotification(
          prospectName,
          evaluationId,
          resultsPath,
          navigate,
        );

        logEvaluation('navigation_triggered', { evaluationId, resultsUrl });
        navigate(resultsUrl, { replace: true });
        return;
      }

      setEvaluationError(EVALUATION_UNAVAILABLE_MSG);
      if (import.meta.env.DEV) {
        saveEvaluationReport(
          buildMockEvaluationData(contextsToEvaluate, {
            evaluationId,
            prospectName,
            prospectId,
            contextsParam,
            profileType,
          }),
        );
        logEvaluation('navigation_triggered', {
          evaluationId,
          resultsUrl,
          reason: 'dev_mock_fallback',
        });
        navigate(resultsUrl, { replace: true });
      } else {
        saveEvaluationError(EVALUATION_UNAVAILABLE_MSG);
        logEvaluation('navigation_triggered', {
          evaluationId,
          resultsUrl,
          reason: 'all_contexts_failed_show_unavailable',
        });
        navigate(resultsUrl, { replace: true });
      }
    };

    const maybeFinalize = () => {
      logEvaluation('processedContexts count', {
        processedContexts,
        totalSelectedContexts,
      });
      if (processedContexts >= totalSelectedContexts) {
        finalizeEvaluation();
      }
    };

    const markContextProcessed = (
      context: string,
      outcome: 'success' | 'failed',
      processedIndex: number,
    ) => {
      processedContexts += 1;
      setCompletedContextCount(processedContexts);
      setProgress(100);
      logEvaluation(outcome === 'success' ? 'context_success' : 'context_failed', {
        context,
        processedContexts,
        totalSelectedContexts,
        successfulContexts: combinedEvaluations.length,
        failedContexts: unavailableContexts.length,
      });
      maybeFinalize();
    };

    try {
      setFlowFinished(false);
      setCurrentStep(0);
      setProgress(0);
      setCompletedContextCount(0);
      setEvaluatingContextLabel('Analysing digitals...');

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

      logCompressedImageSizesInDev(images, 'digitals');
      logEvaluation('digitals_ready', { imageCount: images.length });

      if (images.length === 0) {
        for (const context of contextsToEvaluate) {
          unavailableContexts.push(context);
        }
        processedContexts = totalSelectedContexts;
        setCompletedContextCount(processedContexts);
        if (import.meta.env.DEV) {
          saveEvaluationReport(
            buildMockEvaluationData(contextsToEvaluate, {
              evaluationId,
              prospectName,
              prospectId,
              contextsParam,
              profileType,
            }),
          );
        }
        finalizeEvaluation();
        return;
      }

      setProgress(100);

      for (let index = 0; index < contextsToEvaluate.length; index += 1) {
        if (finalizeCalledRef.current) break;

        const context = contextsToEvaluate[index];
        const stepIndex = index + 1;

        setCurrentStep(stepIndex);
        setProgress(0);
        setEvaluatingContextLabel(`Evaluating ${context}...`);

        logEvaluation('context_started', {
          evaluationId,
          context,
          index: index + 1,
          total: totalSelectedContexts,
        });

        const requestBody = {
          prospectName,
          selectedContexts: [context],
          images,
        };

        const payloadBytes = getEvaluationPayloadByteSize(requestBody);
        logEvaluation('context_payload', {
          context,
          payloadKb: Math.round(payloadBytes / 1024),
        });

        if (payloadBytes > MAX_EVALUATION_PAYLOAD_BYTES) {
          unavailableContexts.push(context);
          persistPartialReport();
          logEvaluation('context_failed', { context, reason: 'payload_too_large' });
          markContextProcessed(context, 'failed', index);
          continue;
        }

        try {
          const contextRequestStartedAt = new Date();
          const contextRequestStartedAtMs = Date.now();
          console.log('[CastView] context start:', context, {
            timeoutMs: EVALUATION_REQUEST_TIMEOUT_MS,
            requestStartTimestamp: contextRequestStartedAt.toISOString(),
          });
          const result = await fetchEvaluateContext(
            requestBody,
            EVALUATION_REQUEST_TIMEOUT_MS,
          );
          const contextResponseAt = new Date();
          const contextDurationMs = Date.now() - contextRequestStartedAtMs;
          console.log('[CastView] context response timestamp:', context, {
            responseTimestamp: contextResponseAt.toISOString(),
            totalDurationMs: contextDurationMs,
          });

          if (result.ok && result.data?.contextEvaluations?.length) {
            const evaluation =
              result.data.contextEvaluations.find(
                (entry) =>
                  entry.context.toLowerCase() === context.toLowerCase(),
              ) ?? result.data.contextEvaluations[0];

            if (
              evaluation &&
              typeof evaluation.alignmentScore === 'number' &&
              typeof evaluation.reasoning === 'string' &&
              evaluation.reasoning.trim()
            ) {
              const mapped: ContextEvaluationResult = {
                context,
                alignmentScore: evaluation.alignmentScore,
                fitLabel: evaluation.fitLabel,
                reasoning: evaluation.reasoning,
                strengths: evaluation.strengths ?? [],
                risks: evaluation.risks ?? [],
                marketSignals: evaluation.marketSignals ?? [],
                suggestedNextSteps: evaluation.suggestedNextSteps ?? [],
              };
              combinedEvaluations.push(mapped);
              persistPartialReport();
              console.log('[CastView] context success:', context, {
                timeoutMs: EVALUATION_REQUEST_TIMEOUT_MS,
                requestStartTimestamp: contextRequestStartedAt.toISOString(),
                responseTimestamp: contextResponseAt.toISOString(),
                totalDurationMs: contextDurationMs,
              });
              console.log('[CastView] context response payload:', context, mapped);
              logEvaluation('context_success', { context, evaluation: mapped });
              markContextProcessed(context, 'success', index);
            } else {
              console.log('[CastView] context fail:', context, 'missing_fields', result.data);
              unavailableContexts.push(context);
              persistPartialReport();
              logEvaluation('context_failed', {
                context,
                reason: 'missing_required_fields',
              });
              markContextProcessed(context, 'failed', index);
            }
          } else {
            const failReason =
              result.status === 504
                ? 'gateway_timeout'
                : result.status === 502
                  ? 'anthropic_error'
                  : result.status === 413
                    ? 'payload_too_large'
                    : 'api_error';
            console.log('[CastView] context fail:', context, failReason, {
              status: result.status,
              body: result.errorBody?.slice(0, 1500),
              timeoutMs: EVALUATION_REQUEST_TIMEOUT_MS,
              requestStartTimestamp: contextRequestStartedAt.toISOString(),
              responseTimestamp: contextResponseAt.toISOString(),
              totalDurationMs: contextDurationMs,
            });
            unavailableContexts.push(context);
            persistPartialReport();
            logEvaluation('context_failed', {
              context,
              reason: failReason,
              status: result.status,
              errorBody: result.errorBody?.slice(0, 1500),
            });
            markContextProcessed(context, 'failed', index);
          }
        } catch (error) {
          const isTimeout =
            error instanceof Error && error.message === 'EVALUATION_TIMEOUT';
          const contextResponseAt = new Date();
          if (isTimeout) {
            console.error(`context timeout: ${context}`);
          }
          console.log(
            '[CastView] context fail:',
            context,
            isTimeout ? 'timeout' : 'request_error',
            {
              error,
              timeoutMs: EVALUATION_REQUEST_TIMEOUT_MS,
              responseTimestamp: contextResponseAt.toISOString(),
            },
          );
          unavailableContexts.push(context);
          persistPartialReport();
          logEvaluation(isTimeout ? 'context_timeout' : 'context_failed', {
            context,
            message: error instanceof Error ? error.message : 'unknown',
          });
          markContextProcessed(context, 'failed', index);
        }
      }

      maybeFinalize();
    } catch (error) {
      logEvaluation('flow_error', {
        message: error instanceof Error ? error.message : 'unknown',
        processedContexts,
        totalSelectedContexts,
      });

      while (processedContexts < totalSelectedContexts) {
        const missing = contextsToEvaluate[processedContexts];
        if (missing && !unavailableContexts.includes(missing)) {
          unavailableContexts.push(missing);
        }
        processedContexts += 1;
      }
      setCompletedContextCount(processedContexts);
      maybeFinalize();
    } finally {
      clearPendingTimers();
      if (!finalizeCalledRef.current) {
        maybeFinalize();
      }
      logEvaluation('flow_complete', {
        evaluationId,
        processedContexts,
        totalSelectedContexts,
        successfulContexts: combinedEvaluations.length,
        unavailableContexts: unavailableContexts.length,
        finalized: finalizeCalledRef.current,
      });
    }
  }, [
    prospectId,
    prospectName,
    selectedContexts,
    contextsParam,
    profileType,
    steps.length,
    resultsPath,
    getProspectById,
    updateProspect,
    navigate,
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await runEvaluation();
      if (!cancelled) {
        setEvaluationReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runEvaluation]);

  useEffect(() => {
    return () => {
      pendingTimersRef.current.forEach((id) => window.clearTimeout(id));
      pendingTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (flowFinished || currentStep >= steps.length) {
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
  }, [currentStep, flowFinished, steps]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (evaluationComplete) {
      const dismissTimer = setTimeout(() => {
        setEvaluationComplete(false);
      }, 6000);
      return () => clearTimeout(dismissTimer);
    }
  }, [evaluationComplete]);
  
  return (
    <div className="flex items-center justify-center min-h-screen p-[48px]">
      <div
        style={{
          position: 'fixed',
          top: '32px',
          left: '32px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#888880',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            padding: 0,
          }}
        >
          ← BACK
        </button>
      </div>
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
            Estimated Time
          </div>
          <div 
            className="text-[32px]" 
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 300, color: '#f0f0ec' }}
          >
            1-3 minutes
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
              1-3 minutes
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
              onClick={() => {
                const url = completedEvaluationId
                  ? `${resultsPath}&evaluationId=${completedEvaluationId}`
                  : resultsPath;
                navigate(url, { replace: true });
              }}
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