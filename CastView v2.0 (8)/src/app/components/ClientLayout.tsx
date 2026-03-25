import { Lock } from 'lucide-react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808' }}>
      {/* Top Bar */}
      <div 
        className="w-full px-[24px] py-[16px] border-b flex items-center justify-between"
        style={{ backgroundColor: '#080808', borderColor: '#2a2a2a' }}
      >
        {/* Left: CastView Wordmark */}
        <div 
          className="text-[18px]"
          style={{ fontFamily: 'var(--font-display)', color: '#f0f0ec' }}
        >
          CastView
        </div>

        {/* Right: Secure indicator */}
        <div className="flex items-center gap-[8px]">
          <Lock size={14} style={{ color: '#a0a09a' }} />
          <span 
            className="text-[12px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
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
