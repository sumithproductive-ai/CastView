import React from 'react';
export function RenderLab() {
  return (
    <div className="p-[48px]">
      <h1
        className="text-[48px] mb-[12px]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        Render Lab
      </h1>
      <p
        className="mb-[48px]"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#888880' }}
      >
        Generate campaign renders from uploaded digitals — separate from alignment evaluation.
      </p>

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] mb-[32px] max-w-[560px]">
        <div
          className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
          style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
        >
          NOTICE
        </div>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: '#c8c8c2',
            lineHeight: 1.7,
          }}
        >
          Render Lab is for visualizing prospects in campaign contexts. Alignment scores and
          progression analysis live in the main evaluation workflow — not here.
        </p>
      </div>

      <button
        type="button"
        className="px-[20px] py-[12px] bg-[#f0f0ec] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 mb-[16px]"
        style={{
          fontFamily: 'var(--font-mono)',
          color: '#080808',
          cursor: 'not-allowed',
          opacity: 0.5,
        }}
        disabled
      >
        NEW RENDER
      </button>

      <p
        style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666660', fontStyle: 'italic' }}
      >
        Coming soon — render generation will be available in a future release.
      </p>
    </div>
  );
}
