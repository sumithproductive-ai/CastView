import React from 'react';
import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SplashScreen } from "./components/SplashScreen";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [splashMounted, setSplashMounted] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setSplashVisible(false);
      const removeTimer = setTimeout(() => setSplashMounted(false), 300);
      return () => clearTimeout(removeTimer);
    }
  }, [isLoading]);

  return (
    <>
      <RouterProvider router={router} />
      {splashMounted && (
        <div
          style={{
            opacity: splashVisible ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <SplashScreen onComplete={() => setIsLoading(false)} />
        </div>
      )}
    </>
  );
}