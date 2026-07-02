import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus, Compass } from 'lucide-react';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import { useAuth } from '../context/AuthContext';
import { needsOnboarding, skipOnboarding } from '../../lib/onboarding';

export function OnboardingFirstProspect() {
  const navigate = useNavigate();
  const { agencyId, agencyName, setAgencyName } = useAuth();
  const { prospects } = useProspects();
  const { models } = useRoster();

  useEffect(() => {
    if (!needsOnboarding(agencyName, prospects.length, models.length)) {
      navigate('/', { replace: true });
    }
  }, [agencyName, prospects.length, models.length, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-[24px]">
      <div style={{ maxWidth: '720px', width: '100%' }}>
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-[48px]">
          {/* Step 1 - Complete */}
          <div className="flex flex-col items-center">
            <div
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: 'transparent', border: '1px solid var(--cv-subtle-border)' }}
            >
              <span className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}>✓</span>
            </div>
            <span className="text-[11px] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}>
              Agency
            </span>
          </div>

          <div className="w-[80px] h-[1px] mx-[16px] mb-[24px]" style={{ backgroundColor: 'var(--cv-subtle-border)' }} />

          {/* Step 2 - Active */}
          <div className="flex flex-col items-center">
            <div
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: 'var(--cv-primary-text)' }}
            >
              <span className="text-[13px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-background)', fontWeight: 500 }}>2</span>
            </div>
            <span className="text-[11px] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-primary-text)' }}>
              First Prospect
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 
          className="text-[48px] mb-[12px] text-center" 
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
        >
          Add your first prospect.
        </h1>

        {/* Subtitle */}
        <p 
          className="text-[13px] mb-[48px] text-center"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
        >
          Choose how you'd like to get started.
        </p>

        {/* Two Cards Side by Side */}
        <div className="grid grid-cols-2 gap-[24px] mb-[24px]">
          {/* Left Card - Add Prospect */}
          <div 
            className="rounded-[4px] p-[32px] flex flex-col items-center text-center"
            style={{ backgroundColor: 'var(--cv-surface)', border: '1px solid var(--cv-subtle-border)' }}
          >
            {/* Label */}
            <div 
              className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              ADD A PROSPECT
            </div>

            {/* Icon */}
            <div className="mb-[24px]">
              <UserPlus size={32} style={{ color: 'var(--cv-secondary-text)' }} />
            </div>

            {/* Description */}
            <p 
              className="text-[13px] mb-[32px]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)', lineHeight: 1.6 }}
            >
              Upload digitals and run your first AI evaluation.
            </p>

            {/* Button */}
            <button
              onClick={() => navigate('/prospects/new')}
              className="w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 cursor-pointer"
              style={{ 
                fontFamily: 'var(--font-label)',
                backgroundColor: 'var(--cv-primary-text)',
                color: 'var(--cv-background)'
              }}
            >
              ADD FIRST PROSPECT →
            </button>
          </div>

          {/* Right Card - Explore App */}
          <div 
            className="rounded-[4px] p-[32px] flex flex-col items-center text-center"
            style={{ backgroundColor: 'var(--cv-surface)', border: '1px solid var(--cv-subtle-border)' }}
          >
            {/* Label */}
            <div 
              className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              EXPLORE THE APP
            </div>

            {/* Icon */}
            <div className="mb-[24px]">
              <Compass size={32} style={{ color: 'var(--cv-secondary-text)' }} />
            </div>

            {/* Description */}
            <p 
              className="text-[13px] mb-[32px]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)', lineHeight: 1.6 }}
            >
              Browse the demo data to see how CastView works.
            </p>

            {/* Button */}
            <button
              onClick={() => void skipOnboarding(navigate, agencyId, agencyName, setAgencyName)}
              className="w-full py-[14px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[var(--cv-elevated)] cursor-pointer"
              style={{ 
                fontFamily: 'var(--font-label)',
                borderColor: 'var(--cv-subtle-border)',
                color: 'var(--cv-primary-text)'
              }}
            >
              GO TO DASHBOARD →
            </button>
          </div>
        </div>

        {/* Skip Link */}
        <div className="mb-[12px]">
          <button
            onClick={() => void skipOnboarding(navigate, agencyId, agencyName, setAgencyName)}
            className="text-[11px] uppercase tracking-[0.05em] hover:opacity-70 transition-opacity"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '12px', 
              color: 'var(--cv-secondary-text)',
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
              color: 'var(--cv-secondary-text)',
              fontStyle: 'italic'
            }}
          >
            You can complete agency setup anytime in Settings.
          </p>
        </div>

        {/* Bottom Note */}
        <p 
          className="text-[12px] text-center"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
        >
          You can always add prospects later from the Prospects section.
        </p>
      </div>
    </div>
  );
}