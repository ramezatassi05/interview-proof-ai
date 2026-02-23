'use client';

import { useId, type CSSProperties } from 'react';

interface OwlProps {
  className?: string;
  size?: number;
}

/* ── 2 gradients: body + wing ── */

function OwlDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff7a47" />
        <stop offset="100%" stopColor="#ff6b35" />
      </linearGradient>
      <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ff7a47" />
        <stop offset="100%" stopColor="#e85d2c" />
      </linearGradient>
    </defs>
  );
}

/* ── Body pill + head circle + chest ellipse ── */

function OwlBase({ id }: { id: string }) {
  return (
    <g>
      <rect x="40" y="62" width="48" height="50" rx="22" fill={`url(#${id}-body)`} />
      <circle cx="64" cy="44" r="34" fill={`url(#${id}-body)`} />
      <ellipse cx="64" cy="88" rx="15" ry="18" fill="#fffbf5" />
    </g>
  );
}

/* ── Face disc + eyes + beak ── */

function OwlFace({
  id,
  gazeX = 0,
  gazeY = 0,
  eyeScale = 1,
  blink = false,
  beakOpen = false,
  lidHeight = 0,
  scanAnim = false,
}: {
  id: string;
  gazeX?: number;
  gazeY?: number;
  eyeScale?: number;
  blink?: boolean;
  beakOpen?: boolean;
  lidHeight?: number;
  scanAnim?: boolean;
}) {
  const iR = Math.round(10 * eyeScale);
  const pR = Math.round(5 * eyeScale);
  const whiteR = iR + 2;

  const renderEye = (cx: number, cy: number, side: 'left' | 'right') => (
    <g>
      <circle cx={cx} cy={cy} r={whiteR} fill="white" />
      <g style={scanAnim ? { animation: 'owl-read-scan 3s ease-in-out infinite', animationDelay: side === 'right' ? '0.15s' : '0s' } : undefined}>
        <circle cx={cx + gazeX} cy={cy + gazeY} r={iR} fill="#2ec4b6" />
        <circle cx={cx + gazeX} cy={cy + gazeY} r={pR} fill="#1a1a2e" />
        <circle cx={cx + gazeX + 3} cy={cy + gazeY - 3} r={2.5} fill="white" />
        <circle cx={cx + gazeX - 1.5} cy={cy + gazeY + 2} r={1.2} fill="white" opacity="0.6" />
      </g>
      {blink && (
        <g clipPath={`url(#${id}-clip-${side[0]})`}>
          <rect
            x={cx - whiteR - 2}
            y={cy - whiteR - 48}
            width={whiteR * 2 + 4}
            height={48}
            fill={`url(#${id}-body)`}
            style={{
              animation: 'owl-blink 5s ease-in-out infinite',
              animationDelay: side === 'right' ? '0.1s' : '0s',
            }}
          />
        </g>
      )}
      {lidHeight > 0 && (
        <g clipPath={`url(#${id}-clip-${side[0]})`}>
          <rect
            x={cx - whiteR - 2}
            y={cy - whiteR}
            width={whiteR * 2 + 4}
            height={lidHeight}
            fill={`url(#${id}-body)`}
            opacity="0.85"
          />
        </g>
      )}
    </g>
  );

  return (
    <g>
      <defs>
        <clipPath id={`${id}-clip-l`}>
          <circle cx="52" cy="44" r={whiteR} />
        </clipPath>
        <clipPath id={`${id}-clip-r`}>
          <circle cx="76" cy="44" r={whiteR} />
        </clipPath>
      </defs>
      <circle cx="64" cy="44" r="24" fill="#fffbf5" />
      {renderEye(52, 44, 'left')}
      {renderEye(76, 44, 'right')}
      {beakOpen ? (
        <g>
          <path d="M60 57 L64 61 L68 57" fill="#ff8c42" />
          <path d="M62 60 L64 65 L66 60" fill="#e07030" opacity="0.6" />
        </g>
      ) : (
        <path d="M60 58 L64 65 L68 58 Z" fill="#ff8c42" />
      )}
    </g>
  );
}

/* ── 2 smooth ear tufts ── */

function OwlTufts() {
  return (
    <g>
      <path d="M40 20 Q34 8 32 2 Q44 10 48 22" fill="#2ec4b6" />
      <path d="M88 20 Q94 8 96 2 Q84 10 80 22" fill="#2ec4b6" />
    </g>
  );
}

/* ── Single wing path, 4 pose variants ── */

function OwlWing({
  id,
  side,
  pose = 'resting',
  anim,
}: {
  id: string;
  side: 'left' | 'right';
  pose?: 'resting' | 'raised' | 'chin' | 'holding';
  anim?: CSSProperties;
}) {
  const paths: Record<string, Record<string, string>> = {
    resting: {
      left: 'M38 68 Q26 80 26 94 Q26 100 32 98 Q36 94 38 80 Z',
      right: 'M90 68 Q102 80 102 94 Q102 100 96 98 Q92 94 90 80 Z',
    },
    raised: {
      left: 'M38 66 Q24 50 18 30 Q16 22 22 24 Q28 34 34 52 Z',
      right: 'M90 66 Q104 50 110 30 Q112 22 106 24 Q100 34 94 52 Z',
    },
    chin: {
      left: 'M38 66 Q28 58 30 48 Q34 42 40 50 Q44 58 42 66 Z',
      right: 'M90 66 Q100 58 98 48 Q94 42 88 50 Q84 58 86 66 Z',
    },
    holding: {
      left: 'M38 68 Q30 76 32 88 Q34 92 40 88 Q42 82 40 74 Z',
      right: 'M90 68 Q98 76 96 88 Q94 92 88 88 Q86 82 88 74 Z',
    },
  };

  return (
    <g style={anim}>
      <path d={paths[pose][side]} fill={`url(#${id}-wing)`} opacity="0.9" />
    </g>
  );
}

/* ════════════════════════════════════════════════════
   1. InsightOwlMascot — Neutral / Floating
   ════════════════════════════════════════════════════ */

export function InsightOwlMascot({ className = '', size }: OwlProps) {
  const id = useId();
  return (
    <svg
      className={className}
      width={size ?? 64}
      height={size ?? 64}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'owl-bob 4s ease-in-out infinite' }}
    >
      <OwlDefs id={id} />
      <circle cx="64" cy="64" r="52" fill="#ff8c42" opacity="0.06" />
      <OwlTufts />
      <OwlWing id={id} side="left" anim={{ animation: 'owl-wing-flutter 3s ease-in-out infinite' }} />
      <OwlWing id={id} side="right" anim={{ animation: 'owl-wing-flutter 3s ease-in-out infinite' }} />
      <OwlBase id={id} />
      <OwlFace id={id} blink />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   2. InsightOwlWaving — Right wing raised, waving
   ════════════════════════════════════════════════════ */

export function InsightOwlWaving({ className = '', size }: OwlProps) {
  const id = useId();
  return (
    <svg
      className={className}
      width={size ?? 64}
      height={size ?? 64}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'owl-enter-v2 0.7s ease-out' }}
    >
      <OwlDefs id={id} />
      <OwlTufts />
      <OwlWing id={id} side="left" />
      <OwlBase id={id} />
      <OwlFace id={id} eyeScale={1.1} blink beakOpen />
      <OwlWing id={id} side="right" pose="raised" anim={{ transformOrigin: '90px 66px', animation: 'owl-wave-v2 2s ease-in-out infinite' }} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   3. InsightOwlThinking — Wing on chin, gaze up-right
   ════════════════════════════════════════════════════ */

export function InsightOwlThinking({ className = '', size }: OwlProps) {
  const id = useId();
  return (
    <svg
      className={className}
      width={size ?? 64}
      height={size ?? 64}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'owl-think-v2 4s ease-in-out infinite' }}
    >
      <OwlDefs id={id} />
      <circle cx="104" cy="20" r="2.5" fill="#2ec4b6" opacity="0.4" />
      <circle cx="112" cy="12" r="3.5" fill="#2ec4b6" opacity="0.3" />
      <circle cx="120" cy="6" r="4.5" fill="#2ec4b6" opacity="0.2" />
      <OwlTufts />
      <OwlWing id={id} side="right" />
      <OwlBase id={id} />
      <OwlFace id={id} gazeX={2} gazeY={-2} blink />
      <OwlWing id={id} side="left" pose="chin" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   4. InsightOwlCelebrating — Wings up, sparkle stars
   ════════════════════════════════════════════════════ */

export function InsightOwlCelebrating({ className = '', size }: OwlProps) {
  const id = useId();
  return (
    <svg
      className={className}
      width={size ?? 64}
      height={size ?? 64}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'owl-celebrate-v2 2.5s ease-in-out infinite' }}
    >
      <OwlDefs id={id} />
      <g style={{ animation: 'owl-sparkle-v2 1.5s ease-in-out infinite', transformOrigin: '20px 8px' }}>
        <path d="M18 4 L20 0 L22 4 L26 6 L22 8 L20 12 L18 8 L14 6 Z" fill="#2ec4b6" opacity="0.8" />
      </g>
      <g style={{ animation: 'owl-sparkle-v2 1.5s ease-in-out infinite 0.5s', transformOrigin: '108px 4px' }}>
        <path d="M106 0 L108 -4 L110 0 L114 2 L110 4 L108 8 L106 4 L102 2 Z" fill="#ff6b35" opacity="0.8" />
      </g>
      <g style={{ animation: 'owl-sparkle-v2 1.5s ease-in-out infinite 1s', transformOrigin: '9px 32px' }}>
        <path d="M7 29 L9 26 L11 29 L14 31 L11 33 L9 36 L7 33 L4 31 Z" fill="#2ec4b6" opacity="0.6" />
      </g>
      <g style={{ animation: 'owl-sparkle-v2 1.5s ease-in-out infinite 0.75s', transformOrigin: '120px 30px' }}>
        <path d="M118 27 L120 24 L122 27 L125 29 L122 31 L120 34 L118 31 L115 29 Z" fill="#ff8c42" opacity="0.6" />
      </g>
      <OwlTufts />
      <OwlBase id={id} />
      <OwlFace id={id} eyeScale={1.2} beakOpen />
      <OwlWing id={id} side="left" pose="raised" />
      <OwlWing id={id} side="right" pose="raised" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   5. InsightOwlReading — Wings holding clipboard, eyes scanning
   ════════════════════════════════════════════════════ */

export function InsightOwlReading({ className = '', size }: OwlProps) {
  const id = useId();
  return (
    <svg
      className={className}
      width={size ?? 64}
      height={size ?? 64}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'owl-perch-sway 6s ease-in-out infinite' }}
    >
      <OwlDefs id={id} />
      <OwlTufts />
      <OwlBase id={id} />
      <OwlFace id={id} gazeY={3} lidHeight={8} scanAnim />
      <OwlWing id={id} side="left" pose="holding" />
      <OwlWing id={id} side="right" pose="holding" />
      <rect x="46" y="76" width="36" height="30" rx="3" fill="#fffbf5" stroke="#e0d5c8" strokeWidth="1.2" />
      <rect x="56" y="73" width="16" height="6" rx="2" fill="#2ec4b6" opacity="0.7" />
      <line x1="52" y1="86" x2="76" y2="86" stroke="#e0d5c8" strokeWidth="1" />
      <line x1="52" y1="92" x2="72" y2="92" stroke="#e0d5c8" strokeWidth="1" />
      <line x1="52" y1="98" x2="68" y2="98" stroke="#e0d5c8" strokeWidth="1" />
    </svg>
  );
}
