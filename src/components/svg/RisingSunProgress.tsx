'use client';

export function RisingSunProgress({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="80"
      height="60"
      viewBox="0 0 80 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        .sun-body {
          animation: sun-rise 1.2s ease-out forwards;
        }
        .sun-ray {
          animation: pulse-warm 2s ease-in-out infinite;
          transform-origin: 40px 45px;
        }
      `}</style>
      <defs>
        <linearGradient id="sun-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#ff8c42" />
        </linearGradient>
        <clipPath id="horizon-clip">
          <rect x="0" y="0" width="80" height="45" />
        </clipPath>
      </defs>
      {/* Horizon line */}
      <line x1="5" y1="45" x2="75" y2="45" stroke="#2ec4b6" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* Sun rays (behind sun) */}
      <g className="sun-ray" clipPath="url(#horizon-clip)">
        <line x1="40" y1="20" x2="40" y2="12" stroke="#ff8c42" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <line x1="52" y1="24" x2="58" y2="18" stroke="#ff8c42" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        <line x1="28" y1="24" x2="22" y2="18" stroke="#ff8c42" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        <line x1="57" y1="35" x2="64" y2="33" stroke="#ff8c42" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
        <line x1="23" y1="35" x2="16" y2="33" stroke="#ff8c42" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
      </g>
      {/* Sun body */}
      <g className="sun-body" clipPath="url(#horizon-clip)">
        <circle cx="40" cy="45" r="16" fill="url(#sun-grad)" opacity="0.15" />
        <circle cx="40" cy="45" r="12" fill="url(#sun-grad)" opacity="0.3" />
        <circle cx="40" cy="45" r="8" fill="url(#sun-grad)" />
      </g>
      {/* Ground hills */}
      <path d="M0,50 Q20,42 40,48 Q60,42 80,50 L80,60 L0,60 Z" fill="#2ec4b6" opacity="0.1" />
    </svg>
  );
}
