type CastviewWordmarkProps = {
  height?: number;
};

export function CastviewWordmark({ height = 30 }: CastviewWordmarkProps) {
  const fontSize = Math.round(height * 0.75);
  const dotSize = Math.max(4, Math.round(height * 0.17));

  return (
    <span
      className="inline-flex shrink-0 items-baseline whitespace-nowrap"
      style={{
        color: 'var(--cv-primary-text)',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: `${fontSize}px`,
        fontWeight: 500,
        letterSpacing: '0.04em',
        lineHeight: 1,
      }}
    >
      CastView
      <span
        aria-hidden="true"
        className="inline-block shrink-0 rounded-full"
        style={{
          width: dotSize,
          height: dotSize,
          marginLeft: Math.round(dotSize * 0.3),
          marginBottom: Math.round(dotSize * 0.1),
          backgroundColor: '#b8a06a',
        }}
      />
    </span>
  );
}
