import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { X } from 'lucide-react';

interface TutorialStep {
  headline: string;
  body: string;
  spotlightSelector?: string;
  spotlightPosition?: { top: number; left: number; width: number; height: number };
  tooltipPosition: 'right' | 'below' | 'left' | 'below-center';
  requiredPath?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    headline: 'Your workspace',
    body: 'The sidebar is your main navigation. Prospects are unsigned talent you\'re evaluating. Roster is your signed models. Shared tracks client packages you\'ve sent out.',
    spotlightPosition: { top: 0, left: 0, width: 240, height: 1000 },
    tooltipPosition: 'right'
  },
  {
    headline: 'Your pipeline at a glance',
    body: 'The briefing shows your live pipeline — total prospects, shortlisted, awaiting review, and your active roster. The SAVED THIS MONTH card tracks cost avoided vs. test shoots.',
    spotlightSelector: '[data-tutorial="stats-row"]',
    tooltipPosition: 'below-center',
    requiredPath: '/'
  },
  {
    headline: 'Adding a new prospect',
    body: 'Click ADD PROSPECT to start the intake flow. You\'ll enter basic info, confirm consent, then upload their digitals. The whole process takes under two minutes.',
    spotlightSelector: '[data-tutorial="add-prospect-button"]',
    tooltipPosition: 'below',
    requiredPath: '/prospects'
  },
  {
    headline: 'Basic information',
    body: 'Enter the prospect\'s name, primary market, and source. Measurements and notes are optional but help your team build context over time. Source tagging lets you filter by how talent came in.',
    spotlightSelector: '[data-tutorial="basic-info-form"]',
    tooltipPosition: 'right',
    requiredPath: '/prospects/new'
  },
  {
    headline: 'Uploading digitals',
    body: 'Upload front, profile, 3/4, and full body shots. Standard agency digitals — nothing special required. The AI uses these to generate context-specific evaluations adapted to their features.',
    spotlightSelector: '[data-tutorial="upload-area"]',
    tooltipPosition: 'below',
    requiredPath: '/prospects/new/digitals'
  },
  {
    headline: 'Choosing evaluation contexts',
    body: 'Select which shoot contexts to evaluate against — Fragrance, Editorial, Campaign, Runway, and more. Each context has its own scoring model. You can run multiple at once.',
    spotlightSelector: '[data-tutorial="context-grid"]',
    tooltipPosition: 'below',
    requiredPath: '/profile'
  },
  {
    headline: 'Understanding the score',
    body: 'Every evaluation produces a Fit Score with a full breakdown — Composition, Style Match, Versatility, Market Fit. Use AGREE to log your confirmation or OVERRIDE to record your own judgment. Both signals improve the model over time.',
    spotlightSelector: '[data-tutorial="score-panel"]',
    tooltipPosition: 'left',
    requiredPath: '/results'
  },
  {
    headline: 'Sharing with clients',
    body: 'Generate a clean share link for your client. They see the evaluation package in a dedicated portal — no login required. You\'ll be notified when they view or respond. Track all outstanding packages from your Dashboard.',
    spotlightSelector: '[data-tutorial="share-panel"]',
    tooltipPosition: 'left',
    requiredPath: '/share'
  }
];

interface TutorialOverlayProps {
  onClose: () => void;
}

export function TutorialOverlay({ onClose }: TutorialOverlayProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const step = tutorialSteps[currentStep];
  const totalSteps = tutorialSteps.length;

  // Navigate to first step on mount
  useEffect(() => {
    const firstStep = tutorialSteps[0];
    if (firstStep.requiredPath && 
        location.pathname !== firstStep.requiredPath) {
      navigate(firstStep.requiredPath);
    }
  }, []);

  // Ref to hold the RAF id so we can cancel on cleanup
  const rafRef = useRef<number | null>(null);

  // Core measure function — reads live getBoundingClientRect
  const measureElement = useCallback((skipFallback = false) => {
    if (step.spotlightPosition) {
      setSpotlightRect(step.spotlightPosition);
      return true;
    }
    if (!step.spotlightSelector) {
      if (!skipFallback) {
        setSpotlightRect({
          top: window.innerHeight / 2 - 160,
          left: window.innerWidth / 2 - 240,
          width: 480,
          height: 320
        });
      }
      return true;
    }
    const element = document.querySelector(step.spotlightSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setSpotlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      return true; // found
    }
    // Element not in DOM yet — don't write fallback
    return false; // not found
  }, [step]);

  // On step change: hide tooltip, wait for nav+render, 
  // then measure and show tooltip
  useEffect(() => {
    setTooltipVisible(false);
    
    let attempts = 0;
    const maxAttempts = 20; // 20 × 50ms = 1 second max

    const poll = () => {
      const found = measureElement(true); // skipFallback = true
      if (found) {
        setTimeout(() => setTooltipVisible(true), 200);
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 50);
        } else {
          // Only show fallback after exhausting all attempts
          measureElement(false);
          setTimeout(() => setTooltipVisible(true), 200);
        }
      }
    };

    // Short initial delay for navigation to fire, then poll
    const timer = setTimeout(poll, 100);
    return () => clearTimeout(timer);
  }, [currentStep, measureElement]);

  // Continuously track on scroll and resize using RAF
  // This updates spotlightRect (and therefore the tooltip
  // via getTooltipStyle) on every frame where scroll moves
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastScrollX = window.scrollX;

    const onFrame = () => {
      const scrolled = 
        window.scrollY !== lastScrollY || 
        window.scrollX !== lastScrollX;
      if (scrolled) {
        lastScrollY = window.scrollY;
        lastScrollX = window.scrollX;
        measureElement();
      }
      rafRef.current = requestAnimationFrame(onFrame);
    };

    rafRef.current = requestAnimationFrame(onFrame);

    // Also listen for window resize
    window.addEventListener('resize', measureElement, { passive: true });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('resize', measureElement);
    };
  }, [measureElement]);

  // ResizeObserver — watches the target element itself
  // so if its dimensions change (e.g. upload grid resized)
  // the spotlight box updates automatically
  useEffect(() => {
    if (!step.spotlightSelector) return;
    const element = document.querySelector(step.spotlightSelector);
    if (!element) return;

    const observer = new ResizeObserver(() => {
      measureElement();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [step.spotlightSelector, measureElement]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      const nextStep = tutorialSteps[currentStep + 1];
      setTooltipVisible(false);
      
      if (nextStep.requiredPath && 
          location.pathname !== nextStep.requiredPath) {
        navigate(nextStep.requiredPath);
        // Wait for navigation + DOM render before updating step
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
        }, 350);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = tutorialSteps[currentStep - 1];
      setTooltipVisible(false);
      
      if (prevStep.requiredPath && 
          location.pathname !== prevStep.requiredPath) {
        navigate(prevStep.requiredPath);
        setTimeout(() => {
          setCurrentStep(currentStep - 1);
        }, 350);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect) return {};

    const padding = 24;

    switch (step.tooltipPosition) {
      case 'right':
        return {
          top: `${spotlightRect.top + spotlightRect.height / 2}px`,
          left: `${spotlightRect.left + spotlightRect.width + padding}px`,
          transform: 'translateY(-50%)'
        };
      case 'below':
        return {
          top: `${spotlightRect.top + spotlightRect.height + padding}px`,
          left: `${spotlightRect.left}px`
        };
      case 'below-center':
        return {
          top: `${spotlightRect.top + spotlightRect.height + padding}px`,
          left: `${spotlightRect.left + spotlightRect.width / 2}px`,
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          top: `${spotlightRect.top + spotlightRect.height / 2}px`,
          left: `${spotlightRect.left - 340 - padding}px`,
          transform: 'translateY(-50%)'
        };
      default:
        return {};
    }
  };

  return (
    <div 
      className="fixed inset-0 transition-opacity duration-300"
      style={{ 
        zIndex: 100,
        opacity: isVisible ? 1 : 0,
        cursor: 'default',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      {/* SKIP TUTORIAL */}
      <button
        onClick={handleClose}
        className="fixed top-[24px] right-[24px] flex items-center gap-[8px] px-[16px] py-[10px] transition-opacity hover:opacity-60"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#888880',
          cursor: 'pointer',
          zIndex: 102
        }}
      >
        <X size={14} />
        SKIP TUTORIAL
      </button>

      {spotlightRect && (
        <>
          {/* Spotlight with dimming shadow */}
          <div
            className="fixed transition-all duration-[400ms] ease-in-out"
            style={{
              top: `${spotlightRect.top - 6}px`,
              left: `${spotlightRect.left - 6}px`,
              width: `${spotlightRect.width + 12}px`,
              height: `${spotlightRect.height + 12}px`,
              border: '2px solid rgba(240, 240, 236, 0.9)',
              borderRadius: '6px',
              boxShadow: '0 0 0 9999px rgba(8, 8, 8, 0.88), 0 0 24px rgba(240, 240, 236, 0.12)',
              pointerEvents: 'none',
              zIndex: 102
            }}
          />

          {/* Tooltip card */}
          <div
            className="fixed bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] transition-opacity duration-200"
            style={{
              ...getTooltipStyle(),
              maxWidth: '340px',
              opacity: tooltipVisible ? 1 : 0,
              pointerEvents: tooltipVisible ? 'auto' : 'none',
              zIndex: 103
            }}
          >
            {/* Step Counter */}
            <div 
              className="text-[10px] uppercase tracking-[0.1em] mb-[12px]"
              style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
            >
              STEP {currentStep + 1} OF {totalSteps}
            </div>

            {/* Headline */}
            <h2 
              className="text-[24px] mb-[16px]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
            >
              {step.headline}
            </h2>

            {/* Body */}
            <p 
              className="mb-[24px]"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '12px', 
                color: '#c8c8c2',
                lineHeight: '1.7'
              }}
            >
              {step.body}
            </p>

            {/* Buttons */}
            <div className="flex gap-[12px] mb-[16px]">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-[16px] py-[10px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  borderColor: '#2a2a2a',
                  color: currentStep === 0 ? '#444440' : '#a0a09a',
                  backgroundColor: 'transparent',
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentStep === 0 ? 0.5 : 1
                }}
              >
                BACK
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-[16px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: '#f0f0ec',
                  color: '#080808',
                  cursor: 'pointer'
                }}
              >
                {currentStep === totalSteps - 1 ? 'FINISH' : 'NEXT →'}
              </button>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-[6px]">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-full transition-colors"
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: index === currentStep ? '#f0f0ec' : '#2a2a2a'
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}