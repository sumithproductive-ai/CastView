import React from 'react';

  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { AuthProvider } from './app/context/AuthContext';
  import { ProspectsProvider } from './app/context/ProspectsContext';
  import { RosterProvider } from './app/context/RosterContext';
  import { TutorialProvider } from './app/context/TutorialContext';
  import { attachCastviewDebug } from './lib/supabaseDebug';
  import "./styles/index.css";

  attachCastviewDebug();

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <ProspectsProvider>
        <RosterProvider>
          <TutorialProvider>
            <App />
          </TutorialProvider>
        </RosterProvider>
      </ProspectsProvider>
    </AuthProvider>
  );
  