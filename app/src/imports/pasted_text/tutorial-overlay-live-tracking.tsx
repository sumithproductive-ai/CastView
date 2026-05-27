import React from 'react';
Replace the entire spotlight tracking system in 
TutorialOverlay.tsx with a live tracking approach using 
scroll listeners, ResizeObserver, and requestAnimationFrame. 
This makes the spotlight and tooltip follow the target 
element at all times — on scroll, on resize, on any 
layout change — without needing manual adjustments.

STEP 1 — Update imports at the top of the file:

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { X } from 'lucide-react';

STEP 2 — Replace the two useEffects that handle spotlight 
tracking (the one with updateSpotlight, and any scroll 
listener useEffect added previously) with this single 
unified system. Place this after the existing state 
declarations and before handleNext:

// Ref to hold the RAF id so we can cancel on cleanup
const rafRef = useRef<number | null>(null);

// Core measure function — reads live getBoundingClientRect
const measureElement = useCallback(() => {
  if (step.spotlightPosition) {
    setSpotlightRect(step.spotlightPosition);
    return;
  }
  if (!step.spotlightSelector) {
    setSpotlightRect({
      top: window.innerHeight / 2 - 160,
      left: window.innerWidth / 2 - 240,
      width: 480,
      height: 320
    });
    return;
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
  } else {
    setSpotlightRect({
      top: window.innerHeight / 2 - 160,
      left: window.innerWidth / 2 - 240,
      width: 480,
      height: 320
    });
  }
}, [step]);

// On step change: hide tooltip, wait for nav+render, 
// then measure and show tooltip
useEffect(() => {
  setTooltipVisible(false);
  const timer = setTimeout(() => {
    measureElement();
    setTimeout(() => setTooltipVisible(true), 400);
  }, 300);
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

STEP 3 — Fix the black line artifact on the LEFT and 
RIGHT strips. The bug is that these divs have both 
bottom-0 in their className AND a height in their 
inline style — they conflict. 

Find the LEFT strip div:
className="fixed top-0 bottom-0 left-0 transition-all 
duration-[400ms] ease-in-out"

Replace className with:
className="fixed left-0 transition-all duration-[400ms] ease-in-out"

Find the RIGHT strip div:
className="fixed top-0 bottom-0 right-0 transition-all 
duration-[400ms] ease-in-out"

Replace className with:
className="fixed transition-all duration-[400ms] ease-in-out"

The inline style on both already sets top and height 
explicitly — removing top-0/bottom-0 from className 
eliminates the conflict that causes the black line.

STEP 4 — Remove the old isOnCorrectPage-based 
useEffect dependency. The new system above replaces 
the old useEffect([currentStep, isOnCorrectPage, step]) 
entirely. Delete any remaining useEffect that still 
references isOnCorrectPage in its dependency array 
if one exists after applying the above.

Do not change handleNext, handleBack, handleClose, 
getTooltipStyle, the return statement, or any other 
files.