import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SplashScreen } from "./components/SplashScreen";
import { TutorialProvider } from './context/TutorialContext';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <SplashScreen onComplete={() => setIsLoading(false)} />;

  return (
    <TutorialProvider>
      <RouterProvider router={router} />
    </TutorialProvider>
  );
}