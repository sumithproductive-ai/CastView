import { useState, type CSSProperties } from 'react';
import type { DigitalSet } from '../types/talent';

type CompareDigitalSet = Pick<
  DigitalSet,
  'id' | 'title' | 'uploadedAt' | 'tags' | 'front' | 'profile' | 'threeQuarter' | 'fullBody'
>;

type AlignmentChange = {
  context: string;
  direction: 'up' | 'down' | 'neutral';
  delta: number;
};

const digitalSetOptions: CompareDigitalSet[] = [
  {
    id: 'digitals-v1',
    title: 'Digitals V1',
    uploadedAt: 'February 2026',
    tags: ['archive', 'pre-update'],
    front:
      'https://images.unsplash.com/photo-1601288536613-fe4678ea999d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwY2FtcGFpZ24lMjBtb2RlbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3NTk4N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    profile:
      'https://images.unsplash.com/photo-1601288536613-fe4678ea999d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwY2FtcGFpZ24lMjBtb2RlbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3NTk4N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    threeQuarter:
      'https://images.unsplash.com/photo-1601288536613-fe4678ea999d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwY2FtcGFpZ24lMjBtb2RlbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3NTk4N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    fullBody:
      'https://images.unsplash.com/photo-1601288536613-fe4678ea999d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwY2FtcGFpZ24lMjBtb2RlbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3NTk4N3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'digitals-v2',
    title: 'Digitals V2',
    uploadedAt: 'March 2026',
    tags: ['current', 'primary'],
    front:
      'https://images.unsplash.com/photo-1761329842950-f3551938e4da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFncmFuY2UlMjBlZGl0b3JpYWwlMjBtb2RlbCUyMHBob3RvfGVufDF8fHx8MTc3MzE2NTMzMnww&ixlib=rb-4.1.0&q=80&w=1080',
    profile:
      'https://images.unsplash.com/photo-1708170236080-6cb6d2d5497c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZGl0b3JpYWwlMjBmYXNoaW9uJTIwdmVydGljYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMxNjUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    threeQuarter:
      'https://images.unsplash.com/photo-1697677103505-dd4b2dbf1b1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wYWlnbiUyMGZhc2hpb24lMjBzaG9vdHxlbnwxfHx8fDE3NzMxNjUzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    fullBody:
      'https://images.unsplash.com/photo-1759873911657-8140566c29a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBlZGl0b3JpYWwlMjBwb3J0cmFpdCUyMHNxdWFyZXxlbnwxfHx8fDE3NzMxNjUzMzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

const alignmentChanges: AlignmentChange[] = [
  { context: 'Fragrance', direction: 'up', delta: 6 },
  { context: 'Editorial', direction: 'neutral', delta: 0 },
  { context: 'Campaign', direction: 'down', delta: -3 },
];

const digitalSlots = (digitalSet: CompareDigitalSet) => [
  { label: 'Front', src: digitalSet.front },
  { label: 'Profile', src: digitalSet.profile },
  { label: '3/4', src: digitalSet.threeQuarter },
  { label: 'Full Body', src: digitalSet.fullBody },
];

function formatAlignmentChange(change: AlignmentChange) {
  if (change.direction === 'neutral') {
    return { arrow: '↔', detail: 'No change', color: '#888880' };
  }
  if (change.direction === 'up') {
    return { arrow: '↑', detail: `+${change.delta} points`, color: '#4a7a4a' };
  }
  return { arrow: '↓', detail: `${change.delta} points`, color: '#c87a7a' };
}

function DigitalSetPanel({
  digitalSet,
  panelLabel,
  panelLabelColor,
  borderStyle,
}: {
  digitalSet: CompareDigitalSet;
  panelLabel: string;
  panelLabelColor: string;
  borderStyle?: CSSProperties;
}) {
  return (
    <div
      className="flex flex-col bg-[#111111] border border-[#2a2a2a] rounded-[4px] overflow-hidden"
      style={{ width: '320px', flexShrink: 0, ...borderStyle }}
    >
      <div className="px-[14px] py-[10px] border-b border-[#1e1e1e] flex-shrink-0">
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: panelLabelColor,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '2px',
          }}
        >
          {panelLabel}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: '#f0f0ec',
          }}
        >
          {digitalSet.title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#555550',
            marginTop: '2px',
          }}
        >
          {digitalSet.uploadedAt}
        </div>
        {digitalSet.tags.length > 0 && (
          <div className="flex flex-wrap gap-[6px] mt-[8px]">
            {digitalSet.tags.map((tag) => (
              <span
                key={tag}
                className="px-[8px] py-[4px] border border-[#2a2a2a] rounded-[4px] text-[9px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden bg-[#1a1a1a] p-[10px]">
        <div className="grid grid-cols-2 gap-[8px] h-full">
          {digitalSlots(digitalSet).map((slot) => (
            <div key={slot.label} className="overflow-hidden rounded-[4px] bg-[#111111] min-h-0">
              {slot.src && (
                <img
                  src={slot.src}
                  alt={slot.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CompareMode() {
  const [progressionNotes, setProgressionNotes] = useState('');

  const digitalSetA = digitalSetOptions[0];
  const digitalSetB = digitalSetOptions[1];

  return (
    <div className="p-[32px] h-screen flex flex-col overflow-hidden">
      {/* HEADER — compact single line */}
      <div className="flex items-baseline justify-between mb-[20px] flex-shrink-0">
        <div>
          <div className="mb-[4px]">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#6a6a64',
              }}
            >
              Roster › Sofia Andersen › Compare
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: '28px',
              color: '#f0f0ec',
              lineHeight: 1.1,
            }}
          >
            Fragrance — Before & After
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#a0a09a',
              marginTop: '4px',
            }}
          >
            Sofia Andersen · {digitalSetA.title} · {digitalSetA.uploadedAt} →{' '}
            {digitalSetB.title} · {digitalSetB.uploadedAt}
          </p>
        </div>
      </div>

      {/* THREE COLUMN BODY */}
      <div className="flex gap-[16px] flex-1 min-h-0">
        <DigitalSetPanel digitalSet={digitalSetA} panelLabel="BEFORE" panelLabelColor="#666660" />

        <DigitalSetPanel
          digitalSet={digitalSetB}
          panelLabel="AFTER"
          panelLabelColor="#4a7a4a"
          borderStyle={{ border: '1px solid rgba(240,240,236,0.25)' }}
        />

        {/* ── RIGHT — Analysis panel ── */}
        <div className="flex-1 flex flex-col min-w-0 gap-[12px]">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[20px] flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-[14px]">
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: '#888880',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                PROGRESSION ANALYSIS
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#4a7a4a',
                }}
              >
                +20% · 8 months
              </span>
            </div>

            <div className="mb-[14px]">
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: '#888880',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                DIGITAL SET A
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#c8c8c2',
                }}
              >
                {digitalSetA.title}
              </div>
            </div>

            <div className="mb-[14px]">
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: '#888880',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                DIGITAL SET B
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#c8c8c2',
                }}
              >
                {digitalSetB.title}
              </div>
            </div>

            <div
              style={{
                height: '1px',
                backgroundColor: '#1e1e1e',
                margin: '16px 0',
              }}
            />

            <div className="mb-[14px]">
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: '#888880',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                ALIGNMENT CHANGES
              </div>
              <div className="space-y-[8px]">
                {alignmentChanges.map((change) => {
                  const formatted = formatAlignmentChange(change);
                  return (
                    <div
                      key={change.context}
                      className="flex items-center justify-between"
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          color: '#c8c8c2',
                        }}
                      >
                        {change.context}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          color: formatted.color,
                        }}
                      >
                        {formatted.arrow} {formatted.detail}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                height: '1px',
                backgroundColor: '#1e1e1e',
                margin: '16px 0',
              }}
            />

            <div>
              <label
                className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
              >
                PROGRESSION NOTES
              </label>
              <textarea
                value={progressionNotes}
                onChange={(e) => setProgressionNotes(e.target.value)}
                placeholder="Add observations on progression between digital sets..."
                className="w-full h-[80px] px-[16px] py-[10px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] resize-none"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: '#f0f0ec',
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-[8px] flex-shrink-0">
            <button
              className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: '#f0f0ec',
                color: '#080808',
                cursor: 'pointer',
              }}
            >
              SHARE COMPARISON
            </button>
            <button
              className="w-full py-[12px] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#1a1a1a]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: '#a0a09a',
                cursor: 'pointer',
              }}
            >
              SET MARCH 2026 AS PRIMARY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
