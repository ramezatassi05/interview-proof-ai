'use client';

export function InsightOwlMascot({
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
      style={{ animation: 'float-gentle 3s ease-in-out infinite, head-tilt 6s ease-in-out infinite' }}
    >
      <style>{`
        .owl-eye-left, .owl-eye-right {
          animation: blink 4s ease-in-out infinite;
          transform-origin: center;
        }
        .owl-eye-right {
          animation-delay: 0.1s;
        }
      `}</style>

      {/* Outer glow */}
      <circle cx="32" cy="34" r="26" fill="#ff8c42" opacity="0.1" />

      {/* Body — rounded coral shape */}
      <ellipse cx="32" cy="36" rx="20" ry="22" fill="#ff6b35" opacity="0.2" />
      <ellipse cx="32" cy="36" rx="17" ry="19" fill="#ff6b35" />

      {/* Ear tufts — teal accents */}
      <path d="M16 20 L20 28 L13 26 Z" fill="#2ec4b6" opacity="0.85" />
      <path d="M48 20 L44 28 L51 26 Z" fill="#2ec4b6" opacity="0.85" />

      {/* Face disc — warm cream owl face */}
      <ellipse cx="32" cy="32" rx="13" ry="12" fill="#fffbf5" />

      {/* Eye rings — subtle depth */}
      <circle cx="26" cy="30" r="6" fill="#fff5eb" stroke="#ff6b35" strokeWidth="0.8" opacity="0.6" />
      <circle cx="38" cy="30" r="6" fill="#fff5eb" stroke="#ff6b35" strokeWidth="0.8" opacity="0.6" />

      {/* Eyes — large, expressive */}
      <ellipse className="owl-eye-left" cx="26" cy="30" rx="3" ry="3.5" fill="#1a1a2e" />
      <ellipse className="owl-eye-right" cx="38" cy="30" rx="3" ry="3.5" fill="#1a1a2e" />

      {/* Eye highlights — the analytical gleam */}
      <circle cx="27.5" cy="29" r="1.2" fill="white" />
      <circle cx="39.5" cy="29" r="1.2" fill="white" />
      <circle cx="25" cy="31" r="0.6" fill="white" opacity="0.6" />
      <circle cx="37" cy="31" r="0.6" fill="white" opacity="0.6" />

      {/* Brow lines — teal, gives the "studying you" look */}
      <path d="M21 26 Q26 24 30 26" stroke="#2ec4b6" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M34 26 Q38 24 43 26" stroke="#2ec4b6" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* Beak — small, subtle */}
      <path d="M30 36 L32 39 L34 36" fill="#ff8c42" stroke="#ff6b35" strokeWidth="0.5" strokeLinejoin="round" />

      {/* Chest feather detail — subtle V shapes */}
      <path d="M28 44 L32 47 L36 44" stroke="#fffbf5" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M26 48 L32 51 L38 48" stroke="#fffbf5" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.25" />
    </svg>
  );
}
