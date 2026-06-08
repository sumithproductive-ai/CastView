import React from 'react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ChevronRight, Lock } from 'lucide-react';

import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import { MessageThread } from './MessageThread';
import { DigitalImage } from './DigitalImage';

const contexts = [
  'Fragrance', 'Editorial', 'Runway', 
  'Campaign', 'Beauty', 'Sportswear', 
  'Swimwear', 'Couture', 'Street'
];

const sectionLabelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  color: '#888880',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

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

  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [signedStatusSaveConfirmed, setSignedStatusSaveConfirmed] = useState(false);
  const isLoading = (prospectsLoading || rosterLoading) && prospectId !== '';
  const prospect = getProspectById(prospectId);
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
  
  const handleGenerate = () => {
    const contextsParam = selectedContexts.join(',');
    navigate(
      `/rendering?name=${encodeURIComponent(prospectName)}&contexts=${contextsParam}&prospectId=${prospectId}&profileType=${profileType}`
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
          color: '#888880',
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
          color: '#888880',
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
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a' }}>
          Prospects
        </span>
        <ChevronRight size={14} style={{ color: '#a0a09a' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}>
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
              color: '#666660',
              padding: '24px 0',
            }}>
              Loading digitals...
            </div>
          ) : digitals.length > 0 ? (
            <div className="grid grid-cols-2 gap-[16px] mb-[16px]">
              {digitals.map((digital) => (
                <div key={digital.label}>
                  <div className="aspect-square bg-[#111111] border border-[#2a2a2a] rounded-[4px] mb-[12px] overflow-hidden">
                    <DigitalImage storageRef={digital.image} alt={digital.label} className="w-full h-full object-cover" />
                  </div>
                  <div 
                    className="text-[11px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
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
                color: '#666660',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              No digitals uploaded yet.
            </div>
          )}
          
          {/* Privacy Notice */}
          <div className="flex items-center gap-[8px] pt-[12px] mb-[24px]">
            <Lock size={12} style={{ color: '#888880' }} />
            <div 
              className="text-[11px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
            >
              Digitals are stored securely and used only for evaluation.{' '}
              <span className="underline cursor-pointer hover:opacity-70 transition-opacity">
                View our data policy.
              </span>
            </div>
          </div>
          
          {measurementData.length > 0 && (
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
              <div 
                className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
                style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
              >
                Measurements
              </div>
              <div className="space-y-[12px]">
                {measurementData.map((m) => (
                  <div key={m.key} className="flex justify-between">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a' }}>
                      {m.key}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}>
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
            style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
          >
            {prospectName}
          </h1>
          
          <div className="flex gap-[8px] mb-[32px]">
            {entity?.contexts?.length
              ? entity.contexts.map((market) => (
                  <span 
                    key={market}
                    className="px-[12px] py-[6px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                  >
                    {market}
                  </span>
                ))
              : null}
          </div>
          
          <div className="mb-[32px]">
            <label 
              className="block mb-[12px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Agent Notes
            </label>
            <textarea 
              className="w-full h-[120px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[16px] resize-none"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
              placeholder="Strong runway presence, versatile look..."
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#a0a09a',
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
                background: '#111111',
                border: `1px solid ${signedStatusSaveConfirmed ? '#4a7a4a' : '#2a2a2a'}`,
                borderRadius: '4px',
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#F0F0EC',
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

          <div>
            <button
              type="button"
              onClick={() => setIsMessagesOpen((open) => !open)}
              className="mt-[32px] mb-[16px] flex items-center gap-[8px] bg-transparent border-none p-0"
              style={{ cursor: 'pointer' }}
            >
              <span style={sectionLabelStyle}>MESSAGES</span>
              <span style={{ ...sectionLabelStyle, fontSize: '8px' }}>
                {isMessagesOpen ? '▲' : '▼'}
              </span>
            </button>

            {isMessagesOpen && (
              <MessageThread
                prospectId={prospectId}
                prospectName={prospectName}
                prospectEmail={entity?.email ?? ''}
              />
            )}
          </div>

          <div className="mb-[32px]">
            <label 
              className="block mb-[16px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Select Alignment Contexts
            </label>
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
                        backgroundColor: isSelected ? '#f0f0ec' : 'transparent',
                        borderColor: isSelected ? '#f0f0ec' : '#2a2a2a',
                        color: isSelected ? '#080808' : '#a0a09a'
                      }}
                    >
                      {context}
                    </button>
                    
                    <div 
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[8px] px-[10px] py-[6px] rounded-[4px] text-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: '#c8c8c2',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
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
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880', lineHeight: 1.6 }}
            >
              CastView analyses uploaded digitals against market context indicators. Results are alignment guidance — not objective judgments.
            </p>
          </div>
          
          <button
            onClick={handleGenerate}
            className="cv-btn-primary w-full py-[16px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] transition-colors mb-[24px]"
            style={{ 
              fontFamily: 'var(--font-label)',
              backgroundColor: '#f0f0ec',
              color: '#080808',
              cursor: 'pointer'
            }}
          >
            Run Alignment Analysis
          </button>

          {/* Status Row */}
          <div className="flex items-center gap-[16px]">
            <div 
              className="px-[16px] py-[8px] rounded-full text-[9px] uppercase tracking-[0.1em]"
              style={{ 
                fontFamily: 'var(--font-label)', 
                backgroundColor: '#7d6d4d33',
                color: '#7d6d4d',
                border: '1px solid #7d6d4d'
              }}
            >
              In Review
            </div>
            <button
              className="text-[13px] hover:opacity-70 transition-opacity"
              style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
            >
              Change Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}