import React from 'react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { X } from 'lucide-react';
import { savePendingProspectConsent } from '../../lib/prospectConsent';
import { useAuth } from '../context/AuthContext';

export function ProspectConsent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isChecked, setIsChecked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'DPA' | 'PRIVACY'>('DPA');

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
          <span 
            className="underline cursor-pointer"
            style={{ color: '#c8c8c2' }}
            onClick={() => {
              setShowLegalModal(true);
              setActiveTab('DPA');
            }}
          >
            Data Processing Agreement
          </span>
          {' '}and{' '}
          <span 
            className="underline cursor-pointer"
            style={{ color: '#c8c8c2' }}
            onClick={() => {
              setShowLegalModal(true);
              setActiveTab('PRIVACY');
            }}
          >
            Privacy Policy
          </span>
          .
        </div>
      </div>

      {/* Legal Modal */}
      {showLegalModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center px-[24px]"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 50 }}
          onClick={() => setShowLegalModal(false)}
        >
          <div 
            className="border rounded-[4px] p-[32px] relative"
            style={{ 
              backgroundColor: '#111111', 
              borderColor: '#2a2a2a',
              maxWidth: '560px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowLegalModal(false)}
              className="absolute top-[16px] right-[16px]"
              style={{ color: '#888880' }}
            >
              <X size={20} />
            </button>

            {/* Tabs */}
            <div className="flex gap-[8px] mb-[24px]">
              <button
                onClick={() => setActiveTab('DPA')}
                className="px-[16px] py-[8px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors"
                style={{ 
                  fontFamily: 'var(--font-label)',
                  backgroundColor: activeTab === 'DPA' ? '#f0f0ec' : 'transparent',
                  color: activeTab === 'DPA' ? '#080808' : '#a0a09a',
                  border: activeTab === 'DPA' ? 'none' : '1px solid #2a2a2a'
                }}
              >
                DPA
              </button>
              <button
                onClick={() => setActiveTab('PRIVACY')}
                className="px-[16px] py-[8px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors"
                style={{ 
                  fontFamily: 'var(--font-label)',
                  backgroundColor: activeTab === 'PRIVACY' ? '#f0f0ec' : 'transparent',
                  color: activeTab === 'PRIVACY' ? '#080808' : '#a0a09a',
                  border: activeTab === 'PRIVACY' ? 'none' : '1px solid #2a2a2a'
                }}
              >
                PRIVACY POLICY
              </button>
            </div>

            {/* Content */}
            <div 
              className="overflow-y-auto"
              style={{ 
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#c8c8c2',
                lineHeight: '1.8',
                maxHeight: '400px'
              }}
            >
              {activeTab === 'DPA' ? (
                <div>
                  <h3 className="mb-[16px]" style={{ color: '#f0f0ec' }}>Data Processing Agreement</h3>
                  <p className="mb-[12px]">
                    CastView processes personal data (photographic digitals) on behalf of the Agency as a data processor under GDPR Article 28.
                  </p>
                  <p className="mb-[12px]">
                    Data stored: photographs uploaded as prospect digitals and AI-generated evaluations.
                  </p>
                  <p className="mb-[12px]">
                    Storage location: EU-West (Ireland). No transfer outside EEA without explicit consent.
                  </p>
                  <p className="mb-[12px]">
                    Retention: data is retained until deleted by the Agency or for a maximum of 24 months from last active use, whichever is sooner.
                  </p>
                  <p className="mb-[12px]">
                    Deletion: the Agency may delete all prospect data at any time from the prospect profile page.
                  </p>
                  <p style={{ color: '#888880', fontStyle: 'italic' }}>
                    This is a placeholder document. Replace with legally reviewed DPA before production launch.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="mb-[16px]" style={{ color: '#f0f0ec' }}>Privacy Policy</h3>
                  <p className="mb-[12px]">
                    CastView is committed to protecting the privacy and security of personal data processed through our platform.
                  </p>
                  <p className="mb-[12px]">
                    Data collection: We collect photographic digitals and biographical information provided by modeling agencies for the purpose of AI-powered evaluation.
                  </p>
                  <p className="mb-[12px]">
                    Data use: Personal data is used exclusively for internal agency evaluation purposes. AI-generated evaluations are not shared externally without explicit agency action.
                  </p>
                  <p className="mb-[12px]">
                    Data security: All data is encrypted in transit and at rest. Access is restricted to authorized agency personnel only.
                  </p>
                  <p className="mb-[12px]">
                    Data rights: Prospects have the right to access, correct, or request deletion of their data at any time by contacting their representing agency.
                  </p>
                  <p style={{ color: '#888880', fontStyle: 'italic' }}>
                    This is a placeholder document. Replace with legally reviewed Privacy Policy before production launch.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}