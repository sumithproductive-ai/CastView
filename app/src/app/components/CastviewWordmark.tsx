type CastviewWordmarkProps = {
  height?: number;
};

export function CastviewWordmark({ height = 30 }: CastviewWordmarkProps) {
  const width = Math.round(height * (320 / 64));

  return (
    <span
      className="inline-flex items-center"
      style={{ color: 'var(--cv-primary-text)' }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 320 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CastView"
        role="img"
      >
        <text
          x="20"
          y="44"
          fontFamily="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="38"
          fontWeight="400"
          fill="currentColor"
          letterSpacing="-0.02em"
        >
          castview
        </text>
        <circle cx="284" cy="42" r="5.5" fill="#C5B08D" />
      </svg>
    </span>
  );
}
