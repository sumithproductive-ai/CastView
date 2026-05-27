import React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check } from 'lucide-react';
import { getContextData } from '../constants/contextMockData';
import { useProspects } from '../context/ProspectsContext';
import type { DigitalSet } from '../types/talent';

const EVALUATION_STORAGE_KEY = 'castview_evaluation_results';

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
};

function collectDigitalImages(digitalSet: DigitalSet | undefined): string[] {
  if (!digitalSet) return [];
  return [
    digitalSet.front,
    digitalSet.profile,
    digitalSet.threeQuarter,
    digitalSet.fullBody,
    ...digitalSet.additionalImages,
  ].filter((url): url is string => Boolean(url));
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
    () =>
      selectedContexts.length > 0
        ? [
            { name: 'Analysing Digitals', duration: 2000 },
            ...selectedContexts.map((ctx) => ({
              name: ctx,
              duration: 2500,
            })),
            { name: 'Alignment', duration: 2000 },
          ]
        : [
            { name: 'Analysing Digitals', duration: 2000 },
            { name: 'Fragrance', duration: 2500 },
            { name: 'Alignment', duration: 2000 },
          ],
    [selectedContexts],
  );

  const prospectId = searchParams.get('prospectId') || '';
  const profileType = searchParams.get('profileType') || 'prospect';
  const resultsPath = `/results?name=${encodeURIComponent(prospectName)}&contexts=${contextsParam}&prospectId=${prospectId}&profileType=${profileType}`;
  const notificationContext = selectedContexts[0] || 'Fragrance';
  const notificationBody = `${prospectName} · ${notificationContext} 94% · View results`;

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [queueProgress, setQueueProgress] = useState(0);
  const [evaluationComplete, setEvaluationComplete] = useState(false);
  const [evaluationReady, setEvaluationReady] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const runEvaluation = useCallback(async () => {
    try {
      const prospect = getProspectById(prospectId);
      const digitalSet = prospect?.digitalSets?.[0];

      const getImageData = (dataUrl: string) => {
        if (!dataUrl || !dataUrl.startsWith('data:')) return null;
        const parts = dataUrl.split(',');
        if (parts.length < 2) return null;
        return {
          data: parts[1],
          mediaType:
            parts[0].replace('data:', '').replace(';base64', '') || 'image/jpeg',
        };
      };

      const fetchImageAsBase64 = async (url: string) => {
        if (!url) return null;
        if (url.startsWith('data:')) {
          return getImageData(url);
        }
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise<{ data: string; mediaType: string } | null>(
            (resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                resolve(getImageData(dataUrl));
              };
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            }
          );
        } catch {
          return null;
        }
      };

      const imageUrls = [
        digitalSet?.front,
        digitalSet?.profile,
        digitalSet?.threeQuarter,
        digitalSet?.fullBody,
      ].filter(Boolean) as string[];

      const images = (
        await Promise.all(imageUrls.map((img) => fetchImageAsBase64(img)))
      ).filter(Boolean);

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospectName,
          selectedContexts: selectedContexts.length > 0 ? selectedContexts : ['Fragrance'],
          images,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        sessionStorage.setItem(
          EVALUATION_STORAGE_KEY,
          JSON.stringify(data),
        );

        if (prospectId && data.contextEvaluations) {
          try {
            const newEvaluation = {
              id: `eval-${Date.now()}`,
              completedAt: new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }),
              contexts: data.contextEvaluations,
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
      } else {
        setEvaluationError('Evaluation temporarily unavailable.');
        sessionStorage.setItem(
          EVALUATION_STORAGE_KEY,
          JSON.stringify(buildMockEvaluationData(selectedContexts.length > 0 ? selectedContexts : ['Fragrance'])),
        );
      }
    } catch (error) {
      console.error('Evaluation API error:', error);
      setEvaluationError('Evaluation temporarily unavailable.');
      sessionStorage.setItem(
        EVALUATION_STORAGE_KEY,
        JSON.stringify(buildMockEvaluationData(selectedContexts.length > 0 ? selectedContexts : ['Fragrance'])),
      );
    } finally {
      setEvaluationReady(true);
    }
  }, [prospectId, prospectName, selectedContexts, getProspectById, updateProspect]);

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
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentStep(c => c + 1);
          return 0;
        }
        return prev + increment;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [currentStep, navigate, resultsPath, steps]);

  // Queue progress bar animation (240 seconds = 4 minutes)
  useEffect(() => {
    const queueInterval = setInterval(() => {
      setQueueProgress(prev => {
        if (prev >= 100) return 100;
        return prev + (100 / 2400); // 240 seconds * 10 updates per second
      });
    }, 100);
    
    return () => clearInterval(queueInterval);
  }, []);

  // Simulate evaluation completion notification after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      // Request permission then show notification
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('CastView — Evaluation complete', {
            body: notificationBody,
            icon: '/favicon.ico'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('CastView — Evaluation complete', {
                body: notificationBody,
                icon: '/favicon.ico'
              });
            }
          });
        }
      }
      // Also show in-app toast
      setEvaluationComplete(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [notificationBody]);

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
              2 of 4
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
              ✓ Evaluation complete — {prospectName}
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