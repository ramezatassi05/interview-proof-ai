'use client';

interface GradientWaveDividerProps {
  className?: string;
}

export function GradientWaveDivider({ className = '' }: GradientWaveDividerProps) {
  return (
    <div className={`w-full overflow-hidden ${className}`} aria-hidden="true">
      <svg
        width="100%"
        height="48"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e8b4b8" stopOpacity="0" />
            <stop offset="30%" stopColor="#e8b4b8" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#d4a574" stopOpacity="0.2" />
            <stop offset="70%" stopColor="#e8b4b8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#e8b4b8" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M0 24 Q 180 0, 360 24 T 720 24 T 1080 24 T 1440 24"
          stroke="url(#wave-grad)"
          strokeWidth="1.5"
          fill="none"
        >
          <animate
            attributeName="d"
            dur="8s"
            repeatCount="indefinite"
            values="
              M0 24 Q 180 0, 360 24 T 720 24 T 1080 24 T 1440 24;
              M0 24 Q 180 48, 360 24 T 720 24 T 1080 24 T 1440 24;
              M0 24 Q 180 0, 360 24 T 720 24 T 1080 24 T 1440 24
            "
          />
        </path>

        <path
          d="M0 28 Q 240 8, 480 28 T 960 28 T 1440 28"
          stroke="url(#wave-grad)"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        >
          <animate
            attributeName="d"
            dur="10s"
            repeatCount="indefinite"
            values="
              M0 28 Q 240 8, 480 28 T 960 28 T 1440 28;
              M0 28 Q 240 44, 480 28 T 960 28 T 1440 28;
              M0 28 Q 240 8, 480 28 T 960 28 T 1440 28
            "
          />
        </path>
      </svg>
    </div>
  );
}
