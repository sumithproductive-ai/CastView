import { useNavigate } from 'react-router';
import { UserPlus, Compass } from 'lucide-react';

export function OnboardingFirstProspect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-[24px]">
      <div style={{ maxWidth: '720px', width: '100%' }}>
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-[48px]">
          {/* Step 1 - Complete */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: '#2a2a2a' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                1
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
            >
              Agency
            </span>
          </div>

          {/* Connecting Line */}
          <div 
            className="w-[80px] h-[1px] mx-[16px] mb-[24px]"
            style={{ backgroundColor: '#2a2a2a' }}
          />

          {/* Step 2 - Complete */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: '#2a2a2a' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                2
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
            >
              Team
            </span>
          </div>

          {/* Connecting Line */}
          <div 
            className="w-[80px] h-[1px] mx-[16px] mb-[24px]"
            style={{ backgroundColor: '#2a2a2a' }}
          />

          {/* Step 3 - Active */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: '#f0f0ec' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: '#080808', fontWeight: 500 }}
              >
                3
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#f0f0ec' }}
            >
              First Prospect
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 
          className="text-[48px] mb-[12px] text-center" 
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
        >
          Add your first prospect.
        </h1>

        {/* Subtitle */}
        <p 
          className="text-[13px] mb-[48px] text-center"
          style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
        >
          Choose how you'd like to get started.
        </p>

        {/* Two Cards Side by Side */}
        <div className="grid grid-cols-2 gap-[24px] mb-[24px]">
          {/* Left Card - Add Prospect */}
          <div 
            className="rounded-[4px] p-[32px] flex flex-col items-center text-center"
            style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}
          >
            {/* Label */}
            <div 
              className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              ADD A PROSPECT
            </div>

            {/* Icon */}
            <div className="mb-[24px]">
              <UserPlus size={32} style={{ color: '#a0a09a' }} />
            </div>

            {/* Description */}
            <p 
              className="text-[13px] mb-[32px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a', lineHeight: 1.6 }}
            >
              Upload digitals and run your first AI evaluation.
            </p>

            {/* Button */}
            <button
              onClick={() => navigate('/prospects/new')}
              className="w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 cursor-pointer"
              style={{ 
                fontFamily: 'var(--font-label)',
                backgroundColor: '#f0f0ec',
                color: '#080808'
              }}
            >
              ADD FIRST PROSPECT →
            </button>
          </div>

          {/* Right Card - Explore App */}
          <div 
            className="rounded-[4px] p-[32px] flex flex-col items-center text-center"
            style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}
          >
            {/* Label */}
            <div 
              className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              EXPLORE THE APP
            </div>

            {/* Icon */}
            <div className="mb-[24px]">
              <Compass size={32} style={{ color: '#a0a09a' }} />
            </div>

            {/* Description */}
            <p 
              className="text-[13px] mb-[32px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a', lineHeight: 1.6 }}
            >
              Browse the demo data to see how CastView works.
            </p>

            {/* Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full py-[14px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#1a1a1a] cursor-pointer"
              style={{ 
                fontFamily: 'var(--font-label)',
                borderColor: '#2a2a2a',
                color: '#f0f0ec'
              }}
            >
              GO TO DASHBOARD →
            </button>
          </div>
        </div>

        {/* Skip Link */}
        <div className="mb-[12px]">
          <button
            onClick={() => navigate('/')}
            className="text-[11px] uppercase tracking-[0.05em] hover:opacity-70 transition-opacity"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '12px', 
              color: '#888880',
              display: 'block',
              textAlign: 'center', 
              cursor: 'pointer',
              marginTop: '24px',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              width: '100%',
              background: 'none',
              border: 'none'
            }}
          >
            Skip setup — I'll do this later
          </button>

          {/* Skip Helper Text */}
          <p 
            className="text-center mt-[8px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '10px', 
              color: '#555550',
              fontStyle: 'italic'
            }}
          >
            You can complete agency setup anytime in Settings.
          </p>
        </div>

        {/* Bottom Note */}
        <p 
          className="text-[12px] text-center"
          style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
        >
          You can always add prospects later from the Prospects section.
        </p>
      </div>
    </div>
  );
}