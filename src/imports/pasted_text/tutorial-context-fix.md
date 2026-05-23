Fix the LAUNCH TUTORIAL button in Settings not working.
The bug is in how isTutorialOpen state is shared between 
Layout (in routes.tsx) and Settings.tsx. The current 
approach manually spreads React element props which does 
not work — props never reach Settings.

Replace the entire pattern with a React Context.

---

STEP 1 — Create a new file: 
src/app/context/TutorialContext.tsx

File contents:

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

---

STEP 2 — Update App.tsx

Import TutorialProvider and TutorialOverlay.
Wrap the RouterProvider with TutorialProvider.
Mount TutorialOverlay at this level so it sits above 
all routes.

Replace the return statement with:

return (
  <TutorialProvider>
    <TutorialOverlayWrapper />
    <RouterProvider router={router} />
  </TutorialProvider>
);

Add a TutorialOverlayWrapper component in the same file:

function TutorialOverlayWrapper() {
  const { isTutorialOpen, closeTutorial } = useTutorial();
  if (!isTutorialOpen) return null;
  return <TutorialOverlay onClose={closeTutorial} />;
}

Add these imports at the top of App.tsx:
import { TutorialProvider } from './context/TutorialContext';
import { useTutorial } from './context/TutorialContext';
import { TutorialOverlay } from './components/TutorialOverlay';

---

STEP 3 — Update routes.tsx

Remove all tutorial-related code from routes.tsx entirely:
- Remove the TutorialOverlay import
- Remove the LayoutProps interface  
- Remove isTutorialOpen state from Layout
- Remove handleOpenTutorial and handleCloseTutorial
- Remove the childrenWithProps cloneElement logic
- Remove onOpenTutorial prop from Layout
- Remove the {isTutorialOpen && <TutorialOverlay />} line
- Remove the Settings import (if only used for tutorial)

The Layout function should return to its original simple form:

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" 
      style={{ backgroundColor: '#080808', 
               fontFamily: 'var(--font-mono)' }}>
      <ProgressBar />
      <div className="flex flex-1 items-stretch">
        <Sidebar />
        <main className="flex-1 pb-[64px] md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}

---

STEP 4 — Update Settings.tsx

Remove the onOpenTutorial prop entirely.
Instead import and use the context directly:

import { useTutorial } from '../context/TutorialContext';

Inside the Settings function, add:
const { openTutorial } = useTutorial();

Change the LAUNCH TUTORIAL button onClick from:
onClick={onOpenTutorial}

To:
onClick={openTutorial}

Remove the SettingsProps interface and the 
{ onOpenTutorial }: SettingsProps parameter.

---

Do not change TutorialOverlay.tsx or any other files.
After this fix, clicking LAUNCH TUTORIAL in Settings 
will call openTutorial() from context, set 
isTutorialOpen to true in App.tsx, and mount 
TutorialOverlay above the entire router.