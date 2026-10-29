import React from 'react';
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { TutorialStep } from '../components/TutorialOverlay';

interface TutorialContextType {
  isTutorialOpen: boolean;
  /** Steps for the open tutorial; undefined means the main product tour. */
  tutorialSteps: TutorialStep[] | undefined;
  openTutorial: (steps?: TutorialStep[]) => void;
  closeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType>({
  isTutorialOpen: false,
  tutorialSteps: undefined,
  openTutorial: () => {},
  closeTutorial: () => {},
});

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[] | undefined>(undefined);
  // Rendered by Layout (not the page that opens it) so multi-page tours
  // survive route changes.
  return (
    <TutorialContext.Provider value={{
      isTutorialOpen,
      tutorialSteps,
      openTutorial: (steps?: TutorialStep[]) => {
        setTutorialSteps(steps);
        setIsTutorialOpen(true);
      },
      closeTutorial: () => setIsTutorialOpen(false),
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}
