'use client';

interface BreathingPulseRingProps {
  className?: string;
}

export function BreathingPulseRing({ className = '' }: BreathingPulseRingProps) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pulse-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8b4b8" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#d4a574" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#e8b4b8" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="pulse-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4a574" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#e8b4b8" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Outermost ring */}
      <circle
        cx="60"
        cy="60"
        r="55"
        stroke="url(#pulse-grad-1)"
        strokeWidth="1"
        fill="none"
        style={{ animation: 'breathe 4s ease-in-out infinite' }}
      />

      {/* Middle ring */}
      <circle
        cx="60"
        cy="60"
        r="42"
        stroke="url(#pulse-grad-2)"
        strokeWidth="1.5"
        fill="none"
        style={{ animation: 'breathe 4s ease-in-out 0.5s infinite' }}
      />

      {/* Inner ring */}
      <circle
        cx="60"
        cy="60"
        r="28"
        stroke="url(#pulse-grad-1)"
        strokeWidth="2"
        fill="none"
        style={{ animation: 'breathe 4s ease-in-out 1s infinite' }}
      />

      {/* Center dot */}
      <circle
        cx="60"
        cy="60"
        r="4"
        fill="#e8b4b8"
        opacity="0.8"
        style={{ animation: 'breathe 4s ease-in-out 1.5s infinite' }}
      />
    </svg>
  );
}
