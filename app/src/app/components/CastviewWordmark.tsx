type CastviewWordmarkProps = {
  height?: number;
};

const VIEWBOX_WIDTH = 230;
const VIEWBOX_HEIGHT = 40;

export function CastviewWordmark({ height = 30 }: CastviewWordmarkProps) {
  const width = Math.round(height * (VIEWBOX_WIDTH / VIEWBOX_HEIGHT));

  return (
    <span
      className="inline-flex items-center"
      style={{ color: 'var(--cv-primary-text)' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 230 40"
        width={width}
        height={height}
        role="img"
        aria-label="CastView"
      >
        <text
          x="0"
          y="29"
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontSize="30"
          fontWeight="500"
          letterSpacing="0.4"
          fill="currentColor"
        >
          CastView
        </text>
        <circle cx="214" cy="29" r="3.4" fill="#b8a06a" />
      </svg>
    </span>
  );
}
