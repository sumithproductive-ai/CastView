import React from 'react';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router';

const evaluationPaths = [
  '/profile', '/rendering', '/results',
];

const stepLabel: Record<string, string> = {
  '/profile':   'Selecting contexts',
  '/rendering': 'Evaluating',
  '/results':   'Results ready',
};

export function ProgressBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isEvaluationFlow = evaluationPaths
    .some(path => location.pathname === path);

  if (!isEvaluationFlow) return null;
  if (location.pathname === '/results') return null;

  const currentLabel = stepLabel[location.pathname] 
    || 'Evaluation in progress';

  return (
    <>
      <div
        className="fixed top-[12px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-[10px] px-[16px] py-[8px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-full cursor-pointer hover:border-[var(--cv-elevated)] transition-colors"
        onClick={() => navigate(location.pathname)}
        style={{ 
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)' 
        }}
      >
        {/* Pulse dot */}
        <div className="relative flex items-center justify-center w-[8px] h-[8px]">
          <div 
            className="absolute w-[8px] h-[8px] rounded-full opacity-40"
            style={{ 
              backgroundColor: 'var(--cv-primary-text)',
              animation: 'ping 1.5s ease-in-out infinite'
            }} 
          />
          <div 
            className="w-[6px] h-[6px] rounded-full"
            style={{ backgroundColor: 'var(--cv-primary-text)' }} 
          />
        </div>

        {/* Label */}
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '11px', 
          color: 'var(--cv-primary-text)',
          letterSpacing: '0.05em'
        }}>
          {currentLabel}
        </span>

        {/* Step indicators */}
        <div className="flex items-center gap-[4px] ml-[4px]">
          {evaluationPaths.map((path) => (
            <div 
              key={path}
              className="rounded-full"
              style={{ 
                width: '4px', 
                height: '4px',
                backgroundColor: 
                  location.pathname === path 
                    ? 'var(--cv-primary-text)' : 'var(--cv-subtle-border)'
              }} 
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </>
  );
}
