Rewrite the overlay rendering in TutorialOverlay.tsx to 
use four surrounding strips instead of a single full-screen 
dark div. This creates a true transparent cutout so the 
highlighted element is fully visible and unobscured.

REMOVE the existing outer div that sets 
backgroundColor: 'rgba(8, 8, 8, 0.92)' as a full-screen 
background. Replace the entire return statement with this:

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
      className="fixed top-[24px] right-[24px] flex items-center 
      gap-[8px] px-[16px] py-[10px] transition-opacity hover:opacity-60"
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
        {/* TOP strip */}
        <div
          className="fixed left-0 right-0 top-0 transition-all 
          duration-[400ms] ease-in-out"
          style={{
            height: `${spotlightRect.top - 6}px`,
            backgroundColor: 'rgba(8, 8, 8, 0.88)',
            zIndex: 101
          }}
        />

        {/* BOTTOM strip */}
        <div
          className="fixed left-0 right-0 transition-all 
          duration-[400ms] ease-in-out"
          style={{
            top: `${spotlightRect.top + spotlightRect.height + 6}px`,
            bottom: 0,
            backgroundColor: 'rgba(8, 8, 8, 0.88)',
            zIndex: 101
          }}
        />

        {/* LEFT strip */}
        <div
          className="fixed top-0 bottom-0 left-0 transition-all 
          duration-[400ms] ease-in-out"
          style={{
            width: `${spotlightRect.left - 6}px`,
            top: `${spotlightRect.top - 6}px`,
            height: `${spotlightRect.height + 12}px`,
            backgroundColor: 'rgba(8, 8, 8, 0.88)',
            zIndex: 101
          }}
        />

        {/* RIGHT strip */}
        <div
          className="fixed top-0 bottom-0 right-0 transition-all 
          duration-[400ms] ease-in-out"
          style={{
            left: `${spotlightRect.left + spotlightRect.width + 6}px`,
            top: `${spotlightRect.top - 6}px`,
            height: `${spotlightRect.height + 12}px`,
            backgroundColor: 'rgba(8, 8, 8, 0.88)',
            zIndex: 101
          }}
        />

        {/* Spotlight border ring */}
        <div
          className="absolute transition-all duration-[400ms] ease-in-out"
          style={{
            top: `${spotlightRect.top - 6}px`,
            left: `${spotlightRect.left - 6}px`,
            width: `${spotlightRect.width + 12}px`,
            height: `${spotlightRect.height + 12}px`,
            border: '2px solid rgba(240, 240, 236, 0.9)',
            borderRadius: '6px',
            boxShadow: '0 0 24px rgba(240, 240, 236, 0.12)',
            pointerEvents: 'none',
            zIndex: 102
          }}
        />

        {/* Tooltip card */}
        <div
          className="absolute bg-[#111111] border border-[#2a2a2a] 
          rounded-[4px] p-[24px] transition-opacity duration-200"
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
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              color: '#f0f0ec'
            }}
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
              className="px-[16px] py-[10px] border rounded-[4px] 
              text-[11px] uppercase tracking-[0.1em] transition-colors"
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
              className="flex-1 px-[16px] py-[10px] rounded-[4px] 
              text-[11px] uppercase tracking-[0.1em] 
              transition-opacity hover:opacity-80"
              style={{
                fontFamily: