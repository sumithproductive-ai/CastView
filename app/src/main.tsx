import React from 'react';

  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { AuthProvider } from './app/context/AuthContext';
  import { ProspectsProvider } from './app/context/ProspectsContext';
  import { RosterProvider } from './app/context/RosterContext';
  import { TutorialProvider } from './app/context/TutorialContext';
  import { ThemeProvider, initThemeFromStorage } from './app/context/ThemeContext';
  import { attachCastviewDebug } from './lib/supabaseDebug';
  import "./styles/index.css";

  initThemeFromStorage();

  if (import.meta.env.DEV) {
    attachCastviewDebug();
  }

  createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
      <AuthProvider>
        <ProspectsProvider>
          <RosterProvider>
            <TutorialProvider>
              <App />
            </TutorialProvider>
          </RosterProvider>
        </ProspectsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
  