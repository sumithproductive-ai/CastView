interface FrameMarkProps {
  size?: number;
  color?: string;
}

export function FrameMark({ size = 20, color = '#f0f0ec' }: FrameMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Left Corner */}
      <path
        d="M 2 2 L 2 6 M 2 2 L 6 2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="square"
      />
      
      {/* Top Right Corner */}
      <path
        d="M 18 2 L 18 6 M 18 2 L 14 2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="square"
      />
      
      {/* Bottom Left Corner */}
      <path
        d="M 2 18 L 2 14 M 2 18 L 6 18"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="square"
      />
      
      {/* Bottom Right Corner */}
      <path
        d="M 18 18 L 18 14 M 18 18 L 14 18"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}
