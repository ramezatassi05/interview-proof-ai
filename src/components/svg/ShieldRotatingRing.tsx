'use client';

interface ShieldRotatingRingProps {
  className?: string;
}

export function ShieldRotatingRing({ className = '' }: ShieldRotatingRingProps) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8b4b8" />
          <stop offset="100%" stopColor="#d4a574" />
        </linearGradient>
      </defs>

      {/* Rotating dotted ring */}
      <circle
        cx="40"
        cy="40"
        r="36"
        stroke="url(#shield-grad)"
        strokeWidth="1"
        strokeDasharray="4 6"
        fill="none"
        opacity="0.5"
        style={{ animation: 'rotate-slow 20s linear infinite', transformOrigin: '40px 40px' }}
      />

      {/* Static outer ring */}
      <circle
        cx="40"
        cy="40"
        r="30"
        stroke="#e8b4b8"
        strokeWidth="0.5"
        fill="none"
        opacity="0.2"
      />

      {/* Shield icon center */}
      <path
        d="M40 18 L40 18 C40 18 52 22 52 22 L52 36 C52 44 46 50 40 54 C34 50 28 44 28 36 L28 22 Z"
        stroke="url(#shield-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Checkmark inside shield */}
      <path
        d="M35 36 L38 39 L45 32"
        stroke="#e8b4b8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
