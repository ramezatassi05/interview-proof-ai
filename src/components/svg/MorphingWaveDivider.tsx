'use client';

export function MorphingWaveDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ lineHeight: 0 }}>
      <svg
        viewBox="0 0 960 200"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: '160px', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#ff8c42" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#2ec4b6" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="line-top" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#ff8c42" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#2ec4b6" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="line-bottom" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2ec4b6" stopOpacity="0.3" />
            <stop offset="45%" stopColor="#ff8c42" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff6b35" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <style>{`
          .line-top {
            animation: line-top-morph 12s ease-in-out infinite;
          }
          .line-bottom {
            animation: line-bottom-morph 15s ease-in-out infinite;
          }
          .line-fill {
            animation: line-fill-morph 12s ease-in-out infinite;
          }
          @keyframes line-top-morph {
            0%, 100% {
              d: path('M0,72 S90,20 180,55 S300,8 400,48 S520,10 600,62 S720,18 800,42 S900,25 960,38');
            }
            33% {
              d: path('M0,48 S100,70 200,30 S320,65 420,18 S530,60 640,35 S750,68 840,22 S920,55 960,45');
            }
            66% {
              d: path('M0,60 S85,12 190,58 S310,22 410,65 S510,8 630,50 S740,15 830,55 S910,30 960,48');
            }
          }
          @keyframes line-bottom-morph {
            0%, 100% {
              d: path('M0,148 S95,128 190,152 S310,118 420,145 S530,122 630,155 S740,120 840,142 S920,130 960,138');
            }
            33% {
              d: path('M0,138 S90,158 200,130 S320,155 430,125 S540,152 640,128 S750,155 850,132 S930,148 960,142');
            }
            66% {
              d: path('M0,155 S100,125 210,148 S330,122 430,152 S520,128 620,148 S730,118 840,150 S920,135 960,145');
            }
          }
          @keyframes line-fill-morph {
            0%, 100% {
              d: path('M0,72 S90,20 180,55 S300,8 400,48 S520,10 600,62 S720,18 800,42 S900,25 960,38 L960,138 S920,130 840,142 S740,120 630,155 S530,122 420,145 S310,118 190,152 S95,128 0,148 Z');
            }
            33% {
              d: path('M0,48 S100,70 200,30 S320,65 420,18 S530,60 640,35 S750,68 840,22 S920,55 960,45 L960,142 S930,148 850,132 S750,155 640,128 S540,152 430,125 S320,155 200,130 S90,158 0,138 Z');
            }
            66% {
              d: path('M0,60 S85,12 190,58 S310,22 410,65 S510,8 630,50 S740,15 830,55 S910,30 960,48 L960,145 S920,135 840,150 S730,118 620,148 S520,128 430,152 S330,122 210,148 S100,125 0,155 Z');
            }
          }
        `}</style>
        {/* Fill between the two lines */}
        <path
          className="line-fill"
          d="M0,72 S90,20 180,55 S300,8 400,48 S520,10 600,62 S720,18 800,42 S900,25 960,38 L960,138 S920,130 840,142 S740,120 630,155 S530,122 420,145 S310,118 190,152 S95,128 0,148 Z"
          fill="url(#wave-gradient)"
        />
        {/* Top line — smooth analytical graph */}
        <path
          className="line-top"
          d="M0,72 S90,20 180,55 S300,8 400,48 S520,10 600,62 S720,18 800,42 S900,25 960,38"
          fill="none"
          stroke="url(#line-top)"
          strokeWidth="2.5"
        />
        {/* Bottom line — gentler graph */}
        <path
          className="line-bottom"
          d="M0,148 S95,128 190,152 S310,118 420,145 S530,122 630,155 S740,120 840,142 S920,130 960,138"
          fill="none"
          stroke="url(#line-bottom)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
