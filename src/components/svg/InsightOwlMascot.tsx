'use client';

import { useId, type CSSProperties } from 'react';

interface OwlProps {
  className?: string;
  size?: number;
}

/* ── Gradients & filters ── */

function OwlDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#312E81" />
      </linearGradient>
      <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4338CA" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </linearGradient>
      <linearGradient id={`${id}-chest`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E0E7FF" />
        <stop offset="100%" stopColor="#C7D2FE" />
      </linearGradient>
      <radialGradient id={`${id}-disc`} cx="50%" cy="45%" r="50%">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="70%" stopColor="#C7D2FE" />
        <stop offset="100%" stopColor="#A5B4FC" />
      </radialGradient>
    </defs>
  );
}

/* ── Full owl body — contoured silhouette with chest + feather layers ── */

function OwlBody({ id }: { id: string }) {
  return (
    <g>
      {/* Main body silhouette — pear/bell shape */}
      <path
        d="M64 10
           C44 10 30 24 30 44
           C30 56 34 62 34 68
           C34 82 38 96 42 108
           C44 114 52 118 64 118
           C76 118 84 114 86 108
           C90 96 94 82 94 68
           C94 62 98 56 98 44
           C98 24 84 10 64 10 Z"
        fill={`url(#${id}-body)`}
      />

      {/* Chest / belly — lighter heart-shaped area */}
      <path
        d="M64 58
           C54 58 46 64 46 74
           C46 88 54 102 64 110
           C74 102 82 88 82 74
           C82 64 74 58 64 58 Z"
        fill={`url(#${id}-chest)`}
      />

      {/* Chest feather pattern — V-shaped markings */}
      <g opacity="0.3" stroke="#818CF8" strokeWidth="0.8" fill="none">
        <path d="M58 70 L64 74 L70 70" />
        <path d="M56 78 L64 82 L72 78" />
        <path d="M57 86 L64 90 L71 86" />
        <path d="M58 94 L64 98 L70 94" />
      </g>

      {/* Shoulder feather scallops — left */}
      <g opacity="0.2" stroke="#818CF8" strokeWidth="0.7" fill="none">
        <path d="M36 60 Q40 56 44 60" />
        <path d="M34 68 Q38 64 42 68" />
        <path d="M35 76 Q39 72 43 76" />
      </g>
      {/* Shoulder feather scallops — right */}
      <g opacity="0.2" stroke="#818CF8" strokeWidth="0.7" fill="none">
        <path d="M84 60 Q88 56 92 60" />
        <path d="M86 68 Q90 64 94 68" />
        <path d="M85 76 Q89 72 93 76" />
      </g>
    </g>
  );
}

/* ── Facial disc + brow ridges + eyes + beak ── */

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
  const iR = Math.round(9 * eyeScale);
  const pR = Math.round(4.5 * eyeScale);
  const whiteR = iR + 2;

  const renderEye = (cx: number, cy: number, side: 'left' | 'right') => (
    <g key={side}>
      {/* Eye socket shadow */}
      <circle cx={cx} cy={cy} r={whiteR + 2} fill="#312E81" opacity="0.3" />
      {/* Eye white */}
      <circle cx={cx} cy={cy} r={whiteR} fill="#FEFCE8" />
      <g style={scanAnim ? { animation: 'owl-read-scan 3s ease-in-out infinite', animationDelay: side === 'right' ? '0.15s' : '0s' } : undefined}>
        {/* Iris */}
        <circle cx={cx + gazeX} cy={cy + gazeY} r={iR} fill="#F59E0B" />
        {/* Iris detail ring */}
        <circle cx={cx + gazeX} cy={cy + gazeY} r={iR - 2} fill="none" stroke="#D97706" strokeWidth="0.5" opacity="0.4" />
        {/* Pupil */}
        <circle cx={cx + gazeX} cy={cy + gazeY} r={pR} fill="#0F0A2A" />
        {/* Specular highlights */}
        <circle cx={cx + gazeX + 2.5} cy={cy + gazeY - 2.5} r={2} fill="white" opacity="0.9" />
        <circle cx={cx + gazeX - 1} cy={cy + gazeY + 1.5} r={1} fill="white" opacity="0.4" />
      </g>
      {/* Blink eyelid */}
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
      {/* Drowsy lid */}
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
          <circle cx="51" cy="40" r={whiteR} />
        </clipPath>
        <clipPath id={`${id}-clip-r`}>
          <circle cx="77" cy="40" r={whiteR} />
        </clipPath>
      </defs>

      {/* Facial disc — the flat, heart-shaped face typical of owls */}
      <path
        d="M64 22
           C48 22 36 30 36 42
           C36 52 46 58 64 58
           C82 58 92 52 92 42
           C92 30 80 22 64 22 Z"
        fill={`url(#${id}-disc)`}
      />
      {/* Disc edge feather rim */}
      <path
        d="M64 22
           C48 22 36 30 36 42
           C36 52 46 58 64 58
           C82 58 92 52 92 42
           C92 30 80 22 64 22 Z"
        fill="none"
        stroke="#A5B4FC"
        strokeWidth="1.2"
        opacity="0.5"
      />
      {/* Inner disc V-line (nasal ridge) */}
      <path d="M64 30 L64 50" stroke="#A5B4FC" strokeWidth="0.6" opacity="0.3" />

      {/* Brow ridges — the stern overhanging brow that gives owls their intense look */}
      <path d="M38 34 Q44 28 54 32" fill="#3730A3" opacity="0.6" />
      <path d="M90 34 Q84 28 74 32" fill="#3730A3" opacity="0.6" />

      {/* Eyes */}
      {renderEye(51, 40, 'left')}
      {renderEye(77, 40, 'right')}

      {/* Beak — small hooked shape */}
      {beakOpen ? (
        <g>
          <path d="M61 51 L64 48 L67 51" fill="#7C3AED" />
          <path d="M62 51 L64 55 L66 51" fill="#6D28D9" opacity="0.8" />
        </g>
      ) : (
        <path d="M61 50 Q64 46 67 50 Q64 56 61 50 Z" fill="#7C3AED" />
      )}
      {/* Beak highlight */}
      <path d="M63 49 Q64 47.5 65 49" fill="none" stroke="#A78BFA" strokeWidth="0.5" opacity="0.6" />
    </g>
  );
}

/* ── Ear tufts — tall feathered horns ── */

function OwlTufts({ id }: { id: string }) {
  return (
    <g>
      {/* Left tuft — 3 layered feather spikes */}
      <path d="M42 18 Q36 6 34 -2 Q42 6 46 16" fill={`url(#${id}-body)`} />
      <path d="M44 20 Q40 10 38 2 Q44 10 47 18" fill="#818CF8" opacity="0.6" />
      <path d="M46 22 Q44 14 42 6 Q46 12 48 20" fill="#A5B4FC" opacity="0.3" />

      {/* Right tuft — mirrored */}
      <path d="M86 18 Q92 6 94 -2 Q86 6 82 16" fill={`url(#${id}-body)`} />
      <path d="M84 20 Q88 10 90 2 Q84 10 81 18" fill="#818CF8" opacity="0.6" />
      <path d="M82 22 Q84 14 86 6 Q82 12 80 20" fill="#A5B4FC" opacity="0.3" />
    </g>
  );
}

/* ── Wing with layered feathers ── */

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
  /* Main wing silhouettes */
  const paths: Record<string, Record<string, string>> = {
    resting: {
      left:  'M36 58 C28 66 22 80 24 96 C25 102 30 104 34 100 C38 94 40 82 40 72 Z',
      right: 'M92 58 C100 66 106 80 104 96 C103 102 98 104 94 100 C90 94 88 82 88 72 Z',
    },
    raised: {
      left:  'M36 58 C26 46 18 30 14 18 C14 12 18 14 22 20 C28 32 34 48 38 56 Z',
      right: 'M92 58 C102 46 110 30 114 18 C114 12 110 14 106 20 C100 32 94 48 90 56 Z',
    },
    chin: {
      left:  'M36 58 C28 54 28 46 32 40 C36 36 42 40 42 48 C42 54 40 58 38 60 Z',
      right: 'M92 58 C100 54 100 46 96 40 C92 36 86 40 86 48 C86 54 88 58 90 60 Z',
    },
    holding: {
      left:  'M36 62 C30 70 30 82 34 92 C36 96 42 94 42 88 C42 80 40 72 38 66 Z',
      right: 'M92 62 C98 70 98 82 94 92 C92 96 86 94 86 88 C86 80 88 72 90 66 Z',
    },
  };

  /* Primary feather tips at wing edge */
  const featherTips: Record<string, Record<string, string[]>> = {
    resting: {
      left: [
        'M24 94 C22 96 24 100 28 100',
        'M26 90 C23 92 24 96 28 96',
        'M28 86 C25 88 26 92 30 92',
      ],
      right: [
        'M104 94 C106 96 104 100 100 100',
        'M102 90 C105 92 104 96 100 96',
        'M100 86 C103 88 102 92 98 92',
      ],
    },
    raised: {
      left: [
        'M16 22 C13 18 14 14 18 16',
        'M18 26 C14 22 16 18 20 20',
      ],
      right: [
        'M112 22 C115 18 114 14 110 16',
        'M110 26 C114 22 112 18 108 20',
      ],
    },
    chin: {
      left:  ['M32 42 C30 38 34 36 36 38'],
      right: ['M96 42 C98 38 94 36 92 38'],
    },
    holding: {
      left:  ['M34 90 C32 92 34 96 38 94'],
      right: ['M94 90 C96 92 94 96 90 94'],
    },
  };

  /* Covert feather lines along the wing */
  const coverts: Record<string, Record<string, string[]>> = {
    resting: {
      left: [
        'M34 66 C30 72 28 80 28 88',
        'M36 70 C32 76 30 84 30 90',
      ],
      right: [
        'M94 66 C98 72 100 80 100 88',
        'M92 70 C96 76 98 84 98 90',
      ],
    },
    raised: {
      left:  ['M30 44 C26 36 22 28 20 22'],
      right: ['M98 44 C102 36 106 28 108 22'],
    },
    chin: {
      left:  ['M36 50 C32 46 32 42 34 40'],
      right: ['M92 50 C96 46 96 42 94 40'],
    },
    holding: {
      left:  ['M38 70 C34 76 34 84 36 90'],
      right: ['M90 70 C94 76 94 84 92 90'],
    },
  };

  return (
    <g style={anim}>
      {/* Main wing shape */}
      <path d={paths[pose][side]} fill={`url(#${id}-wing)`} />
      {/* Feather tips — slightly lighter */}
      {featherTips[pose][side].map((d, i) => (
        <path key={`tip-${i}`} d={d} fill="none" stroke="#6366F1" strokeWidth="1" opacity={0.35 - i * 0.05} />
      ))}
      {/* Covert feather lines */}
      {coverts[pose][side].map((d, i) => (
        <path key={`cov-${i}`} d={d} fill="none" stroke="#818CF8" strokeWidth="0.6" opacity={0.25 - i * 0.05} />
      ))}
    </g>
  );
}

/* ── Talons — small feet at the bottom ── */

function OwlTalons() {
  return (
    <g>
      {/* Left foot */}
      <path d="M52 116 C50 118 48 122 46 124" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M54 116 C54 119 54 122 54 124" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M56 116 C58 118 59 121 60 124" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Right foot */}
      <path d="M72 116 C70 118 69 121 68 124" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M74 116 C74 119 74 122 74 124" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M76 116 C78 118 80 122 82 124" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </g>
  );
}

/* ── Tail feathers ── */

function OwlTail({ id }: { id: string }) {
  return (
    <g>
      <path d="M58 112 C56 118 54 124 56 128" fill={`url(#${id}-wing)`} opacity="0.7" />
      <path d="M64 114 C64 120 64 126 64 128" fill={`url(#${id}-wing)`} opacity="0.8" />
      <path d="M70 112 C72 118 74 124 72 128" fill={`url(#${id}-wing)`} opacity="0.7" />
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
      <circle cx="64" cy="64" r="56" fill="#6366F1" opacity="0.06" />
      <OwlTail id={id} />
      <OwlWing id={id} side="left" anim={{ animation: 'owl-wing-flutter 3s ease-in-out infinite' }} />
      <OwlWing id={id} side="right" anim={{ animation: 'owl-wing-flutter 3s ease-in-out infinite' }} />
      <OwlBody id={id} />
      <OwlTufts id={id} />
      <OwlFace id={id} blink />
      <OwlTalons />
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
      <OwlTail id={id} />
      <OwlWing id={id} side="left" />
      <OwlBody id={id} />
      <OwlTufts id={id} />
      <OwlFace id={id} eyeScale={1.1} blink beakOpen />
      <OwlWing id={id} side="right" pose="raised" anim={{ transformOrigin: '92px 58px', animation: 'owl-wave-v2 2s ease-in-out infinite' }} />
      <OwlTalons />
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
      {/* Thought bubbles */}
      <circle cx="104" cy="20" r="2.5" fill="#818CF8" opacity="0.4" />
      <circle cx="112" cy="12" r="3.5" fill="#818CF8" opacity="0.3" />
      <circle cx="120" cy="6" r="4.5" fill="#818CF8" opacity="0.2" />
      <OwlTail id={id} />
      <OwlWing id={id} side="right" />
      <OwlBody id={id} />
      <OwlTufts id={id} />
      <OwlFace id={id} gazeX={2} gazeY={-2} blink />
      <OwlWing id={id} side="left" pose="chin" />
      <OwlTalons />
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
      {/* Sparkle stars */}
      <g style={{ animation: 'owl-sparkle-v2 1.5s ease-in-out infinite', transformOrigin: '20px 8px' }}>
        <path d="M18 4 L20 0 L22 4 L26 6 L22 8 L20 12 L18 8 L14 6 Z" fill="#818CF8" opacity="0.8" />
      </g>
      <g style={{ animation: 'owl-sparkle-v2 1.5s ease-in-out infinite 0.5s', transformOrigin: '108px 4px' }}>
        <path d="M106 0 L108 -4 L110 0 L114 2 L110 4 L108 8 L106 4 L102 2 Z" fill="#A78BFA" opacity="0.8" />
      </g>
      <g style={{ animation: 'owl-sparkle-v2 1.5s ease-in-out infinite 1s', transformOrigin: '9px 32px' }}>
        <path d="M7 29 L9 26 L11 29 L14 31 L11 33 L9 36 L7 33 L4 31 Z" fill="#818CF8" opacity="0.6" />
      </g>
      <g style={{ animation: 'owl-sparkle-v2 1.5s ease-in-out infinite 0.75s', transformOrigin: '120px 30px' }}>
        <path d="M118 27 L120 24 L122 27 L125 29 L122 31 L120 34 L118 31 L115 29 Z" fill="#A78BFA" opacity="0.6" />
      </g>
      <OwlTail id={id} />
      <OwlBody id={id} />
      <OwlTufts id={id} />
      <OwlFace id={id} eyeScale={1.15} beakOpen />
      <OwlWing id={id} side="left" pose="raised" />
      <OwlWing id={id} side="right" pose="raised" />
      <OwlTalons />
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
      <OwlTail id={id} />
      <OwlBody id={id} />
      <OwlTufts id={id} />
      <OwlFace id={id} gazeY={3} lidHeight={8} scanAnim />
      <OwlWing id={id} side="left" pose="holding" />
      <OwlWing id={id} side="right" pose="holding" />
      {/* Clipboard */}
      <rect x="46" y="78" width="36" height="28" rx="3" fill="#E0E7FF" stroke="#A5B4FC" strokeWidth="1" />
      <rect x="56" y="75" width="16" height="5" rx="2" fill="#818CF8" opacity="0.7" />
      <line x1="52" y1="87" x2="76" y2="87" stroke="#C7D2FE" strokeWidth="0.8" />
      <line x1="52" y1="92" x2="72" y2="92" stroke="#C7D2FE" strokeWidth="0.8" />
      <line x1="52" y1="97" x2="68" y2="97" stroke="#C7D2FE" strokeWidth="0.8" />
      <OwlTalons />
    </svg>
  );
}
