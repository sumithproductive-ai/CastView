import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';

export function NewProspectReview() {
  const navigate = useNavigate();

  // Mock data - in real app this would come from state/context
  const prospectData = {
    name: 'Sofia Andersen',
    markets: ['NEW YORK', 'LONDON'],
    digitals: [
      { label: 'FRONT', url: 'https://images.unsplash.com/photo-1669643783392-09d0a26c79e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3MzUyMHww&ixlib=rb-4.1.0&q=80&w=1080' },
      { label: 'PROFILE', url: 'https://images.unsplash.com/photo-1763987275895-72f645d0acbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2RlbCUyMHByb2ZpbGUlMjBzaWRlJTIwdmlldyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3MzUyMnww&ixlib=rb-4.1.0&q=80&w=1080' },
      { label: '3/4', url: 'https://images.unsplash.com/photo-1669643783392-09d0a26c79e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3MzUyMHww&ixlib=rb-4.1.0&q=80&w=1080' },
      { label: 'FULL BODY', url: 'https://images.unsplash.com/photo-1763987275895-72f645d0acbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2RlbCUyMHByb2ZpbGUlMjBzaWRlJTIwdmlldyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3MzUyMnww&ixlib=rb-4.1.0&q=80&w=1080' }
    ],
    measurements: {
      Height: '177cm',
      Bust: '82cm',
      Waist: '61cm',
      Hips: '89cm'
    },
    notes: 'Strong editorial potential, excellent bone structure for high fashion.'
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
          style={{ fontFamily: 'var(--font-mono)', color: '#c4a05d' }}
        >
          2 of 4 digitals uploaded — you can add the remaining shots from the prospect profile later.
        </div>

        {/* Digital Thumbnails - Showing Partial Upload */}
        <div className="grid grid-cols-4 gap-[12px] mb-[24px]">
          {/* FRONT - Uploaded */}
          <div className="flex flex-col gap-[8px]">
            <div className="aspect-square bg-[#1a1a1a] rounded-[4px] overflow-hidden">
              <img 
                src={prospectData.digitals[0].url} 
                alt="FRONT"
                className="w-full h-full object-cover"
              />
            </div>
            <div 
              className="text-[8px] uppercase tracking-[0.05em] text-center"
              style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
            >
              FRONT
            </div>
          </div>

          {/* PROFILE - Uploaded */}
          <div className="flex flex-col gap-[8px]">
            <div className="aspect-square bg-[#1a1a1a] rounded-[4px] overflow-hidden">
              <img 
                src={prospectData.digitals[1].url} 
                alt="PROFILE"
                className="w-full h-full object-cover"
              />
            </div>
            <div 
              className="text-[8px] uppercase tracking-[0.05em] text-center"
              style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
            >
              PROFILE
            </div>
          </div>

          {/* 3/4 - Not Uploaded */}
          <div className="flex flex-col gap-[8px]">
            <div className="aspect-square bg-[#0d0d0d] border border-dashed rounded-[4px] flex items-center justify-center" style={{ borderColor: '#2a2a2a' }}>
              <div 
                className="text-[7px] uppercase tracking-[0.05em] text-center px-[4px]"
                style={{ fontFamily: 'var(--font-label)', color: '#6a6a64', lineHeight: 1.3 }}
              >
                3/4<br />NOT UPLOADED
              </div>
            </div>
            <div 
              className="text-[8px] uppercase tracking-[0.05em] text-center"
              style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
            >
              3/4
            </div>
          </div>

          {/* FULL BODY - Not Uploaded */}
          <div className="flex flex-col gap-[8px]">
            <div className="aspect-square bg-[#0d0d0d] border border-dashed rounded-[4px] flex items-center justify-center" style={{ borderColor: '#2a2a2a' }}>
              <div 
                className="text-[7px] uppercase tracking-[0.05em] text-center px-[4px]"
                style={{ fontFamily: 'var(--font-label)', color: '#6a6a64', lineHeight: 1.3 }}
              >
                FULL BODY<br />NOT UPLOADED
              </div>
            </div>
            <div 
              className="text-[8px] uppercase tracking-[0.05em] text-center"
              style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
            >
              FULL BODY
            </div>
          </div>
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
            onClick={() => navigate('/prospects/new/digitals')}
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