Fix TutorialOverlay.tsx so the spotlight and tooltip stay 
locked to their target element when the user scrolls.

TWO CHANGES:

CHANGE 1 — Add a scroll listener that recalculates the 
spotlight position whenever the user scrolls.

Inside the component, extract the spotlight calculation 
into a reusable function so both the step useEffect and 
the scroll listener can call it. 

Find the useEffect that runs on currentStep change. 
Inside it there is a local function called updateSpotlight. 
Pull that function out to be a useCallback at the 
component level, defined before the useEffect:

const updateSpotlight = useCallback(() => {
  if (step.spotlightPosition) {
    setSpotlightRect(step.spotlightPosition);
    setTimeout(() => setTooltipVisible(true), 400);
  } else if (step.spotlightSelector) {
    const element = document.querySelector(step.spotlightSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setSpotlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      setTimeout(() => setTooltipVisible(true), 400);
    } else {
      setSpotlightRect({
        top: window.innerHeight / 2 - 160,
        left: window.innerWidth / 2 - 240,
        width: 480,
        height: 320
      });
      setTimeout(() => setTooltipVisible(true), 400);
    }
  } else {
    setSpotlightRect({
      top: window.innerHeight / 2 - 160,
      left: window.innerWidth / 2 - 240,
      width: 480,
      height: 320
    });
    setTimeout(() => setTooltipVisible(true), 400);
  }
}, [step]);

Add useCallback to the imports from react:
import { useState, useEffect, useCallback } from 'react';

Update the existing step useEffect to call this function:

useEffect(() => {
  setTooltipVisible(false);
  setTimeout(updateSpotlight, 300);
}, [currentStep, updateSpotlight]);

Then add a second useEffect for the scroll listener:

useEffect(() => {
  const handleScroll = () => {
    if (step.spotlightSelector) {
      const element = document.querySelector(step.spotlightSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setSpotlightRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, [step]);

---

CHANGE 2 — Fix positioning on the spotlight border ring 
and tooltip card so they use fixed instead of absolute.

Find the spotlight border ring div. Change:
className="absolute transition-all duration-[400ms] ease-in-out"

To:
className="fixed transition-all duration-[400ms] ease-in-out"

Find the tooltip card div. Change:
className="absolute bg-[#111111] border border-[#2a2a2a] 
rounded-[4px] p-[24px] transition-opacity duration-200"

To:
className="fixed bg-[#111111] border border-[#2a2a2a] 
rounded-[4px] p-[24px] transition-opacity duration-200"

The four strip divs (TOP, BOTTOM, LEFT, RIGHT) are already 
fixed — do not change those.

No other changes to this file. Do not change any other files.