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
        className="mb-[32px] max-w-[560px]"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#888880', lineHeight: 1.6 }}
      >
        Generate creative context visualizations from uploaded digitals. For creative reference before test shoots.
      </p>

      <div
        className="border rounded-[4px] p-[24px] mb-[32px] max-w-[640px]"
        style={{ backgroundColor: '#111111', borderColor: '#2a2a2a' }}
      >
        <p
          style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a', lineHeight: 1.6 }}
        >
          Render Lab is an optional creative tool. AI-generated renders are visualizations only — not evaluations. Use Context Alignment for structured analysis.
        </p>
      </div>

      <button
        className="px-[24px] py-[16px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] transition-colors mb-[12px]"
        style={{
          fontFamily: 'var(--font-label)',
          backgroundColor: '#f0f0ec',
          color: '#080808',
          cursor: 'pointer',
        }}
      >
        NEW RENDER
      </button>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: '#666660',
          fontStyle: 'italic',
        }}
      >
        Coming soon — connect your digitals to generate context previews
      </p>
    </div>
  );
}
