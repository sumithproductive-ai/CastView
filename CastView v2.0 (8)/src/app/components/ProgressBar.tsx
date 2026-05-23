import React from 'react';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router';

const evaluationPaths = [
  '/profile', '/rendering', '/results', '/share'
];

const stepLabel: Record<string, string> = {
  '/profile':   'Selecting contexts',
  '/rendering': 'Evaluating',
  '/results':   'Results ready',
  '/share':     'Sharing'
};

export function ProgressBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isEvaluationFlow = evaluationPaths
    .some(path => location.pathname === path);

  if (!isEvaluationFlow) return null;

  const currentLabel = stepLabel[location.pathname] 
    || 'Evaluation in progress';

  return (
    <>
      <div
        className="fixed top-[12px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-[10px] px-[16px] py-[8px] bg-[#111111] border border-[#2a2a2a] rounded-full cursor-pointer hover:border-[#3a3a3a] transition-colors"
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
              backgroundColor: '#f0f0ec',
              animation: 'ping 1.5s ease-in-out infinite'
            }} 
          />
          <div 
            className="w-[6px] h-[6px] rounded-full"
            style={{ backgroundColor: '#f0f0ec' }} 
          />
        </div>

        {/* Label */}
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '11px', 
          color: '#f0f0ec',
          letterSpacing: '0.05em'
        }}>
          Sumith Chittimalla — {currentLabel}
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
                    ? '#f0f0ec' : '#333330'
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
