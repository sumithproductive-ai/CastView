// CTABanner component for CastView landing page

export function CTABanner() {
  return (
    <section className="px-[48px] py-[96px]">
      <div className="max-w-[1200px] mx-auto bg-[#111111] border border-[#2a2a2a] rounded-[4px] px-[64px] py-[64px] text-center">
        <h2 
          className="text-[48px] mb-[16px]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
        >
          Ready to Transform Your Casting Process?
        </h2>
        <p 
          className="text-[14px] mb-[32px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
        >
          Join leading agencies using CastView to streamline their workflows
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
