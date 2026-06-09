import React from 'react';
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { savePendingProspectConsent } from '../../lib/prospectConsent';
import { useAuth } from '../context/AuthContext';

export function ProspectConsent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isChecked, setIsChecked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const prospectName = searchParams.get('name') 
    ? decodeURIComponent(searchParams.get('name')!) 
    : 'the prospect';

  const handleBack = () => {
    const currentParams = window.location.search;
    navigate(`/prospects/new${currentParams}`);
  };

  const handleContinue = () => {
    if (isChecked && !isConfirming && user) {
      setIsConfirming(true);
      savePendingProspectConsent({
        confirmedAt: new Date().toISOString(),
        prospectName,
        agentUserId: user.id,
        agentEmail: user.email ?? '',
      });
      setTimeout(() => {
        navigate(`/prospects/new/digitals${window.location.search}`);
      }, 800);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-[24px]"
      style={{ backgroundColor: '#080808' }}
    >
      {/* CastView Logo */}
      <div 
        className="text-[32px] mb-[32px]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        CastView
      </div>

      {/* Headline */}
      <h1 
        className="text-[36px] mb-[24px] text-center"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        Before we continue
      </h1>

      {/* Body Copy */}
      <div 
        className="mb-[32px] text-center"
        style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '13px', 
          color: '#c8c8c2',
          maxWidth: '480px',
          lineHeight: '1.8'
        }}
      >
        Before we generate evaluations for {prospectName}, we want to make sure they know their photos are being used.
        <br /><br />
        CastView analyses uploaded digitals to generate structured context alignment evaluations for internal agency use only. Evaluations are not shared with clients until you choose to share them. Photos can be deleted from the prospect's profile at any time.
      </div>

      {/* Checkbox Row */}
      <div className="flex items-start gap-[12px] mb-[32px]" style={{ maxWidth: '480px' }} data-tutorial="consent-content">
        <input
          type="checkbox"
          id="consent-checkbox"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
          className="mt-[4px] cursor-pointer"
          style={{
            width: '16px',
            height: '16px',
            accentColor: '#f0f0ec'
          }}
        />
        <label 
          htmlFor="consent-checkbox"
          className="cursor-pointer"
          style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '12px', 
            color: '#f0f0ec'
          }}
        >
          I've confirmed {prospectName} has consented to their photos being used for internal evaluation.
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-[12px] mb-[16px]">
        <button
          onClick={handleBack}
          className="px-[24px] py-[12px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[#f0f0ec]"
          style={{ 
            fontFamily: 'var(--font-label)',
            borderColor: '#2a2a2a',
            color: '#a0a09a',
            backgroundColor: 'transparent',
            cursor: 'pointer'
          }}
        >
          BACK
        </button>
        <button
          onClick={handleContinue}
          disabled={!isChecked}
          className="px-[24px] py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity"
          style={{ 
            fontFamily: 'var(--font-label)',
            backgroundColor: isChecked ? '#f0f0ec' : '#2a2a2a',
            color: isChecked ? '#080808' : '#6a6a64',
            cursor: isChecked ? 'pointer' : 'not-allowed',
            opacity: isChecked ? 1 : 0.5
          }}
        >
          {isConfirming ? '✓ CONSENT RECORDED' : 'CONTINUE TO DIGITALS'}
        </button>
      </div>

      {/* Footer Text */}
      <div 
        className="text-center"
        style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '11px', 
          color: '#888880'
        }}
      >
        <div className="italic mb-[4px]">
          This consent record is stored with the prospect's profile.
        </div>
        <div className="mb-[8px]">
          Stored: {prospectName} · {new Date().toLocaleDateString()} · Agent: {user?.email ?? 'Agent'}
        </div>
        <div>
          By continuing you agree to CastView's{' '}
          <Link
            to="/privacy#data-processing-agreement"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: '#c8c8c2' }}
          >
            Data Processing Agreement
          </Link>
          {' '}and{' '}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: '#c8c8c2' }}
          >
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  );
}