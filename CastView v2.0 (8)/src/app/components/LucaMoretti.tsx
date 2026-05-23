import { useNavigate } from 'react-router';
import { Camera } from 'lucide-react';

export function LucaMoretti() {
  const navigate = useNavigate();

  const prospectData = {
    name: 'Luca Moretti',
    status: 'NEW',
    statusColor: '#3d4d5d',
    primaryImage: 'https://images.unsplash.com/photo-1643308002103-f5323c0afa01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwZmFzaGlvbiUyMG1vZGVsJTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzczMTUzOTIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    measurements: {
      Height: '185cm',
      Bust: '96cm',
      Waist: '81cm',
      Hips: '96cm',
      Hair: 'Black',
      Eyes: 'Brown'
    },
    markets: ['MILAN']
  };

  return (
    <div className="p-[48px]">
      {/* Two Column Layout */}
      <div className="grid grid-cols-[30%_70%] gap-[48px]">
        {/* Left Column - Prospect Panel */}
        <div>
          {/* Name */}
          <h1 
            className="text-[36px] mb-[16px]" 
            style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
          >
            {prospectData.name}
          </h1>

          {/* Status Pill */}
          <div 
            className="inline-block px-[16px] py-[8px] rounded-full text-[9px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ 
              fontFamily: 'var(--font-label)', 
              backgroundColor: prospectData.statusColor + '33',
              color: prospectData.statusColor,
              border: `1px solid ${prospectData.statusColor}`
            }}
          >
            {prospectData.status}
          </div>

          {/* Primary Image */}
          <div className="aspect-[3/4] bg-[#1a1a1a] rounded-[4px] overflow-hidden mb-[24px]">
            <img 
              src={prospectData.primaryImage} 
              alt={prospectData.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 15%' }}
            />
          </div>

          {/* Measurements */}
          <div className="mb-[24px]">
            {Object.entries(prospectData.measurements).map(([key, value]) => (
              <div 
                key={key}
                className="flex justify-between py-[8px] border-b border-[#2a2a2a]"
              >
                <span 
                  className="text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  {key}
                </span>
                <span 
                  className="text-[13px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Market Tags */}
          <div className="flex flex-wrap gap-[8px] mb-[32px]">
            {prospectData.markets.map((market) => (
              <div
                key={market}
                className="px-[12px] py-[6px] border border-[#2a2a2a] rounded-full text-[9px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
              >
                {market}
              </div>
            ))}
          </div>

          {/* Agent Notes */}
          <div className="mb-[24px]">
            <label 
              className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Agent Notes
            </label>
            <textarea
              placeholder="Add agent notes..."
              className="w-full h-[100px] px-[16px] py-[12px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] resize-none"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '13px', 
                color: '#f0f0ec'
              }}
            />
          </div>

          {/* Buttons */}
          <div className="space-y-[12px]">
            <button
              onClick={() => navigate('/profile')}
              className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{ 
                fontFamily: 'var(--font-label)',
                backgroundColor: '#f0f0ec',
                color: '#080808'
              }}
            >
              RUN FIRST EVALUATION
            </button>
            <button
              className="w-full py-[12px] rounded-[4px] border border-[#2a2a2a] text-[11px] uppercase tracking-[0.1em]"
              style={{ 
                fontFamily: 'var(--font-label)',
                color: '#f0f0ec',
                opacity: 0.4,
                cursor: 'not-allowed'
              }}
            >
              SHARE PACKAGE
            </button>
            <div 
              className="text-[11px] text-center"
              style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
            >
              Available after first evaluation
            </div>
          </div>
        </div>

        {/* Right Column - Empty State */}
        <div>
          {/* Section Label */}
          <div 
            className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            Evaluation History
          </div>

          {/* Empty State */}
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[48px] text-center mb-[24px]">
            <div 
              className="text-[18px] mb-[12px]" 
              style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
            >
              No evaluations yet.
            </div>
            <div 
              className="text-[13px]" 
              style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a', lineHeight: 1.5 }}
            >
              Run an evaluation to see how Luca scores across shoot contexts.
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="mt-[24px] px-[24px] py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors"
              style={{ 
                fontFamily: 'var(--font-label)',
                backgroundColor: '#f0f0ec',
                color: '#080808'
              }}
            >
              Run First Evaluation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}