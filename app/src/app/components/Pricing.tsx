import React from 'react';
// Pricing component for CastView landing page

export function Pricing() {
  return (
    <section className="min-h-screen flex items-center justify-center px-[24px] md:px-[48px] py-[96px]">
      <div className="max-w-[1200px] w-full">
        {/* Section Header */}
        <div className="text-center mb-[64px]">
          <h2 
            className="text-[56px] mb-[16px]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)', lineHeight: 1.1 }}
          >
            Pricing
          </h2>
          <p 
            className="text-[15px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)', lineHeight: 1.6 }}
          >
            Choose the plan that fits your agency
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-2 gap-[24px] mb-[48px]">
          {/* Boutique Tier */}
          <div className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[32px]">
            <div 
              className="text-[11px] uppercase tracking-[0.12em] mb-[16px]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              SOLO
            </div>
            <div 
              className="text-[48px] mb-[8px]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
            >
              $49
            </div>
            <div 
              className="text-[13px] mb-[32px]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
            >
              per month
            </div>

            {/* Features */}
            <ul className="space-y-[16px] mb-[32px]">
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                Up to 50 active prospects
              </li>
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                Unlimited evaluations
              </li>
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                4 context categories
              </li>
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                Client portal access
              </li>
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                2 team members
              </li>
            </ul>

            {/* CTA */}
            <div>
              <button
                className="w-full px-[24px] py-[14px] bg-[var(--cv-primary-text)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 mb-[12px]"
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  color: 'var(--cv-background)'
                }}
              >
                START FREE TRIAL
              </button>
              <div 
                className="text-[11px] text-center"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
              >
                14 days free · No credit card required
              </div>
            </div>
          </div>

          {/* Studio Tier */}
          <div className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[32px]">
            <div 
              className="text-[11px] uppercase tracking-[0.12em] mb-[16px]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              STUDIO
            </div>
            <div 
              className="text-[48px] mb-[8px]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
            >
              $99
            </div>
            <div 
              className="text-[13px] mb-[32px]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
            >
              per month
            </div>

            {/* Features */}
            <ul className="space-y-[16px] mb-[32px]">
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                Unlimited prospects
              </li>
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                Unlimited evaluations
              </li>
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                All context categories
              </li>
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                Client portal access
              </li>
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                Unlimited team members
              </li>
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                Priority support
              </li>
              <li 
                className="text-[13px] flex items-start gap-[8px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                <span style={{ color: 'var(--cv-primary-text)' }}>✓</span>
                Custom branding
              </li>
            </ul>

            {/* CTA */}
            <div>
              <button
                className="w-full px-[24px] py-[14px] bg-[var(--cv-primary-text)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 mb-[12px]"
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  color: 'var(--cv-background)'
                }}
              >
                START FREE TRIAL
              </button>
              <div 
                className="text-[11px] text-center"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
              >
                14 days free · No credit card required
              </div>
            </div>
          </div>
        </div>

        {/* Money-Back Guarantee */}
        <div className="flex items-center justify-center gap-[8px]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L10.5 3L13.5 2.5L14 5.5L16 7.5L14.5 10L15 13L12 13.5L10.5 16L8 14.5L5.5 16L4 13.5L1 13L1.5 10L0 7.5L2 5.5L2.5 2.5L5.5 3L8 1Z" stroke="var(--cv-secondary-text)" strokeWidth="1" fill="none"/>
            <path d="M5 8L7 10L11 6" stroke="var(--cv-secondary-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div 
            className="text-[12px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            14-day money-back guarantee · Cancel anytime · No questions asked
          </div>
        </div>
      </div>
    </section>
  );
}
