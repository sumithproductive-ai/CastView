import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check } from 'lucide-react';
import { useRoster, type RosterModel } from '../context/RosterContext';

export function NewModelReview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addModel } = useRoster();

  const modelName = searchParams.get('name')?.trim() || 'New Model';
  const front = searchParams.get('front') || '';
  const profile = searchParams.get('profile') || '';
  const threeQuarter = searchParams.get('threeQuarter') || '';
  const fullBody = searchParams.get('fullBody') || '';
  const marketsFromParams =
    searchParams.get('markets')?.split(',').filter(Boolean) ?? [];
  const height = searchParams.get('height') || '';
  const bust = searchParams.get('bust') || '';
  const waist = searchParams.get('waist') || '';
  const hips = searchParams.get('hips') || '';
  const shoe = searchParams.get('shoe') || '';
  const notesFromParams = searchParams.get('notes') || '';

  const modelData = {
    name: modelName,
    markets:
      marketsFromParams.length > 0 ? marketsFromParams : ['NEW YORK', 'LONDON'],
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
      Shoe: shoe,
    },
    notes: notesFromParams,
    allDigitalsUploaded: Boolean(front && profile && threeQuarter && fullBody),
  };

  const handleAddToRoster = async () => {
    const name = searchParams.get('name')?.trim() || modelName;
    const notes = searchParams.get('notes') || '';
    const now = Date.now();

    const newModel: RosterModel = {
      id: crypto.randomUUID(),
      name,
      image: front || null,
      primaryContext: 'EDITORIAL',
      contexts: ['ED'],
      renderedContexts: [],
      topScore: 0,
      lastEvaluation: 'Not yet evaluated',
      status: 'ACTIVE',
      recentlySigned: true,
      division: 'men',
      digitalSets: [
        {
          id: crypto.randomUUID(),
          uploadedAt: new Date().toLocaleString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
          title: 'Initial Digitals',
          front: front || '',
          profile: profile || '',
          threeQuarter: threeQuarter || '',
          fullBody: fullBody || '',
          additionalImages: [],
          notes: notes || '',
          tags: ['initial'],
          evaluations: [],
        },
      ],
    };

    await addModel(newModel);
    navigate('/roster');
  };

  return (
    <div className="p-[48px]">
      <h1
        className="text-[48px] mb-[32px]"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          color: '#f0f0ec',
        }}
      >
        Review & Add to Roster
      </h1>

      <div className="flex items-center gap-[16px] mb-[48px]">
        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
            style={{
              backgroundColor: '#f0f0ec',
              color: '#080808',
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

        <div className="w-[40px] h-[1px] bg-[#2a2a2a]" />

        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
            style={{
              backgroundColor: '#f0f0ec',
              color: '#080808',
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

        <div className="w-[40px] h-[1px] bg-[#2a2a2a]" />

        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px]"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: '#f0f0ec',
              color: '#080808',
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

      <div className="mb-[24px]">
        <div
          className="text-[9px] uppercase tracking-[0.1em]"
          style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
        >
          REVIEW MODEL
        </div>
      </div>

      <div className="max-w-[480px] mx-auto bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[32px]">
        <h2
          className="text-[32px] mb-[16px]"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            color: '#f0f0ec',
          }}
        >
          {modelData.name}
        </h2>

        <div className="flex gap-[8px] mb-[24px]">
          {modelData.markets.map((market) => (
            <div
              key={market}
              className="px-[12px] py-[6px] border border-[#2a2a2a] rounded-full text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              {market}
            </div>
          ))}
        </div>

        <div
          className="text-[12px] mb-[16px]"
          style={{
            fontFamily: 'var(--font-mono)',
            color: modelData.allDigitalsUploaded ? '#5d7d5d' : '#c4a05d',
          }}
        >
          {modelData.allDigitalsUploaded
            ? '4 of 4 digitals uploaded — ready to add to roster.'
            : 'Upload digitals to continue — you can add remaining shots from the model profile later.'}
        </div>

        <div className="grid grid-cols-4 gap-[12px] mb-[24px]">
          {modelData.digitals.map((digital) => (
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
                <div
                  className="aspect-square bg-[#0d0d0d] border border-dashed rounded-[4px] flex items-center justify-center"
                  style={{ borderColor: '#2a2a2a' }}
                >
                  <div
                    className="text-[7px] uppercase tracking-[0.05em] text-center px-[4px]"
                    style={{
                      fontFamily: 'var(--font-label)',
                      color: '#6a6a64',
                      lineHeight: 1.3,
                    }}
                  >
                    {digital.label}
                    <br />
                    NOT UPLOADED
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

        <div className="h-[1px] bg-[#2a2a2a] mb-[24px]" />

        <div className="grid grid-cols-2 gap-x-[24px] gap-y-[12px] mb-[24px]">
          {Object.entries(modelData.measurements).map(([key, value]) => (
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

        {modelData.notes && (
          <div
            className="text-[13px] mb-[32px] italic"
            style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
          >
            {modelData.notes}
          </div>
        )}

        <div className="space-y-[12px]">
          <button
            type="button"
            onClick={handleAddToRoster}
            className="w-full py-[12px] bg-[#f0f0ec] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{
              fontFamily: 'var(--font-mono)',
              color: '#080808',
            }}
          >
            ADD TO ROSTER
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(`/roster/new/digitals${window.location.search}`)
            }
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
