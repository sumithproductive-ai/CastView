import React from 'react';

export const MARKET_SUGGESTIONS = [
  'New York',
  'Los Angeles',
  'Miami',
  'Atlanta',
  'Dallas',
  'Chicago',
  'London',
  'Paris',
  'Milan',
  'Sydney',
];

interface LocationMarketFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
}

export function LocationMarketField({
  value,
  onChange,
  label,
  placeholder = 'e.g. Dallas, Atlanta, New York...',
  labelClassName = 'block mb-[8px] text-[11px] uppercase tracking-[0.1em]',
  labelStyle = { fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' },
}: LocationMarketFieldProps) {
  return (
    <div>
      <label className={labelClassName} style={labelStyle}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--cv-primary-text)',
          padding: '10px 14px',
        }}
      />
      <div className="flex flex-wrap gap-[8px] mt-[10px]">
        {MARKET_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onChange(suggestion)}
            className="border border-[var(--cv-subtle-border)] text-[var(--cv-secondary-text)] hover:border-[var(--cv-primary-text)] hover:text-[var(--cv-primary-text)] rounded-[4px] cursor-pointer transition-colors"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '4px 10px',
              background: 'transparent',
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
