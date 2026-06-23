import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import { useAuth } from '../context/AuthContext';
import { needsOnboarding, skipOnboarding } from '../../lib/onboarding';
import { supabase } from '../../lib/supabase';
import { LocationMarketField } from './LocationMarketField';

export function OnboardingAgencySetup() {
  const navigate = useNavigate();
  const { prospects } = useProspects();
  const { models } = useRoster();
  const { agencyId, agencyName: savedAgencyName, setAgencyName: setSavedAgencyName } = useAuth();
  const [agencyName, setAgencyName] = useState('');
  const [primaryMarket, setPrimaryMarket] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const roles = ['AGENT', 'BOOKER', 'DIRECTOR'];

  useEffect(() => {
    if (!needsOnboarding(savedAgencyName, prospects.length, models.length)) {
      navigate('/', { replace: true });
    }
  }, [savedAgencyName, prospects.length, models.length, navigate]);

  useEffect(() => {
    if (!agencyId) return;
    void supabase
      .from('agencies')
      .select('primary_market')
      .eq('id', agencyId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.primary_market) {
          setPrimaryMarket(data.primary_market);
        }
      });
  }, [agencyId]);

  const handleContinue = async () => {
    const trimmedName = agencyName.trim();
    const trimmedMarket = primaryMarket.trim();
    if (agencyId && (trimmedName || trimmedMarket)) {
      await supabase
        .from('agencies')
        .update({
          ...(trimmedName ? { name: trimmedName } : {}),
          ...(trimmedMarket ? { primary_market: trimmedMarket } : {}),
        })
        .eq('id', agencyId);
      if (trimmedName) {
        setSavedAgencyName(trimmedName);
      }
    }
    navigate('/onboarding/invite');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-[24px]">
      <div style={{ maxWidth: '560px', width: '100%' }}>
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-[48px]">
          {/* Step 1 - Active */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: 'var(--cv-primary-text)' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-background)', fontWeight: 500 }}
              >
                1
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-primary-text)' }}
            >
              Agency
            </span>
          </div>

          {/* Connecting Line */}
          <div 
            className="w-[80px] h-[1px] mx-[16px] mb-[24px]"
            style={{ backgroundColor: 'var(--cv-subtle-border)' }}
          />

          {/* Step 2 - Inactive */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: 'var(--cv-elevated)', border: '1px solid var(--cv-subtle-border)' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
              >
                2
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
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
          Welcome to CastView.
        </h1>

        {/* Subtitle */}
        <p 
          className="text-[13px] mb-[48px] text-center"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
        >
          Let's set up your agency in 3 steps.
        </p>

        {/* Form Card */}
        <div 
          className="rounded-[4px] p-[32px]"
          style={{ backgroundColor: 'var(--cv-surface)', border: '1px solid var(--cv-subtle-border)' }}
        >
          {/* Agency Name Field */}
          <div className="mb-[24px]">
            <label 
              className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              AGENCY NAME
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="e.g. Meridian Models"
              className="w-full px-[16px] py-[12px] bg-[var(--cv-background)] border border-[var(--cv-subtle-border)] rounded-[4px]"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '13px', 
                color: 'var(--cv-primary-text)'
              }}
            />
          </div>

          {/* Primary Market Field */}
          <div className="mb-[24px]">
            <LocationMarketField
              label="PRIMARY MARKET"
              value={primaryMarket}
              onChange={setPrimaryMarket}
              labelClassName="block mb-[12px] text-[11px] uppercase tracking-[0.1em]"
            />
          </div>

          {/* Your Role Field */}
          <div className="mb-[32px]">
            <label 
              className="block mb-[12px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              YOUR ROLE
            </label>
            <div className="grid grid-cols-3 gap-[8px]">
              {roles.map((role) => {
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className="py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors cursor-pointer"
                    style={{ 
                      fontFamily: 'var(--font-label)',
                      border: isSelected ? '1px solid var(--cv-primary-text)' : '1px solid var(--cv-subtle-border)',
                      backgroundColor: isSelected ? 'var(--cv-primary-text)' : 'transparent',
                      color: isSelected ? 'var(--cv-background)' : 'var(--cv-secondary-text)'
                    }}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="cv-btn-primary w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 cursor-pointer"
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
            onClick={() => void skipOnboarding(navigate, agencyId, savedAgencyName, setSavedAgencyName)}
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