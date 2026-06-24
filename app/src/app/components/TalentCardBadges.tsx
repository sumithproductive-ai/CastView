type PhotoContextBadgeProps = {
  label: string;
  className?: string;
};

/** Badge over talent photos — always light text on a dark scrim (theme-independent). */
export function PhotoContextBadge({ label, className = '' }: PhotoContextBadgeProps) {
  return (
    <div
      className={`absolute bottom-[12px] left-[12px] px-[10px] py-[4px] rounded-full text-[9px] uppercase tracking-[0.1em] ${className}`}
      style={{
        fontFamily: 'var(--font-label)',
        backgroundColor: 'rgba(8, 8, 8, 0.8)',
        color: '#f0f0ec',
        backdropFilter: 'blur(8px)',
      }}
    >
      {label}
    </div>
  );
}

type ContextCodeChipProps = {
  code: string;
  rendered: boolean;
};

/** Context code chip on prospect/roster cards. */
export function ContextCodeChip({ code, rendered }: ContextCodeChipProps) {
  return (
    <div
      className="flex h-[24px] w-[24px] items-center justify-center rounded-[4px] border text-[8px] uppercase tracking-[0.1em]"
      style={{
        fontFamily: 'var(--font-label)',
        backgroundColor: rendered ? 'var(--cv-primary-text)' : 'transparent',
        borderColor: rendered ? 'var(--cv-primary-text)' : 'var(--cv-subtle-border)',
        color: rendered ? 'var(--cv-background)' : 'var(--cv-secondary-text)',
      }}
    >
      {code}
    </div>
  );
}
