// Hero component for CastView landing page

export function Hero() {
  return (
    <section className="min-h-[600px] flex items-center justify-center px-[48px] py-[96px]">
      <div className="max-w-[800px] text-center">
        <h1 
          className="text-[72px] mb-[24px]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec', lineHeight: 1.1 }}
        >
          High Fashion Editorial Casting for Modern Agencies
        </h1>
        <p 
          className="text-[16px] mb-[48px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a', lineHeight: 1.6 }}
        >
          Transform your modeling agency workflow with CastView's sophisticated casting platform
        </p>
        <a
          href="https://marsh-crow-19382976.figma.site/#/login"
          className="inline-block px-[32px] py-[16px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] hover:opacity-80 transition-opacity"
          style={{ 
            fontFamily: 'var(--font-mono)', 
            backgroundColor: '#f0f0ec', 
            color: '#080808' 
          }}
        >
          Request Early Access
        </a>
      </div>
    </section>
  );
}
