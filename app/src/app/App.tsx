import React from 'react';
import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SplashScreen } from "./components/SplashScreen";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      {isLoading && (
        <SplashScreen onComplete={() => setIsLoading(false)} />
      )}
    </>
  );
}