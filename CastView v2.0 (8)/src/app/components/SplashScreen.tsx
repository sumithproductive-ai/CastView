import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fade out after 2.1 seconds (2.5s total - 0.4s fade)
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2100);

    // Call onComplete after full 2.5 seconds
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <>
      <style>{`
        @keyframes progress-fill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
      <div
        style={{
          backgroundColor: '#080808',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          opacity: isFading ? 0 : 1,
          transition: 'opacity 400ms ease-out'
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 300,
            color: '#f0f0ec',
            letterSpacing: '0.06em'
          }}
        >
          CastView
        </div>

        {/* Loading Indicator */}
        <div
          style={{
            width: '80px',
            height: '1px',
            backgroundColor: '#2a2a2a',
            marginTop: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '1px',
              backgroundColor: '#f0f0ec',
              animation: 'progress-fill 1.8s ease-in-out infinite'
            }}
          />
        </div>
      </div>
    </>
  );
}