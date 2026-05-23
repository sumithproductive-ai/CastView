import { useState } from 'react';

type DigitalSetOption = {
  id: string;
  title: string;
  date: string;
  thumbnail: string;
};

type MockResult = {
  context: string;
  oldScore: number;
  newScore: number;
  change: 'improved' | 'declined' | 'stable';
  reasoning: string;
  nextStep: string;
};

const digitalSets: DigitalSetOption[] = [
  {
    id: 'ds-1',
    title: 'Initial Submission',
    date: 'January 2026',
    thumbnail: 'https://i.imgur.com/jZHp7Ei.jpg',
  },
  {
    id: 'ds-2',
    title: 'Post-Cut Digitals',
    date: 'March 2026',
    thumbnail: 'https://i.imgur.com/jZHp7Ei.jpg',
  },
  {
    id: 'ds-3',
    title: 'May 2026 Update',
    date: 'May 2026',
    thumbnail: 'https://i.imgur.com/jZHp7Ei.jpg',
  },
];

const contexts = [
  'Fragrance',
  'Editorial',
  'Runway',
  'Campaign',
  'Beauty',
  'Sportswear',
  'Couture',
  'Swimwear',
  'Streetwear',
  'E-commerce',
];

const mockResults: MockResult[] = [
  {
    context: 'Fragrance',
    oldScore: 78,
    newScore: 91,
    change: 'improved',
    reasoning:
      'Updated digitals show improved bone structure visibility and stronger contrast range. More aligned with current luxury fragrance casting criteria.',
    nextStep: 'Prioritise fragrance test shoot within next 30 days.',
  },
  {
    context: 'Editorial',
    oldScore: 82,
    newScore: 88,
    change: 'improved',
    reasoning:
      'Improved posture and framing in new digitals. Editorial versatility score has increased.',
    nextStep: 'Submit to editorial clients in NYC and London markets.',
  },
  {
    context: 'Runway',
    oldScore: 74,
    newScore: 71,
    change: 'declined',
    reasoning:
      'Slight decline in proportion indicators. May reflect digital quality rather than actual change.',
    nextStep:
      'Upload full body digital with better lighting for more accurate runway assessment.',
  },
  {
    context: 'Campaign',
    oldScore: 85,
    newScore: 85,
    change: 'stable',
    reasoning:
      'Commercial appeal indicators remain consistent across both digital sets.',
    nextStep: 'Maintain current positioning for commercial campaign submissions.',
  },
  {
    context: 'Beauty',
    oldScore: 79,
    newScore: 86,
    change: 'improved',
    reasoning:
      'Skin clarity and facial detail improved in updated digitals. Better alignment with beauty context criteria.',
    nextStep: 'Consider beauty and grooming campaign submissions.',
  },
  {
    context: 'Sportswear',
    oldScore: 81,
    newScore: 83,
    change: 'improved',
    reasoning: 'Slight improvement in physicality indicators from updated digitals.',
    nextStep: 'Athletic and activewear submissions viable.',
  },
  {
    context: 'Couture',
    oldScore: 76,
    newScore: 79,
    change: 'improved',
    reasoning: 'Marginal improvement. Couture alignment remains moderate.',
    nextStep: 'Focus on editorial and fragrance first before couture submissions.',
  },
  {
    context: 'Swimwear',
    oldScore: 80,
    newScore: 80,
    change: 'stable',
    reasoning: 'Consistent alignment across both digital sets for swimwear context.',
    nextStep: 'Swimwear submissions viable when seasonally relevant.',
  },
  {
    context: 'Streetwear',
    oldScore: 88,
    newScore: 90,
    change: 'improved',
    reasoning:
      'Strong contemporary style alignment. Updated digitals reinforce street style positioning.',
    nextStep: 'High priority for streetwear and contemporary brand submissions.',
  },
  {
    context: 'E-commerce',
    oldScore: 83,
    newScore: 84,
    change: 'stable',
    reasoning: 'Consistent commercial versatility across both digital sets.',
    nextStep: 'Suitable for e-commerce and product campaign work.',
  },
];

const sectionLabelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  color: '#888880',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

function toScoreLabel(date: string) {
  const [month, year] = date.split(' ');
  return `${month.slice(0, 3).toUpperCase()} ${year}`;
}

function getChangeDisplay(change: MockResult['change']) {
  if (change === 'improved') {
    return { text: '↑ IMPROVED', color: '#4a7a4a' };
  }
  if (change === 'declined') {
    return { text: '↓ DECLINED', color: '#c87a7a' };
  }
  return { text: '↔ STABLE', color: '#888880' };
}

function DigitalSetSelector({
  panelLabel,
  selectedId,
  onSelect,
}: {
  panelLabel: string;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div
        className="mb-[12px]"
        style={sectionLabelStyle}
      >
        {panelLabel}
      </div>
      <div className="space-y-[8px]">
        {digitalSets.map((set) => {
          const isSelected = selectedId === set.id;
          return (
            <button
              key={set.id}
              type="button"
              onClick={() => onSelect(set.id)}
              className="w-full flex items-center gap-[12px] p-[12px] rounded-[4px] text-left transition-colors"
              style={{
                backgroundColor: '#111111',
                border: `1px solid ${isSelected ? '#f0f0ec' : '#2a2a2a'}`,
                cursor: 'pointer',
              }}
            >
              <div
                className="flex-shrink-0 overflow-hidden rounded-[4px] bg-[#1a1a1a]"
                style={{ width: '48px', height: '48px' }}
              >
                <img
                  src={set.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#f0f0ec',
                  }}
                >
                  {set.title}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: '#555550',
                    marginTop: '2px',
                  }}
                >
                  {set.date}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CompareMode() {
  const [previousSetId, setPreviousSetId] = useState('ds-1');
  const [currentSetId, setCurrentSetId] = useState('ds-3');
  const [selectedContexts, setSelectedContexts] = useState<string[]>([
    'Fragrance',
    'Editorial',
  ]);
  const [showResults, setShowResults] = useState(false);
  const [agentNotes, setAgentNotes] = useState<Record<string, string>>({});

  const previousSet =
    digitalSets.find((set) => set.id === previousSetId) ?? digitalSets[0];
  const currentSet =
    digitalSets.find((set) => set.id === currentSetId) ?? digitalSets[2];

  const previousScoreLabel = toScoreLabel(previousSet.date);
  const currentScoreLabel = toScoreLabel(currentSet.date);

  const toggleContext = (context: string) => {
    setSelectedContexts((prev) =>
      prev.includes(context)
        ? prev.filter((c) => c !== context)
        : [...prev, context]
    );
  };

  const handleSelectAll = () => {
    setSelectedContexts([...contexts]);
  };

  const handleClear = () => {
    setSelectedContexts([]);
  };

  const visibleResults = mockResults.filter((result) =>
    selectedContexts.includes(result.context)
  );

  const summaryCounts = visibleResults.reduce(
    (acc, result) => {
      acc[result.change] += 1;
      return acc;
    },
    { improved: 0, stable: 0, declined: 0 }
  );

  return (
    <div className="p-[32px] min-h-screen flex flex-col overflow-y-auto">
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
            Digital Set Comparison
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#a0a09a',
              marginTop: '4px',
            }}
          >
            Sofia Andersen · {previousSet.title} · {previousSet.date} →{' '}
            {currentSet.title} · {currentSet.date}
          </p>
        </div>
      </div>

      {/* STEP 1 — Digital Set Selection */}
      <div className="flex gap-[16px] mb-[32px]">
        <DigitalSetSelector
          panelLabel="PREVIOUS DIGITALS"
          selectedId={previousSetId}
          onSelect={setPreviousSetId}
        />
        <DigitalSetSelector
          panelLabel="CURRENT DIGITALS"
          selectedId={currentSetId}
          onSelect={setCurrentSetId}
        />
      </div>

      {/* STEP 2 — Context Selection */}
      <div className="mb-[24px]">
        <div className="mb-[12px]" style={sectionLabelStyle}>
          SELECT CONTEXTS TO COMPARE
        </div>
        <div className="grid grid-cols-5 gap-[12px]">
          {contexts.map((context) => {
            const isSelected = selectedContexts.includes(context);
            return (
              <button
                key={context}
                type="button"
                onClick={() => toggleContext(context)}
                className="px-[16px] py-[10px] border rounded-[4px] transition-all text-[11px] uppercase tracking-[0.1em] w-full cursor-pointer"
                style={{
                  fontFamily: 'var(--font-label)',
                  backgroundColor: isSelected ? '#f0f0ec' : 'transparent',
                  borderColor: isSelected ? '#f0f0ec' : '#2a2a2a',
                  color: isSelected ? '#080808' : '#a0a09a',
                }}
              >
                {context}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-[8px] mt-[12px]">
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#888880',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            SELECT ALL
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880' }}>
            ·
          </span>
          <button
            type="button"
            onClick={handleClear}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#888880',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* STEP 3 — Run Comparison */}
      <button
        type="button"
        onClick={() => setShowResults(true)}
        className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 mb-[32px]"
        style={{
          fontFamily: 'var(--font-mono)',
          backgroundColor: '#f0f0ec',
          color: '#080808',
          cursor: 'pointer',
        }}
      >
        RUN COMPARISON
      </button>

      {showResults && (
        <div>
          <div className="mb-[8px]" style={sectionLabelStyle}>
            PROGRESSION ANALYSIS
          </div>
          <p
            className="mb-[20px]"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#888880',
            }}
          >
            {previousSet.title} → {currentSet.title}
          </p>

          {/* Summary bar */}
          <div
            className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[20px] mb-[16px] flex gap-[24px]"
          >
            {(
              [
                { key: 'improved' as const, label: 'IMPROVED', color: '#4a7a4a' },
                { key: 'stable' as const, label: 'STABLE', color: '#888880' },
                { key: 'declined' as const, label: 'DECLINED', color: '#c87a7a' },
              ] as const
            ).map((stat) => (
              <div key={stat.key} className="flex-1 text-center">
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '24px',
                    color: stat.color,
                  }}
                >
                  {summaryCounts[stat.key]}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: stat.color,
                    marginTop: '4px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Result cards */}
          <div className="space-y-[12px]">
            {visibleResults.map((result) => {
              const changeDisplay = getChangeDisplay(result.change);
              return (
                <div
                  key={result.context}
                  className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[20px]"
                >
                  <div className="flex items-center justify-between mb-[16px]">
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: '#f0f0ec',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}
                    >
                      {result.context}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: changeDisplay.color,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {changeDisplay.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-[16px] mb-[16px]">
                    <div className="flex-1">
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: '#888880',
                          marginBottom: '4px',
                        }}
                      >
                        {previousScoreLabel}
                      </div>
                      <div
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '28px',
                          color: '#f0f0ec',
                        }}
                      >
                        {result.oldScore}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '14px',
                        color: '#888880',
                      }}
                    >
                      →
                    </span>
                    <div className="flex-1">
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: '#888880',
                          marginBottom: '4px',
                        }}
                      >
                        {currentScoreLabel}
                      </div>
                      <div
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '28px',
                          color: '#f0f0ec',
                        }}
                      >
                        {result.newScore}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      height: '1px',
                      backgroundColor: '#1a1a1a',
                      marginBottom: '16px',
                    }}
                  />

                  <p
                    className="mb-[12px]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: '#a0a09a',
                      lineHeight: 1.6,
                    }}
                  >
                    {result.reasoning}
                  </p>

                  <p
                    className="mb-[16px]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: '#888880',
                      lineHeight: 1.6,
                    }}
                  >
                    <span style={{ color: '#C8A96E' }}>→ </span>
                    {result.nextStep}
                  </p>

                  <textarea
                    value={agentNotes[result.context] ?? ''}
                    onChange={(e) =>
                      setAgentNotes((prev) => ({
                        ...prev,
                        [result.context]: e.target.value,
                      }))
                    }
                    placeholder="Add agent note for this context..."
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      backgroundColor: '#0d0d0d',
                      border: '1px solid #2a2a2a',
                      color: '#f0f0ec',
                      padding: '8px',
                      width: '100%',
                      resize: 'vertical',
                      borderRadius: '4px',
                      minHeight: '60px',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
