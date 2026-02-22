'use client';

export function MorphingWaveDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ lineHeight: 0 }}>
      <svg
        viewBox="0 0 480 80"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: '60px', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ff8c42" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2ec4b6" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <style>{`
          .wave-path {
            animation: wave-morph-soft 8s ease-in-out infinite;
          }
          @keyframes wave-morph-soft {
            0%, 100% {
              d: path('M0,40 C60,20 120,55 180,40 C240,25 300,55 360,40 C420,25 450,50 480,40 L480,80 L0,80 Z');
            }
            33% {
              d: path('M0,30 C60,50 120,20 180,45 C240,30 300,50 360,35 C420,45 450,25 480,35 L480,80 L0,80 Z');
            }
            66% {
              d: path('M0,45 C60,25 120,50 180,30 C240,50 300,25 360,45 C420,30 450,45 480,45 L480,80 L0,80 Z');
            }
          }
        `}</style>
        <path
          className="wave-path"
          d="M0,40 C60,20 120,55 180,40 C240,25 300,55 360,40 C420,25 450,50 480,40 L480,80 L0,80 Z"
          fill="url(#wave-gradient)"
        />
      </svg>
    </div>
  );
}
