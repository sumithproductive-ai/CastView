import React from 'react';
In CompareMode.tsx, add a WHY THIS CHANGED 
reasoning panel below the score rows in 
the AFTER column, and add inline reasoning 
tooltips on each score dimension row.

CHANGE 1 — Add reasoning data to afterScores.

Replace the current afterScores array with:

const afterScores = [
  { 
    label: 'Composition', 
    value: 91, 
    delta: 15,
    reason: 'New digitals show stronger jawline definition. Fragrance campaigns prioritise facial geometry — this update brought her closer to the high-contrast look the context demands.'
  },
  { 
    label: 'Style Match', 
    value: 96, 
    delta: 22,
    reason: 'Updated shots reveal a natural stillness that reads as luxury restraint. Fragrance editorial typically rewards controlled expression over movement — her new digitals align precisely with this.'
  },
  { 
    label: 'Versatility', 
    value: 88, 
    delta: 19,
    reason: 'Three new angles in the updated digitals demonstrate she holds well in profile and 3/4 views — essential for fragrance campaigns which use multiple angles across print and digital.'
  },
  { 
    label: 'Market Fit', 
    value: 94, 
    delta: 23,
    reason: 'Her updated look now closely matches models successfully placed in European fragrance campaigns in the past 18 months. The coloring and bone structure hit the current market sweet spot for this context.'
  }
];

CHANGE 2 — Add an expandable reason on each 
AFTER score row. The reason appears below 
the score bar when the row is hovered or 
when a state flag is active.

Add useState:
const [expandedScore, setExpandedScore] = 
  useState<string | null>(null);

In the afterScores map, wrap each score div 
in an outer div with onClick:

<div 
  key={score.label}
  className="cursor-pointer"
  onClick={() => setExpandedScore(
    expandedScore === score.label 
      ? null 
      : score.label
  )}
>
  {/* existing score header row */}
  {/* existing score bar */}
  
  {/* NEW — reason text, expands on click */}
  {expandedScore === score.label && (
    <div 
      className="mt-[8px] pb-[4px]"
      style={{ 
        fontFamily: 'var(--font-mono)', 
        fontSize: '11px', 
        color: '#a0a09a',
        lineHeight: '1.7',
        borderLeft: '2px solid #2a2a2a',
        paddingLeft: '10px'
      }}
    >
      {score.reason}
    </div>
  )}
</div>

Add a small "›" expand indicator to the 
right of the delta pill on each after row. 
Replace the existing delta display:

<div className="flex items-center gap-[8px]">
  <span ...>{score.value}%</span>
  <ArrowUp size={12} ... />
  <span ...>+{score.delta}%</span>
</div>

With:

<div className="flex items-center gap-[8px]">
  <span style={{ fontFamily: 'var(--font-mono)', 
    fontSize: '13px', color: '#f0f0ec' }}>
    {score.value}%
  </span>
  <ArrowUp size={12} style={{ color: '#4a7a4a' }} />
  <span style={{ fontFamily: 'var(--font-mono)', 
    fontSize: '11px', color: '#4a7a4a' }}>
    +{score.delta}%
  </span>
  <span style={{ 
    fontFamily: 'var(--font-mono)', 
    fontSize: '11px', 
    color: expandedScore === score.label 
      ? '#f0f0ec' : '#444440',
    marginLeft: '2px'
  }}>
    {expandedScore === score.label ? '▾' : '›'}
  </span>
</div>

CHANGE 3 — Add a WHY THIS CHANGED summary 
panel below the two score columns, replacing 
the existing summary bar.

Remove the current summary bar:
<div className="flex items-center justify-between 
px-[16px] py-[16px] bg-[#111111] border 
border-[#2a2a2a] rounded-[4px] mb-[24px]">
...
</div>

Replace with a full-width WHY THIS CHANGED 
panel:

<div 
  className="bg-[#111111] border border-[#2a2a2a] 
  rounded-[4px] p-[24px] mb-[24px]"
>
  <div className="flex items-center 
  justify-between mb-[16px]">
    <div 
      className="text-[9px] uppercase 
      tracking-[0.12em]"
      style={{ fontFamily: 'var(--font-label)', 
        color: '#888880' }}
    >
      WHY THIS CHANGED
    </div>
    <div style={{ fontFamily: 'var(--font-mono)', 
      fontSize: '13px', color: '#4a7a4a' }}>
      +20% overall · 8 months
    </div>
  </div>

  <p style={{ 
    fontFamily: 'var(--font-mono)', 
    fontSize: '12px', 
    color: '#c8c8c2',
    lineHeight: '1.8',
    marginBottom: '16px'
  }}>
    The primary driver is Market Fit (+23%) — 
    Sofia's updated digitals now reflect the 
    coloring, structure, and stillness that 
    European fragrance clients have been 
    selecting for consistently over the past 
    18 months. Style Match (+22%) follows from 
    the same update: luxury fragrance editorial 
    rewards controlled, minimal expression and 
    her new shots deliver exactly that.
  </p>

  <p style={{ 
    fontFamily: 'var(--font-mono)', 
    fontSize: '12px', 
    color: '#a0a09a',
    lineHeight: '1.8'
  }}>
    Composition and Versatility gains are 
    secondary — driven by the inclusion of 
    profile and 3/4 angle shots in the updated 
    digitals. These angles were absent in V1, 
    which artificially suppressed both scores. 
    Click any score row above for detail.
  </p>
</div>

No other changes to this file.