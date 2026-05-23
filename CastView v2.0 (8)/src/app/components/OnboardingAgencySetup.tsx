import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export function OnboardingAgencySetup() {
  const navigate = useNavigate();
  const [agencyName, setAgencyName] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const markets = ['NEW YORK', 'LONDON', 'PARIS', 'MILAN', 'SYDNEY'];
  const roles = ['AGENT', 'BOOKER', 'DIRECTOR'];

  const toggleMarket = (market: string) => {
    setSelectedMarkets(prev =>
      prev.includes(market)
        ? prev.filter(m => m !== market)
        : [...prev, market]
    );
  };

  const handleContinue = () => {
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
              style={{ backgroundColor: '#f0f0ec' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: '#080808', fontWeight: 500 }}
              >
                1
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#f0f0ec' }}
            >
              Agency
            </span>
          </div>

          {/* Connecting Line */}
          <div 
            className="w-[80px] h-[1px] mx-[16px] mb-[24px]"
            style={{ backgroundColor: '#2a2a2a' }}
          />

          {/* Step 2 - Inactive */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
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

          {/* Step 3 - Inactive */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
              >
                3
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
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
          Welcome to CastView.
        </h1>

        {/* Subtitle */}
        <p 
          className="text-[13px] mb-[48px] text-center"
          style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
        >
          Let's set up your agency in 3 steps.
        </p>

        {/* Form Card */}
        <div 
          className="rounded-[4px] p-[32px]"
          style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}
        >
          {/* Agency Name Field */}
          <div className="mb-[24px]">
            <label 
              className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              AGENCY NAME
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="e.g. Meridian Models"
              className="w-full px-[16px] py-[12px] bg-[#080808] border border-[#2a2a2a] rounded-[4px]"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '13px', 
                color: '#f0f0ec'
              }}
            />
          </div>

          {/* Primary Market Field */}
          <div className="mb-[24px]">
            <label 
              className="block mb-[12px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              PRIMARY MARKET
            </label>
            <div className="flex flex-wrap gap-[8px]">
              {markets.map((market) => {
                const isSelected = selectedMarkets.includes(market);
                return (
                  <button
                    key={market}
                    onClick={() => toggleMarket(market)}
                    className="px-[16px] py-[8px] rounded-full text-[11px] uppercase tracking-[0.1em] transition-colors cursor-pointer"
                    style={{ 
                      fontFamily: 'var(--font-label)',
                      border: isSelected ? '1px solid #f0f0ec' : '1px solid #2a2a2a',
                      backgroundColor: isSelected ? '#f0f0ec' : 'transparent',
                      color: isSelected ? '#080808' : '#a0a09a'
                    }}
                  >
                    {market}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Your Role Field */}
          <div className="mb-[32px]">
            <label 
              className="block mb-[12px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
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
                      border: isSelected ? '1px solid #f0f0ec' : '1px solid #2a2a2a',
                      backgroundColor: isSelected ? '#f0f0ec' : 'transparent',
                      color: isSelected ? '#080808' : '#a0a09a'
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
            className="w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 cursor-pointer"
            style={{ 
              fontFamily: 'var(--font-label)',
              backgroundColor: '#f0f0ec',
              color: '#080808'
            }}
          >
            CONTINUE →
          </button>

          {/* Skip Link */}
          <button
            onClick={() => navigate('/')}
            className="text-[11px] uppercase tracking-[0.05em] hover:opacity-70 transition-opacity mt-[16px]"
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
      </div>
    </div>
  );
}