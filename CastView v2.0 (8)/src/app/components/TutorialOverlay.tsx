import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router';
import { X } from 'lucide-react';

const BACKDROP_Z_INDEX = 9998;
const TOOLTIP_Z_INDEX = 9999;

const BOTTOM_CENTER_TOOLTIP: React.CSSProperties = {
  bottom: '100px',
  left: '50%',
  transform: 'translateX(-50%)',
  maxWidth: '480px',
  width: 'calc(100% - 48px)',
};

function getTooltipAnchorX(
  spotlightRect: { left: number; width: number },
  tooltipPosition: TutorialStep['tooltipPosition'],
): number {
  const padding = 24;
  switch (tooltipPosition) {
    case 'right':
      return spotlightRect.left + spotlightRect.width + padding;
    case 'left':
      return spotlightRect.left - 340 - padding;
    case 'below':
      return spotlightRect.left;
    case 'below-center':
    case 'above':
      return spotlightRect.left + spotlightRect.width / 2;
    default:
      return 0;
  }
}

function isTooltipOffscreen(x: number): boolean {
  return x > window.innerWidth - 200 || x < 0;
}

interface TutorialStep {
  headline: string;
  body: string;
  spotlightSelector?: string;
  spotlightPosition?: { top: number; left: number; width: number; height: number };
  tooltipPosition: 'right' | 'below' | 'left' | 'below-center' | 'above';
  requiredPath?: string;
}

const defaultTutorialSteps: TutorialStep[] = [
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
    body: 'Every evaluation produces a Fit Score with a full breakdown — Composition, Style Match, Versatility, Market Fit. Use Confirm Alignment to log your confirmation or Override to record your own judgment. Both signals improve the model over time.',
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

export const compareTutorialSteps: TutorialStep[] = [
  {
    headline: 'Comparing digital sets',
    body: 'Compare Mode lets you track how a model or prospect has developed over time. Select two digital sets — an older one and a newer one — to see progression across every context.',
    spotlightSelector: '[data-tutorial="compare-selectors"]',
    tooltipPosition: 'below-center',
    requiredPath: '/compare',
  },
  {
    headline: 'Choose your contexts',
    body: 'Select which contexts you want to compare. You can compare all contexts at once or focus on the ones most relevant to your current submissions.',
    spotlightSelector: '[data-tutorial="compare-contexts"]',
    tooltipPosition: 'below-center',
    requiredPath: '/compare',
  },
  {
    headline: 'Run the comparison',
    body: 'Hit Run Comparison to generate a side-by-side progression analysis. You\'ll see the alignment score change for each context, with reasoning and suggested next steps.',
    spotlightSelector: '[data-tutorial="compare-run"]',
    tooltipPosition: 'above',
    requiredPath: '/compare',
  },
  {
    headline: 'Reading the results',
    body: 'Each context card shows the old score, new score, and direction of change. Green means improved alignment. Red means declined. Use the agent note field to record your own observations alongside the AI analysis.',
    spotlightSelector: '[data-tutorial="compare-results"]',
    tooltipPosition: 'above',
    requiredPath: '/compare',
  },
];

export const uploadTutorialSteps: TutorialStep[] = [
  {
    headline: 'Digital sets timeline',
    body: 'Every prospect and roster model has a digital sets timeline. Each set is a snapshot of their digitals at a point in time. Uploading new sets over time lets you track progression and compare development.',
    spotlightSelector: '[data-tutorial="digital-sets-timeline"]',
    tooltipPosition: 'right',
    requiredPath: '/prospects/sumith-chittimalla',
  },
  {
    headline: 'Uploading a new digital set',
    body: 'Click Upload New Digital Set to add an updated set of digitals. Give it a descriptive title like "Post-Cut Digitals" or "July 2026 Update" so your team can identify it at a glance.',
    spotlightSelector: '[data-tutorial="upload-new-set"]',
    tooltipPosition: 'above',
    requiredPath: '/prospects/sumith-chittimalla',
  },
  {
    headline: 'Your uploaded digitals',
    body: 'Once uploaded, the four digitals appear in a clean 2x2 grid — front, profile, 3/4, full body. These are the images the alignment analysis reads from. Higher quality digitals in consistent neutral lighting produce more accurate results.',
    spotlightSelector: '[data-tutorial="digital-grid"]',
    tooltipPosition: 'right',
    requiredPath: '/prospects/sumith-chittimalla',
  },
];

interface TutorialOverlayProps {
  onClose: () => void;
  steps?: TutorialStep[];
}

export function TutorialOverlay({
  onClose,
  steps: stepsProp,
}: TutorialOverlayProps) {
  const tutorialSteps = stepsProp || defaultTutorialSteps;
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

  const getPositionedTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect) return {};

    const padding = 24;

    switch (step.tooltipPosition) {
      case 'right':
        return {
          top: `${spotlightRect.top + spotlightRect.height / 2}px`,
          left: `${spotlightRect.left + spotlightRect.width + padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'below':
        return {
          top: `${spotlightRect.top + spotlightRect.height + padding}px`,
          left: `${spotlightRect.left}px`,
        };
      case 'below-center':
        return {
          top: `${spotlightRect.top + spotlightRect.height + padding}px`,
          left: `${spotlightRect.left + spotlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${spotlightRect.top + spotlightRect.height / 2}px`,
          left: `${spotlightRect.left - 340 - padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'above':
        return {
          top: `${spotlightRect.top - padding}px`,
          left: `${spotlightRect.left + spotlightRect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        };
      default:
        return {};
    }
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect) {
      return { zIndex: TOOLTIP_Z_INDEX };
    }

    const anchorX = getTooltipAnchorX(spotlightRect, step.tooltipPosition);
    if (isTooltipOffscreen(anchorX)) {
      return { ...BOTTOM_CENTER_TOOLTIP, zIndex: TOOLTIP_Z_INDEX };
    }

    return { ...getPositionedTooltipStyle(), zIndex: TOOLTIP_Z_INDEX };
  };

  const overlay = (
    <div 
      className="fixed inset-0 transition-opacity duration-300"
      style={{ 
        zIndex: BACKDROP_Z_INDEX,
        opacity: isVisible ? 1 : 0,
        cursor: 'default',
        pointerEvents: isVisible ? 'auto' : 'none',
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
          zIndex: TOOLTIP_Z_INDEX,
        }}
      >
        <X size={14} />
        SKIP TUTORIAL
      </button>

      {spotlightRect && (
        <>
          {/* Spotlight with dimming backdrop (box-shadow spread) */}
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
              zIndex: BACKDROP_Z_INDEX,
            }}
          />

          {/* Tooltip card */}
          <div
            className="fixed bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] transition-opacity duration-200"
            style={{
              ...getTooltipStyle(),
              maxWidth: isTooltipOffscreen(getTooltipAnchorX(spotlightRect, step.tooltipPosition))
                ? '480px'
                : '340px',
              opacity: tooltipVisible ? 1 : 0,
              pointerEvents: tooltipVisible ? 'auto' : 'none',
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

  return createPortal(overlay, document.body);
}