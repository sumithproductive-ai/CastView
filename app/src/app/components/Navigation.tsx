import React from 'react';
// Navigation component for CastView landing page

export function Navigation() {
  return (
    <nav className="flex items-center justify-between px-[48px] py-[24px]">
      {/* Logo */}
      <div 
        className="text-[24px]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
      >
        CastView
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-[24px]">
        <a
          href="https://marsh-crow-19382976.figma.site/#/login"
          className="px-[24px] py-[12px] border border-[var(--cv-subtle-border)] rounded-[4px] text-[13px] uppercase tracking-[0.1em] hover:bg-[var(--cv-elevated)] transition-colors"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
        >
          Log In
        </a>
        <a
          href="https://marsh-crow-19382976.figma.site/#/login?tab=signup"
          className="px-[24px] py-[12px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] hover:opacity-80 transition-opacity"
          style={{ 
            fontFamily: 'var(--font-mono)', 
            backgroundColor: 'var(--cv-primary-text)', 
            color: 'var(--cv-background)' 
          }}
        >
          Request Early Access
        </a>
      </div>
    </nav>
  );
}