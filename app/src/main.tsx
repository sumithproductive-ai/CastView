import React from 'react';

  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { AuthProvider } from './app/context/AuthContext';
  import { attachCastviewDebug } from './lib/supabaseDebug';
  import "./styles/index.css";

  attachCastviewDebug();

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  