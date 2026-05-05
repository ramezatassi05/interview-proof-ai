import type { ReactElement, SVGProps } from 'react';

export type SkillIconName =
  | 'brain'
  | 'mail'
  | 'clock'
  | 'list'
  | 'chart'
  | 'pen'
  | 'megaphone'
  | 'book'
  | 'eye'
  | 'dollar'
  | 'pie'
  | 'calculator'
  | 'note'
  | 'alert'
  | 'rocket'
  | 'pulse'
  | 'folder'
  | 'doc';

const COMMON: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function SkillIcon({ name, className = 'h-3.5 w-3.5' }: { name?: string; className?: string }) {
  const Icon = ICONS[(name ?? 'doc') as SkillIconName] ?? ICONS.doc;
  return <Icon {...COMMON} className={className} />;
}

const ICONS: Record<SkillIconName, (p: SVGProps<SVGSVGElement>) => ReactElement> = {
  brain: (p) => (
    <svg {...p}>
      <path d="M6 3a2 2 0 0 0-2 2v.5A2 2 0 0 0 3 7.5v1A2 2 0 0 0 4 10v.5A2 2 0 0 0 6 13a1.5 1.5 0 0 0 1.5-1.5V4.5A1.5 1.5 0 0 0 6 3Z" />
      <path d="M10 3a2 2 0 0 1 2 2v.5A2 2 0 0 1 13 7.5v1A2 2 0 0 1 12 10v.5A2 2 0 0 1 10 13a1.5 1.5 0 0 1-1.5-1.5V4.5A1.5 1.5 0 0 1 10 3Z" />
    </svg>
  ),
  mail: (p) => (
    <svg {...p}>
      <rect x="2" y="4" width="12" height="9" rx="1" />
      <path d="m2.5 5 5.5 4 5.5-4" />
    </svg>
  ),
  clock: (p) => (
    <svg {...p}>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 1.5" />
    </svg>
  ),
  list: (p) => (
    <svg {...p}>
      <path d="M5 4h8M5 8h8M5 12h8" />
      <circle cx="2.5" cy="4" r=".6" fill="currentColor" />
      <circle cx="2.5" cy="8" r=".6" fill="currentColor" />
      <circle cx="2.5" cy="12" r=".6" fill="currentColor" />
    </svg>
  ),
  chart: (p) => (
    <svg {...p}>
      <path d="M3 13V3M3 13h10" />
      <path d="M5 11V8M8 11V6M11 11V9" />
    </svg>
  ),
  pen: (p) => (
    <svg {...p}>
      <path d="m3 13 2-.5 7.5-7.5-1.5-1.5L3.5 11l-.5 2Z" />
      <path d="m10 4 2 2" />
    </svg>
  ),
  megaphone: (p) => (
    <svg {...p}>
      <path d="M3 6v4l8 3V3L3 6Z" />
      <path d="M3 6H2.5A1.5 1.5 0 0 0 1 7.5v1A1.5 1.5 0 0 0 2.5 10H3" />
      <path d="M5.5 10v2a1 1 0 0 0 1 1H7" />
    </svg>
  ),
  book: (p) => (
    <svg {...p}>
      <path d="M3 3h7a2 2 0 0 1 2 2v8H5a2 2 0 0 1-2-2V3Z" />
      <path d="M3 11a2 2 0 0 1 2-2h7" />
    </svg>
  ),
  eye: (p) => (
    <svg {...p}>
      <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
      <circle cx="8" cy="8" r="1.7" />
    </svg>
  ),
  dollar: (p) => (
    <svg {...p}>
      <path d="M8 2v12" />
      <path d="M11 5H6.5a1.5 1.5 0 0 0 0 3h3a1.5 1.5 0 0 1 0 3H5" />
    </svg>
  ),
  pie: (p) => (
    <svg {...p}>
      <path d="M8 2.5v5.5h5.5A5.5 5.5 0 0 0 8 2.5Z" />
      <path d="M8 8 4.5 12.4A5.5 5.5 0 1 0 8 2.5" />
    </svg>
  ),
  calculator: (p) => (
    <svg {...p}>
      <rect x="3" y="2" width="10" height="12" rx="1" />
      <path d="M5 4h6v2H5z" fill="currentColor" stroke="none" />
      <path d="M5.5 9h.5M8 9h.5M10.5 9h.5M5.5 11.5h.5M8 11.5h.5M10.5 11.5h.5" />
    </svg>
  ),
  note: (p) => (
    <svg {...p}>
      <path d="M4 2h6l3 3v9H4V2Z" />
      <path d="M10 2v3h3" />
      <path d="M6 8h4M6 11h4" />
    </svg>
  ),
  alert: (p) => (
    <svg {...p}>
      <path d="M8 2 1.5 13h13L8 2Z" />
      <path d="M8 6.5v3M8 11.2v.3" />
    </svg>
  ),
  rocket: (p) => (
    <svg {...p}>
      <path d="M9.5 2.5C12 4 13.5 6 13.5 9c0 1-.3 2-.7 2.7l-2-1L9 13.5 7 11.5 5 12.5 4 10.5l-1-2C3.7 8 4.7 7.7 5 7.5c.5-.3 1-1 1.5-1.5C8 4.5 9.5 2.5 9.5 2.5Z" />
      <circle cx="9.5" cy="6.5" r="1.1" />
    </svg>
  ),
  pulse: (p) => (
    <svg {...p}>
      <path d="M1.5 8h3l1.5-3 2.5 6 1.5-3h4.5" />
    </svg>
  ),
  folder: (p) => (
    <svg {...p}>
      <path d="M2 4.5V12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H8L6.5 3.5H3a1 1 0 0 0-1 1Z" />
    </svg>
  ),
  doc: (p) => (
    <svg {...p}>
      <path d="M4 2h6l3 3v9H4V2Z" />
      <path d="M10 2v3h3" />
    </svg>
  ),
};
