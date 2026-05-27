import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check } from 'lucide-react';
import { useProspects, type Prospect } from '../context/ProspectsContext';

export function NewProspectReview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addProspect } = useProspects();
  const prospectName = searchParams.get('name')?.trim() || 'Prospect';

  const front = searchParams.get('front') || '';
  const profile = searchParams.get('profile') || '';
  const threeQuarter = searchParams.get('threeQuarter') || '';
  const fullBody = searchParams.get('fullBody') || '';
  const marketsFromParams = searchParams.get('markets')?.split(',').filter(Boolean) ?? [];
  const height = searchParams.get('height') || '';
  const bust = searchParams.get('bust') || '';
  const waist = searchParams.get('waist') || '';
  const hips = searchParams.get('hips') || '';
  const shoe = searchParams.get('shoe') || '';
  const notesFromParams = searchParams.get('notes') || '';

  const prospectData = {
    name: prospectName,
    markets: marketsFromParams.length > 0 ? marketsFromParams : ['NEW YORK', 'LONDON'],
    digitals: [
      { label: 'FRONT', url: front || null },
      { label: 'PROFILE', url: profile || null },
      { label: '3/4', url: threeQuarter || null },
      { label: 'FULL BODY', url: fullBody || null },
    ],
    measurements: {
      Height: height,
      Bust: bust,
      Waist: waist,
      Hips: hips,
    },
    notes: notesFromParams,
    allDigitalsUploaded: Boolean(front && profile && threeQuarter && fullBody),
  };

  const buildNewProspect = (status: 'DRAFT' | 'IN REVIEW'): Prospect => {
    const name = searchParams.get('name')?.trim() || prospectName;
    const markets = searchParams.get('markets')?.split(',').filter(Boolean) ?? [];
    const source = searchParams.get('source') || undefined;
    const notes = searchParams.get('notes') || '';
    const now = Date.now();
    const uploadedAt = new Date().toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return {
      id: `${name.trim().toLowerCase().replace(/\s+/g, '-')}-${now}`,
      name,
      status,
      statusColor: status === 'DRAFT' ? '#666666' : '#C8A96E',
      evaluations: 0,
      submissionDate: 'Just now',
      source: source || undefined,
      image: front || null,
      contexts: [],
      renderedContexts: [],
      division: undefined,
      primaryContext: undefined,
      markets: markets.length > 0 ? markets : undefined,
      height: height || undefined,
      measurements: {
        chest: bust,
        waist,
        hips,
        shoe,
      },
      digitalSets: front
        ? [
            {
              id: `ds-${now}`,
              uploadedAt,
              title: 'Initial Submission',
              front: front || null,
              profile: profile || null,
              threeQuarter: threeQuarter || null,
              fullBody: fullBody || null,
              additionalImages: [],
              notes,
              tags: ['initial', 'submission'],
              evaluations: [],
            },
          ]
        : [],
    };
  };

  const handleSaveDraft = () => {
    addProspect(buildNewProspect('DRAFT'));
    navigate('/prospects');
  };

  const handleSaveAndRender = () => {
    const newProspect = buildNewProspect('IN REVIEW');
    addProspect(newProspect);
    setTimeout(() => {
      navigate(
        `/profile?name=${encodeURIComponent(newProspect.name)}&prospectId=${newProspect.id}&profileType=prospect`,
      );
    }, 100);
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
            SAVE & RUN EVALUATION →
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