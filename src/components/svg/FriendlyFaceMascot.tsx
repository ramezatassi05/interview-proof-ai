'use client';

export function FriendlyFaceMascot({
  className = '',
  size,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size ?? 64}
      height={size ?? 64}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'float-gentle 3s ease-in-out infinite' }}
    >
      <style>{`
        .mascot-eye-left, .mascot-eye-right {
          animation: blink 4s ease-in-out infinite;
          transform-origin: center;
        }
        .mascot-eye-right {
          animation-delay: 0.1s;
        }
      `}</style>
      {/* Face circle */}
      <circle cx="32" cy="32" r="28" fill="#ff8c42" opacity="0.15" />
      <circle cx="32" cy="32" r="24" fill="#ff6b35" opacity="0.2" />
      <circle cx="32" cy="32" r="20" fill="#fffbf5" stroke="#ff6b35" strokeWidth="2" />
      {/* Eyes */}
      <ellipse className="mascot-eye-left" cx="25" cy="28" rx="2.5" ry="3" fill="#1a1a2e" />
      <ellipse className="mascot-eye-right" cx="39" cy="28" rx="2.5" ry="3" fill="#1a1a2e" />
      {/* Eye highlights */}
      <circle cx="26" cy="27" r="1" fill="white" />
      <circle cx="40" cy="27" r="1" fill="white" />
      {/* Cheeks */}
      <circle cx="20" cy="35" r="3" fill="#ff6b35" opacity="0.15" />
      <circle cx="44" cy="35" r="3" fill="#ff6b35" opacity="0.15" />
      {/* Smile */}
      <path
        d="M24 36 Q32 44 40 36"
        stroke="#ff6b35"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
