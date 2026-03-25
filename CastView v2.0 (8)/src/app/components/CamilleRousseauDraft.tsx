import { useNavigate } from 'react-router';
import { Upload, Check, Lock } from 'lucide-react';

export function CamilleRousseauDraft() {
  const navigate = useNavigate();

  const uploadZones = [
    { key: 'front', label: 'FRONT', uploaded: null },
    { key: 'profile', label: 'PROFILE', uploaded: null },
    { key: 'three_quarter', label: '3/4', uploaded: null },
    { key: 'full_body', label: 'FULL BODY', uploaded: null }
  ];

  return (
    <div className="p-[48px]">
      {/* Page Title */}
      <h1 
        className="text-[48px] mb-[16px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        Complete Profile — Camille Rousseau
      </h1>

      {/* Contextual Notice Bar */}
      <div 
        className="flex items-center gap-[12px] px-[12px] py-[12px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] mb-[32px]"
      >
        <div 
          className="w-[8px] h-[8px] rounded-full"
          style={{ backgroundColor: '#c4a05d' }}
        />
        <div 
          className="text-[13px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
        >
          This prospect was saved as a draft. Pick up where you left off — upload her digitals to continue.
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-[16px] mb-[48px]">
        {/* Step 1 - Completed */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: '#f0f0ec',
              color: '#080808'
            }}
          >
            <Check size={16} />
          </div>
          <span 
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
          >
            Basic Info
          </span>
        </div>

        {/* Connector Line */}
        <div className="w-[40px] h-[1px] bg-[#2a2a2a]" />

        {/* Step 2 - Active */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              backgroundColor: '#f0f0ec',
              color: '#080808'
            }}
          >
            2
          </div>
          <span 
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
          >
            Digitals
          </span>
        </div>

        {/* Connector Line */}
        <div className="w-[40px] h-[1px] bg-[#2a2a2a]" />

        {/* Step 3 - Inactive */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full border flex items-center justify-center text-[13px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              borderColor: '#2a2a2a',
              color: '#6a6a64'
            }}
          >
            3
          </div>
          <span 
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
          >
            Review
          </span>
        </div>
      </div>

      {/* Section Header */}
      <div className="mb-[24px]">
        <div 
          className="text-[9px] uppercase tracking-[0.1em] mb-[8px]"
          style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
        >
          UPLOAD DIGITALS
        </div>
        <div 
          className="text-[12px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
        >
          All four shots are required. Clear, natural light, no filters.
        </div>
      </div>

      {/* Upload Grid - All Empty */}
      <div 
        className="grid grid-cols-4 gap-[16px] mb-[16px]" 
        style={{ maxWidth: '640px' }}>
        {uploadZones.map((zone) => (
          <div 
            key={zone.key}
            className="relative bg-[#0d0d0d] border border-dashed rounded-[4px] cursor-pointer hover:border-[#3a3a3a] transition-colors"
            style={{ borderColor: '#2a2a2a', height: '140px' }}
          >
            {/* Empty Upload Zone */}
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Upload size={32} style={{ color: '#6a6a64', marginBottom: '16px' }} />
              <div 
                className="text-[9px] uppercase tracking-[0.1em] mb-[8px]"
                style={{ fontFamily: 'var(--font-label)', color: '#f0f0ec' }}
              >
                {zone.label}
              </div>
              <div 
                className="text-[11px] text-center"
                style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
              >
                (click or drag to upload)
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Requirements Note */}
      <div 
        className="text-[12px] mb-[8px]"
        style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
      >
        JPG or PNG · Max 10MB per image · Minimum 800px on shortest side
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center gap-[8px] pt-[12px] mb-[32px]">
        <Lock size={12} style={{ color: '#888880' }} />
        <div 
          className="text-[11px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
        >
          Photos stored securely in EU-West (Ireland) · Never used for model training · Deletable anytime
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-[12px] items-center">
        <button
          onClick={() => navigate('/prospects')}
          className="px-[20px] py-[12px] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#1a1a1a]"
          style={{ 
            fontFamily: 'var(--font-mono)', 
            color: '#a0a09a'
          }}
        >
          BACK
        </button>
        <div className="flex-1 flex flex-col items-end">
          <button
            onClick={() => navigate('/prospects/new/review')}
            className="px-[20px] py-[12px] bg-[#f0f0ec] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              color: '#080808'
            }}
          >
            CONTINUE TO REVIEW →
          </button>
          <div 
            className="text-[12px] mt-[8px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
          >
            You can complete missing digitals later.
          </div>
        </div>
      </div>
    </div>
  );
}