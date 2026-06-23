import React from 'react';
import { Lock } from 'lucide-react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cv-background)' }}>
      {/* Top Bar */}
      <div 
        className="w-full px-[24px] py-[16px] border-b flex items-center justify-between"
        style={{ backgroundColor: 'var(--cv-background)', borderColor: 'var(--cv-subtle-border)' }}
      >
        {/* Left: CastView Wordmark */}
        <div 
          className="text-[18px]"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--cv-primary-text)' }}
        >
          CastView
        </div>

        {/* Right: Secure indicator */}
        <div className="flex items-center gap-[8px]">
          <Lock size={14} style={{ color: 'var(--cv-secondary-text)' }} />
          <span 
            className="text-[12px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            Secure · View only
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
