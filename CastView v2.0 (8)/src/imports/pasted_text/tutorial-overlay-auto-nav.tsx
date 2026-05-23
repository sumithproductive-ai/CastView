import React from 'react';
Fix TutorialOverlay.tsx so it navigates the app automatically 
as the user clicks through steps, instead of asking the user 
to navigate themselves.

THE CORE PROBLEM:
The overlay has requiredPath on each step but never calls 
navigate(). It falls back to a centered placeholder rectangle 
on every step that needs a different page, making the entire 
tutorial non-functional as a guided tour.

---

CHANGES TO TutorialOverlay.tsx:

1. Add useNavigate to imports:
import { useNavigate, useLocation } from 'react-router';

2. Inside the component, add:
const navigate = useNavigate();

3. Replace the handleNext function with this:

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

4. Replace the handleBack function with this:

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

5. In the useEffect that runs on currentStep change, increase 
the DOM settle delay from 100ms to 300ms so elements have 
time to render after navigation:

// Change this line:
setTimeout(updateSpotlight, 100);
// To:
setTimeout(updateSpotlight, 300);

6. Remove the navigation hint paragraph entirely — the 
overlay now handles navigation so the user never needs 
to do it themselves. Delete this block:

{!isOnCorrectPage && step.requiredPath && (
  <p 
    className="mb-[24px] italic"
    style={{ ... }}
  >
    Navigate to ...
  </p>
)}

And remove the {isOnCorrectPage && <div className="mb-[24px]" />} 
spacer below it. Replace both with a single unconditional:
<div className="mb-[24px]" />

7. Also handle the case where the tutorial is opened from 
Settings (which is not Step 1's required page). Add this 
useEffect that runs once on mount:

useEffect(() => {
  const firstStep = tutorialSteps[0];
  if (firstStep.requiredPath && 
      location.pathname !== firstStep.requiredPath) {
    navigate(firstStep.requiredPath);
  }
}, []); 
// Empty dependency array — runs once on mount only

---

ALSO ADD data-tutorial attributes to the target elements
so the spotlight selector querySelector calls actually find 
something. The selectors are already defined in tutorialSteps 
but the attributes were never added to the components.

Add these attributes to the following files:

Dashboard.tsx — find the stats card row div and add:
data-tutorial="stats-row"

ProspectsIndex.tsx — find the ADD PROSPECT button and add:
data-tutorial="add-prospect-button"

NewProspectBasicInfo.tsx — find the form card div 
(the bg-[#111111] border card wrapping the form) and add:
data-tutorial="basic-info-form"

ProspectConsent.tsx — find the checkbox row div and add:
data-tutorial="consent-content"

NewProspectDigitals.tsx — find the upload area div and add:
data-tutorial="upload-area"

Profile.tsx — find the context selection grid div and add:
data-tutorial="context-grid"

Results.tsx — find the WHY THIS SCORE panel div and add:
data-tutorial="score-panel"

Share.tsx — find the share link panel div and add:
data-tutorial="share-panel"

---

Do not change TutorialContext.tsx, App.tsx, routes.tsx, 
Settings.tsx, or any other files. Only TutorialOverlay.tsx 
and the 8 component files listed above.