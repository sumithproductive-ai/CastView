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
  labelStyle = { fontFamily: 'var(--font-label)', color: '#a0a09a' },
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
        className="w-full bg-[#111111] border border-[#2a2a2a] rounded-[4px]"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: '#f0f0ec',
          padding: '10px 14px',
        }}
      />
      <div className="flex flex-wrap gap-[8px] mt-[10px]">
        {MARKET_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onChange(suggestion)}
            className="border border-[#2a2a2a] text-[#888880] hover:border-[#f0f0ec] hover:text-[#f0f0ec] rounded-[4px] cursor-pointer transition-colors"
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
