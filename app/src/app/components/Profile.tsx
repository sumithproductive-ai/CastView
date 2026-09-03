import React from 'react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ChevronRight, Lock } from 'lucide-react';

import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import { DigitalImage } from './DigitalImage';
import { MARKET_SUGGESTIONS } from './LocationMarketField';

const contexts = [
  'Fragrance', 'Editorial', 'Runway', 
  'Campaign', 'Beauty', 'Sportswear', 
  'Swimwear', 'Couture', 'Street'
];


export function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prospectName = searchParams.get('name')
    ? decodeURIComponent(searchParams.get('name')!)
    : 'Prospect';
  const prospectId = searchParams.get('prospectId') || '';
  const profileType = searchParams.get('profileType') || 'prospect';
  const { getProspectById, prospects, updateProspect, loading: prospectsLoading } = useProspects();
  const { models, loading: rosterLoading } = useRoster();

  const prospect = getProspectById(prospectId);
  const [signedStatusSaveConfirmed, setSignedStatusSaveConfirmed] = useState(false);
  const [agentNotes, setAgentNotes] = useState(prospect?.notes ?? '');
  const [notesSaved, setNotesSaved] = useState(false);
  const isLoading = (prospectsLoading || rosterLoading) && prospectId !== '';
  const rosterModel = !prospect
    ? models.find((m) => m.id === prospectId)
    : null;
  const entity = prospect ?? rosterModel;

  const digitals = entity?.digitalSets?.[0]
    ? [
        { label: 'FRONT', image: entity.digitalSets[0].front },
        { label: 'PROFILE', image: entity.digitalSets[0].profile },
        { label: '3/4', image: entity.digitalSets[0].threeQuarter },
        { label: 'FULL BODY', image: entity.digitalSets[0].fullBody },
      ].filter((d) => d.image)
    : [];

  const measurementData = [
    { key: 'Height', value: prospect?.height ?? '—' },
    {
      key: 'Chest',
      value: prospect?.measurements?.chest
        ? `${prospect.measurements.chest}"`
        : '—',
    },
    {
      key: 'Waist',
      value: prospect?.measurements?.waist
        ? `${prospect.measurements.waist}"`
        : '—',
    },
  ].filter((m) => m.value !== '—');

  const [selectedContexts, setSelectedContexts] = useState<string[]>(['Fragrance', 'Editorial']);

  const toggleContext = (context: string) => {
    setSelectedContexts(prev =>
      prev.includes(context)
        ? prev.filter(c => c !== context)
        : [...prev, context]
    );
  };

  const homeLocation = rosterModel?.location?.trim() ?? '';
  const defaultTargetRegion =
    MARKET_SUGGESTIONS.find((m) => m.toLowerCase() === homeLocation.toLowerCase()) ?? '';
  const [targetRegion, setTargetRegion] = useState<string>(defaultTargetRegion);

  const toggleTargetRegion = (region: string) => {
    setTargetRegion(prev => (prev === region ? '' : region));
  };

  const handleGenerate = () => {
    const contextsParam = selectedContexts.join(',');
    navigate(
      `/rendering?name=${encodeURIComponent(prospectName)}&contexts=${contextsParam}&targetRegion=${encodeURIComponent(targetRegion)}&prospectId=${prospectId}&profileType=${profileType}`
    );
  };
  
  const contextDescriptions: Record<string, string> = {
    'Fragrance':  'Evaluate alignment with luxury fragrance campaign criteria',
    'Editorial':  'Evaluate alignment with fashion editorial and magazine contexts',
    'Runway':     'Evaluate alignment with catwalk and show presentation criteria',
    'Campaign':   'Evaluate alignment with commercial brand advertising criteria',
    'Beauty':     'Evaluate alignment with skincare and cosmetics campaign criteria',
    'Sportswear': 'Evaluate alignment with athletic and activewear criteria',
    'Couture':    'Evaluate alignment with haute couture and high fashion criteria',
    'Swimwear':   'Evaluate alignment with swimwear and resort campaign criteria',
    'Street':     'Evaluate alignment with contemporary street style criteria',
  };
  
  return (
    <div className="p-[20px] md:p-[48px]">
      {isLoading && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--cv-secondary-text)',
          letterSpacing: '0.05em',
          padding: '48px 0',
        }}>
          Loading profile...
        </div>
      )}
      {!isLoading && !entity && prospectId && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#c87a7a',
          letterSpacing: '0.05em',
          padding: '48px 0',
        }}>
          Profile not found. It may have been deleted or the link is invalid.
        </div>
      )}
      <button
        type="button"
        onClick={() =>
          navigate(profileType === 'model' ? '/roster' : '/prospects')
        }
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--cv-secondary-text)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          letterSpacing: '0.05em',
          padding: 0,
          display: 'block',
          marginBottom: '24px',
        }}
      >
        {profileType === 'model' ? '← BACK TO ROSTER' : '← BACK TO PROSPECTS'}
      </button>

      <div className="flex items-center gap-[8px] mb-[48px]">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)' }}>
          {profileType === 'model' ? 'Roster' : 'Prospects'}
        </span>
        <ChevronRight size={14} style={{ color: 'var(--cv-secondary-text)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)' }}>
          {prospectName}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] md:gap-[48px]">
        {/* Left Column */}
        <div>
          {isLoading ? (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--cv-secondary-text)',
              padding: '24px 0',
            }}>
              Loading digitals...
            </div>
          ) : digitals.length > 0 ? (
            <div className="grid grid-cols-2 gap-[16px] mb-[16px]">
              {digitals.map((digital) => (
                <div key={digital.label}>
                  <div className="aspect-square bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] mb-[12px] overflow-hidden">
                    <DigitalImage storageRef={digital.image} alt={digital.label} className="w-full h-full object-cover" />
                  </div>
                  <div
                    className="text-[11px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                  >
                    {digital.label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="mb-[16px]"
              style={{
                color: 'var(--cv-secondary-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              No digitals uploaded yet.
            </div>
          )}

          {/* Privacy Notice */}
          <div className="flex items-center gap-[8px] pt-[12px] mb-[24px]">
            <Lock size={12} style={{ color: 'var(--cv-secondary-text)' }} />
            <div
              className="text-[11px]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
            >
              Digitals are stored securely and used only for evaluation.
            </div>
          </div>

          {measurementData.filter((m) => m.value !== '—').length > 0 && (
            <div className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[24px]">
              <div 
                className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
                style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
              >
                Measurements
              </div>
              <div className="space-y-[12px]">
                {measurementData.map((m) => (
                  <div key={m.key} className="flex justify-between">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)' }}>
                      {m.key}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)' }}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column */}
        <div>
          <h1 
            className="text-[56px] mb-[24px]" 
            style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
          >
            {prospectName}
          </h1>
          
          <div className="flex gap-[8px] mb-[32px]">
            {entity?.contexts?.length
              ? entity.contexts.map((market) => (
                  <span 
                    key={market}
                    className="px-[12px] py-[6px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] text-[11px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                  >
                    {market}
                  </span>
                ))
              : null}
          </div>
          
          <div className="mb-[32px]">
            <div className="flex items-center justify-between mb-[12px]">
              <label
                className="text-[11px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
              >
                Agent Notes
              </label>
              {notesSaved && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a7a4a', letterSpacing: '0.05em' }}>
                  Saved
                </span>
              )}
            </div>
            <textarea
              className="w-full h-[120px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[16px] resize-none"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)' }}
              placeholder="Strong runway presence, versatile look..."
              value={agentNotes}
              onChange={(e) => setAgentNotes(e.target.value)}
              onBlur={async () => {
                if (prospect) {
                  await updateProspect(prospectId, { notes: agentNotes });
                  setNotesSaved(true);
                  setTimeout(() => setNotesSaved(false), 2000);
                }
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--cv-secondary-text)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '10px',
              }}
            >
              Signed Status
            </label>
            <select
              value={entity?.signed_status ?? 'pending'}
              onChange={async (e) => {
                const newStatus = e.target.value;
                await updateProspect(prospectId, { signed_status: newStatus });
                setSignedStatusSaveConfirmed(true);
                setTimeout(() => setSignedStatusSaveConfirmed(false), 1500);
              }}
              style={{
                background: 'var(--cv-surface)',
                border: `1px solid ${signedStatusSaveConfirmed ? '#4a7a4a' : 'var(--cv-subtle-border)'}`,
                borderRadius: '4px',
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--cv-primary-text)',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                width: '100%',
                maxWidth: '200px',
              }}
            >
              <option value="pending">PENDING</option>
              <option value="signed">SIGNED</option>
              <option value="passed">PASSED</option>
            </select>
          </div>

          <div className="mb-[32px]">
            <div className="flex items-center justify-between mb-[16px]">
              <label
                className="text-[11px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
              >
                Select Alignment Contexts
              </label>
              {selectedContexts.length > 0 && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#C8A96E', letterSpacing: '0.05em' }}>
                  {selectedContexts.length} SELECTED
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-[8px] md:gap-[12px]" data-tutorial="context-grid">
              {contexts.map((context) => {
                const isSelected = selectedContexts.includes(context);
                return (
                  <div key={context} className="relative group">
                    <button
                      title={contextDescriptions[context] || ''}
                      onClick={() => toggleContext(context)}
                      className="px-[16px] py-[10px] border rounded-[4px] transition-all text-[11px] uppercase tracking-[0.1em] w-full cursor-pointer"
                      style={{ 
                        fontFamily: 'var(--font-label)',
                        backgroundColor: isSelected ? 'var(--cv-primary-text)' : 'transparent',
                        borderColor: isSelected ? 'var(--cv-primary-text)' : 'var(--cv-subtle-border)',
                        color: isSelected ? 'var(--cv-background)' : 'var(--cv-secondary-text)'
                      }}
                    >
                      {context}
                    </button>
                    
                    <div 
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[8px] px-[10px] py-[6px] rounded-[4px] text-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: 'var(--cv-accent)',
                        backgroundColor: 'var(--cv-elevated)',
                        border: '1px solid var(--cv-subtle-border)',
                        width: '180px',
                        lineHeight: '1.5',
                        whiteSpace: 'normal'
                      }}
                    >
                      {contextDescriptions[context]}
                    </div>
                  </div>
                );
              })}
            </div>
            <p
              className="mt-[12px]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)', lineHeight: 1.6 }}
            >
              CastView analyses uploaded digitals against market context indicators. Results are alignment guidance — not objective judgments.
            </p>
          </div>

          <div className="h-[1px] mb-[32px]" style={{ backgroundColor: 'var(--cv-subtle-border)' }} />

          <div className="mb-[32px]">
            <div className="flex items-center justify-between mb-[16px]">
              <label
                className="text-[11px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
              >
                Target Region
              </label>
              {targetRegion && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#C8A96E', letterSpacing: '0.05em' }}>
                  1 SELECTED
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-[8px] md:gap-[12px]">
              {MARKET_SUGGESTIONS.map((region) => {
                const isSelected = targetRegion === region;
                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => toggleTargetRegion(region)}
                    className="px-[16px] py-[10px] border rounded-[4px] transition-all text-[11px] uppercase tracking-[0.1em] w-full cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-label)',
                      backgroundColor: isSelected ? 'var(--cv-primary-text)' : 'transparent',
                      borderColor: isSelected ? 'var(--cv-primary-text)' : 'var(--cv-subtle-border)',
                      color: isSelected ? 'var(--cv-background)' : 'var(--cv-secondary-text)',
                    }}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
            <p
              className="mt-[12px]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)', lineHeight: 1.6 }}
            >
              Optional — ground this read in the market you're pitching them to.
              {homeLocation ? ` Home market: ${homeLocation}.` : ''} Leave unselected to evaluate without a specific target market.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            className="cv-btn-primary w-full py-[16px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] transition-colors mb-[24px]"
            style={{ 
              fontFamily: 'var(--font-label)',
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)',
              cursor: 'pointer'
            }}
          >
            Run Alignment Analysis
          </button>

        </div>
      </div>

    </div>
  );
}