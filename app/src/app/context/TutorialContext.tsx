import React from 'react';
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface TutorialContextType {
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType>({
  isTutorialOpen: false,
  openTutorial: () => {},
  closeTutorial: () => {},
});

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  return (
    <TutorialContext.Provider value={{
      isTutorialOpen,
      openTutorial: () => setIsTutorialOpen(true),
      closeTutorial: () => setIsTutorialOpen(false),
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}
