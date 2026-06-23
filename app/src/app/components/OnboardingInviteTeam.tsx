import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import { useAuth } from '../context/AuthContext';
import { needsOnboarding, skipOnboarding } from '../../lib/onboarding';

export function OnboardingInviteTeam() {
  const navigate = useNavigate();
  const { agencyId, agencyName, setAgencyName } = useAuth();
  const { prospects } = useProspects();
  const { models } = useRoster();

  useEffect(() => {
    if (!needsOnboarding(agencyName, prospects.length, models.length)) {
      navigate('/', { replace: true });
    }
  }, [agencyName, prospects.length, models.length, navigate]);

  const handleContinue = () => {
    navigate('/onboarding/first-prospect');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-[24px]">
      <div style={{ maxWidth: '560px', width: '100%' }}>
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-[48px]">
          {/* Step 1 - Complete */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: 'var(--cv-subtle-border)' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
              >
                1
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              Agency
            </span>
          </div>

          {/* Connecting Line */}
          <div 
            className="w-[80px] h-[1px] mx-[16px] mb-[24px]"
            style={{ backgroundColor: 'var(--cv-subtle-border)' }}
          />

          {/* Step 2 - Active */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: 'var(--cv-primary-text)' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-background)', fontWeight: 500 }}
              >
                2
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-primary-text)' }}
            >
              Team
            </span>
          </div>

          {/* Connecting Line */}
          <div 
            className="w-[80px] h-[1px] mx-[16px] mb-[24px]"
            style={{ backgroundColor: 'var(--cv-subtle-border)' }}
          />

          {/* Step 3 - Inactive */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: 'var(--cv-elevated)', border: '1px solid var(--cv-subtle-border)' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
              >
                3
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              First Prospect
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 
          className="text-[48px] mb-[12px] text-center" 
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
        >
          Invite your team.
        </h1>

        {/* Subtitle */}
        <p 
          className="text-[13px] mb-[48px] text-center"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
        >
          Team invites are coming soon. For now, continue solo — you can invite colleagues from Settings later.
        </p>

        {/* Form Card */}
        <div 
          className="rounded-[4px] p-[32px]"
          style={{ backgroundColor: 'var(--cv-surface)', border: '1px solid var(--cv-subtle-border)' }}
        >
          {/* Team invites coming soon */}
          <p
            className="mb-[24px] text-[12px] leading-relaxed"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            Multi-seat team access is on the way. You can manage billing and seats from Settings when invites launch.
          </p>

          <button
            onClick={handleContinue}
            className="w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 cursor-pointer"
            style={{ 
              fontFamily: 'var(--font-label)',
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)'
            }}
          >
            CONTINUE →
          </button>

          {/* Skip Link */}
          <button
            onClick={() => void skipOnboarding(navigate, agencyId, agencyName, setAgencyName)}
            className="text-[11px] uppercase tracking-[0.05em] hover:opacity-70 transition-opacity mt-[16px]"
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
      </div>
    </div>
  );
}