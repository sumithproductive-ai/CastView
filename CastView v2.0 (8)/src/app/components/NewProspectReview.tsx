import { useNavigate, useSearchParams } from 'react-router';
import { Check } from 'lucide-react';
import { isSumithProspect, sumithDigitals, SUMITH_PROSPECT_NAME } from '../constants/sumithProspect';

export function NewProspectReview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prospectName = searchParams.get('name')?.trim() || SUMITH_PROSPECT_NAME;

  const prospectData = isSumithProspect(null, prospectName) ? {
    name: SUMITH_PROSPECT_NAME,
    markets: ['NYC', 'LONDON'],
    digitals: [
      { label: 'FRONT', url: sumithDigitals.front },
      { label: 'PROFILE', url: sumithDigitals.profile },
      { label: '3/4', url: sumithDigitals.three_quarter },
      { label: 'FULL BODY', url: sumithDigitals.full_body }
    ],
    measurements: {
      Height: "6'1\"",
      Chest: '38"',
      Waist: '30"',
      Hips: '33"'
    },
    notes: 'Strong fragrance and editorial potential. Direct submission.',
    allDigitalsUploaded: true
  } : {
    name: prospectName,
    markets: ['NEW YORK', 'LONDON'],
    digitals: [
      { label: 'FRONT', url: null },
      { label: 'PROFILE', url: null },
      { label: '3/4', url: null },
      { label: 'FULL BODY', url: null }
    ],
    measurements: {
      Height: '',
      Bust: '',
      Waist: '',
      Hips: ''
    },
    notes: '',
    allDigitalsUploaded: false
  };

  const handleSaveDraft = () => {
    navigate('/prospects');
  };

  const handleSaveAndRender = () => {
    navigate('/profile');
  };

  return (
    <div className="p-[48px]">
      {/* Page Title */}
      <h1 
        className="text-[48px] mb-[32px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        New Prospect
      </h1>

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

        {/* Step 2 - Completed */}
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
            Digitals
          </span>
        </div>

        {/* Connector Line */}
        <div className="w-[40px] h-[1px] bg-[#2a2a2a]" />

        {/* Step 3 - Active */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              backgroundColor: '#f0f0ec',
              color: '#080808'
            }}
          >
            3
          </div>
          <span 
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
          >
            Review
          </span>
        </div>
      </div>

      {/* Section Header */}
      <div className="mb-[24px]">
        <div 
          className="text-[9px] uppercase tracking-[0.1em]"
          style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
        >
          REVIEW PROSPECT
        </div>
      </div>

      {/* Summary Card */}
      <div className="max-w-[480px] mx-auto bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[32px]">
        {/* Prospect Name */}
        <h2 
          className="text-[32px] mb-[16px]" 
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
        >
          {prospectData.name}
        </h2>

        {/* Market Tags */}
        <div className="flex gap-[8px] mb-[24px]">
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

        {/* Upload Notice */}
        <div 
          className="text-[12px] mb-[16px]"
          style={{ fontFamily: 'var(--font-mono)', color: prospectData.allDigitalsUploaded ? '#5d7d5d' : '#c4a05d' }}
        >
          {prospectData.allDigitalsUploaded
            ? '4 of 4 digitals uploaded — ready to run evaluation.'
            : 'Upload digitals to continue — you can add remaining shots from the prospect profile later.'}
        </div>

        {/* Digital Thumbnails */}
        <div className="grid grid-cols-4 gap-[12px] mb-[24px]">
          {prospectData.digitals.map((digital) => (
            <div key={digital.label} className="flex flex-col gap-[8px]">
              {digital.url ? (
                <div className="aspect-square bg-[#1a1a1a] rounded-[4px] overflow-hidden">
                  <img 
                    src={digital.url} 
                    alt={digital.label}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-[#0d0d0d] border border-dashed rounded-[4px] flex items-center justify-center" style={{ borderColor: '#2a2a2a' }}>
                  <div 
                    className="text-[7px] uppercase tracking-[0.05em] text-center px-[4px]"
                    style={{ fontFamily: 'var(--font-label)', color: '#6a6a64', lineHeight: 1.3 }}
                  >
                    {digital.label}<br />NOT UPLOADED
                  </div>
                </div>
              )}
              <div 
                className="text-[8px] uppercase tracking-[0.05em] text-center"
                style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
              >
                {digital.label}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-[#2a2a2a] mb-[24px]" />

        {/* Measurements */}
        <div className="grid grid-cols-2 gap-x-[24px] gap-y-[12px] mb-[24px]">
          {Object.entries(prospectData.measurements).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span 
                className="text-[11px] uppercase tracking-[0.05em]"
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

        {/* Agent Notes */}
        {prospectData.notes && (
          <div 
            className="text-[13px] mb-[32px] italic"
            style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
          >
            {prospectData.notes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-[12px]">
          <button
            onClick={handleSaveDraft}
            className="w-full py-[12px] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#1a1a1a]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              color: '#f0f0ec'
            }}
          >
            SAVE AS DRAFT
          </button>
          <button
            onClick={handleSaveAndRender}
            className="w-full py-[12px] bg-[#f0f0ec] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              color: '#080808'
            }}
          >
            SAVE & RUN RENDERS →
          </button>
          <button
            onClick={() => navigate(`/prospects/new/digitals${window.location.search}`)}
            className="w-full text-center text-[12px] transition-opacity hover:opacity-70"
            style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
          >
            Back to edit
          </button>
        </div>
      </div>
    </div>
  );
}