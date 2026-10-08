import React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { savePendingProspectConsent } from '../../lib/prospectConsent';
import { useAuth } from '../context/AuthContext';

export function ProspectConsent() {
  const { t } = useTranslation('newEntry');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isChecked, setIsChecked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const prospectName = searchParams.get('name')
    ? decodeURIComponent(searchParams.get('name')!)
    : t('consent.fallbackName');

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
      style={{ backgroundColor: 'var(--cv-background)' }}
    >
      {/* CastView Logo */}
      <div 
        className="text-[32px] mb-[32px]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
      >
        CastView
      </div>

      {/* Headline */}
      <h1 
        className="text-[36px] mb-[24px] text-center"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
      >
        {t('consent.headline')}
      </h1>

      {/* Body Copy */}
      <div 
        className="mb-[32px] text-center"
        style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '13px', 
          color: 'var(--cv-accent)',
          maxWidth: '480px',
          lineHeight: '1.8'
        }}
      >
        {t('consent.body', { name: prospectName })}
        <br /><br />
        {t('consent.bodyDetail')}
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
            accentColor: 'var(--cv-primary-text)'
          }}
        />
        <label 
          htmlFor="consent-checkbox"
          className="cursor-pointer"
          style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '12px', 
            color: 'var(--cv-primary-text)'
          }}
        >
          {t('consent.checkboxLabel', { name: prospectName })}
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-[12px] mb-[16px]">
        <button
          onClick={handleBack}
          className="px-[24px] py-[12px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[var(--cv-primary-text)]"
          style={{ 
            fontFamily: 'var(--font-label)',
            borderColor: 'var(--cv-subtle-border)',
            color: 'var(--cv-secondary-text)',
            backgroundColor: 'transparent',
            cursor: 'pointer'
          }}
        >
          {t('consent.back')}
        </button>
        <button
          onClick={handleContinue}
          disabled={!isChecked}
          className="px-[24px] py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity"
          style={{ 
            fontFamily: 'var(--font-label)',
            backgroundColor: isChecked ? 'var(--cv-primary-text)' : 'var(--cv-subtle-border)',
            color: isChecked ? 'var(--cv-background)' : 'var(--cv-secondary-text)',
            cursor: isChecked ? 'pointer' : 'not-allowed',
            opacity: isChecked ? 1 : 0.5
          }}
        >
          {isConfirming ? t('consent.consentRecorded') : t('consent.continueToDigitals')}
        </button>
      </div>

      {/* Footer Text */}
      <div 
        className="text-center"
        style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '11px', 
          color: 'var(--cv-secondary-text)'
        }}
      >
        <div className="italic mb-[4px]">
          {t('consent.storedNotice')}
        </div>
        <div className="mb-[8px]">
          {t('consent.storedLabel', { name: prospectName, date: new Date().toLocaleDateString(), agent: user?.email ?? t('consent.agentFallback') })}
        </div>
        <div>
          {t('consent.agreementPrefix')}{' '}
          <Link
            to="/privacy#data-processing-agreement"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: 'var(--cv-accent)' }}
          >
            {t('consent.dataProcessingAgreement')}
          </Link>
          {' '}{t('consent.and')}{' '}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: 'var(--cv-accent)' }}
          >
            {t('consent.privacyPolicy')}
          </Link>
          {t('consent.agreementSuffix')}.
        </div>
      </div>
    </div>
  );
}