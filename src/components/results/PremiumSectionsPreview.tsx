'use client';

import { SectionHeader } from '@/components/diagnostic/SectionHeader';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/Button';
import { LockedSection } from './LockedSection';

interface PremiumSectionsPreviewProps {
  reportId: string;
  companyName?: string;
  totalRisks: number;
  onUnlockClick: () => void;
}

/* ------------------------------------------------------------------ */
/*  Inline mini-CTA inserted between locked sections                  */
/* ------------------------------------------------------------------ */
function MiniCTA({
  viewed,
  total,
  onUnlockClick,
}: {
  viewed: number;
  total: number;
  onUnlockClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-sm text-[var(--text-secondary)]">
        You&apos;ve previewed{' '}
        <span className="font-semibold text-[var(--text-primary)]">{viewed}</span> of{' '}
        <span className="font-semibold text-[var(--text-primary)]">{total}</span> premium sections
      </p>
      <Button variant="accent" size="sm" onClick={onUnlockClick} className="rounded-lg">
        Unlock All Sections
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock skeleton builders — blur makes exact content unreadable       */
/* ------------------------------------------------------------------ */

function MockPriorityActions({}: MockSectionProps) {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)]/15 text-xs font-bold text-[var(--accent-primary)]">
            {i}
          </span>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-[var(--text-muted)]/20" />
            <div className="h-3 w-full rounded bg-[var(--text-muted)]/10" />
            <div className="h-3 w-1/2 rounded bg-[var(--text-muted)]/10" />
          </div>
          <span className="rounded-full bg-[var(--color-danger)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-danger)]">
            High
          </span>
        </div>
      ))}
    </div>
  );
}

function MockSignalStrength({}: MockSectionProps) {
  const signals = [
    { label: 'Hard Skills Match', pct: 72, weight: '35%' },
    { label: 'Evidence Depth', pct: 58, weight: '25%' },
    { label: 'Round Readiness', pct: 64, weight: '20%' },
    { label: 'Communication', pct: 81, weight: '10%' },
    { label: 'Company Proxy', pct: 45, weight: '10%' },
  ];
  return (
    <div className="space-y-4">
      {signals.map((s) => (
        <div key={s.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-primary)]">{s.label}</span>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {s.pct}% &middot; wt {s.weight}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--text-muted)]/15">
            <div
              className="h-full rounded-full bg-[var(--accent-primary)]"
              style={{ width: `${s.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MockHireZone({}: MockSectionProps) {
  return (
    <div className="space-y-5">
      {/* Gauge */}
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 200 110" className="h-28 w-56">
          <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--border-default)" strokeWidth="14" strokeLinecap="round" />
          <path d="M20 100 A80 80 0 0 1 130 30" fill="none" stroke="var(--accent-primary)" strokeWidth="14" strokeLinecap="round" opacity="0.6" />
          <circle cx="130" cy="30" r="6" fill="var(--accent-primary)" />
          <text x="100" y="90" textAnchor="middle" fontSize="22" fontWeight="bold" fill="var(--text-primary)">68</text>
          <text x="100" y="105" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Hire Zone Score</text>
        </svg>
      </div>
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Skill Fit', value: 72 },
          { label: 'Culture Fit', value: 65 },
          { label: 'Growth Signal', value: 58 },
          { label: 'Risk Level', value: 81 },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-3 text-center">
            <div className="text-lg font-bold text-[var(--text-primary)]">{m.value}%</div>
            <div className="text-xs text-[var(--text-muted)]">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const COGNITIVE_PCTS = [0.72, 0.55, 0.68, 0.45, 0.62];

function MockCognitiveMap({}: MockSectionProps) {
  // Pentagon radar chart
  const dims = ['Technical', 'Communication', 'Problem Solving', 'Leadership', 'Adaptability'];
  const cx = 100,
    cy = 100,
    r = 70;
  const points = dims.map((_, i) => {
    const angle = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
    const pct = COGNITIVE_PCTS[i];
    return {
      x: cx + r * pct * Math.cos(angle),
      y: cy + r * pct * Math.sin(angle),
      lx: cx + (r + 20) * Math.cos(angle),
      ly: cy + (r + 20) * Math.sin(angle),
      label: dims[i],
    };
  });
  const poly = points.map((p) => `${p.x},${p.y}`).join(' ');
  const gridPoints = (scale: number) =>
    dims
      .map((_, i) => {
        const angle = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
        return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`;
      })
      .join(' ');

  return (
    <div className="flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="h-52 w-52">
        {[1, 0.75, 0.5, 0.25].map((s) => (
          <polygon key={s} points={gridPoints(s)} fill="none" stroke="var(--border-default)" strokeWidth="0.5" />
        ))}
        <polygon points={poly} fill="var(--accent-primary)" fillOpacity="0.15" stroke="var(--accent-primary)" strokeWidth="1.5" />
        {points.map((p) => (
          <text key={p.label} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="var(--text-muted)">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function MockRedFlags({ count = 6 }: MockSectionProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger)]/15">
            <svg className="h-3.5 w-3.5 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-2/3 rounded bg-[var(--text-muted)]/20" />
            <div className="h-3 w-full rounded bg-[var(--text-muted)]/10" />
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: i < 2 ? 'var(--color-danger)' : 'var(--color-warning)',
              color: 'white',
              opacity: 0.7,
            }}
          >
            {i < 2 ? 'Critical' : 'Medium'}
          </span>
        </div>
      ))}
    </div>
  );
}

function MockQuestions({}: MockSectionProps) {
  return (
    <div className="space-y-3">
      {['Tell me about a time you led a cross-functional project...', 'How would you design a system that handles...', 'Walk me through your approach to debugging a...'].map(
        (q, i) => (
          <div key={i} className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
            <p className="text-sm text-[var(--text-primary)]">{q}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-8 w-28 rounded-lg bg-[var(--accent-primary)]/15 flex items-center justify-center text-xs font-medium text-[var(--accent-primary)]">
                Record Answer
              </div>
              <div className="h-8 w-24 rounded-lg bg-[var(--text-muted)]/10 flex items-center justify-center text-xs text-[var(--text-muted)]">
                Best Answer
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function MockExecutionRoadmap({}: MockSectionProps) {
  const days = ['Day 1-2', 'Day 3-5', 'Day 6-7', 'Day 8-10'];
  return (
    <div className="space-y-4">
      {days.map((day, i) => (
        <div key={day} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)]/15 text-xs font-bold text-[var(--accent-primary)]">
              {i + 1}
            </div>
            {i < days.length - 1 && <div className="w-px flex-1 bg-[var(--border-default)]" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="text-sm font-semibold text-[var(--text-primary)]">{day}</div>
            <div className="mt-2 space-y-1.5">
              <div className="h-3 w-full rounded bg-[var(--text-muted)]/15" />
              <div className="h-3 w-4/5 rounded bg-[var(--text-muted)]/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockRecruiterView({}: MockSectionProps) {
  return (
    <div className="space-y-4">
      {/* Verdict badge */}
      <div className="flex justify-center">
        <div className="rounded-full bg-[var(--color-warning)]/15 border border-[var(--color-warning)]/30 px-5 py-2 text-sm font-semibold text-[var(--color-warning)]">
          Verdict: Conditional Advance
        </div>
      </div>
      {/* Two-column cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 p-4">
          <div className="mb-2 text-xs font-semibold uppercase text-[var(--color-danger)]">Red Flags</div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 rounded bg-[var(--color-danger)]/15" style={{ width: `${70 + i * 8}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 p-4">
          <div className="mb-2 text-xs font-semibold uppercase text-[var(--color-success)]">Strengths</div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 rounded bg-[var(--color-success)]/15" style={{ width: `${65 + i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockPracticeIntel({}: MockSectionProps) {
  const dims = ['Sync Score', 'Pressure Index', 'Consistency', 'Momentum'];
  return (
    <div className="space-y-4">
      {/* Score circles */}
      <div className="flex justify-center gap-6">
        {[72, 58, 65].map((score, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--accent-primary)]/40">
              <span className="text-lg font-bold text-[var(--text-primary)]">{score}</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">
              {['Sync', 'Rx', 'Pressure'][i]}
            </span>
          </div>
        ))}
      </div>
      {/* Dimension bars */}
      <div className="space-y-3">
        {dims.map((d, i) => {
          const pct = [62, 48, 71, 55][i];
          return (
            <div key={d} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">{d}</span>
                <span className="font-mono text-[var(--text-muted)]">{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--text-muted)]/15">
                <div className="h-full rounded-full bg-[var(--accent-primary)]/60" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

interface MockSectionProps {
  count?: number;
}

interface SectionDef {
  number: string;
  title: string;
  blur: 'light' | 'medium' | 'heavy';
  Component: React.ComponentType<MockSectionProps>;
}

const SECTIONS: SectionDef[] = [
  { number: '01', title: 'Priority Actions', blur: 'light', Component: MockPriorityActions },
  { number: '03', title: 'Signal Strength', blur: 'light', Component: MockSignalStrength },
  { number: '04', title: 'Hire Zone', blur: 'medium', Component: MockHireZone },
  { number: '10', title: 'Cognitive Map', blur: 'medium', Component: MockCognitiveMap },
  { number: '06', title: 'All Red Flags', blur: 'medium', Component: MockRedFlags },
  { number: '07', title: 'Practice Questions', blur: 'heavy', Component: MockQuestions },
  { number: '08', title: 'Execution Roadmap', blur: 'heavy', Component: MockExecutionRoadmap },
  { number: '11', title: 'Recruiter View', blur: 'heavy', Component: MockRecruiterView },
  { number: '12', title: 'Practice Intelligence', blur: 'heavy', Component: MockPracticeIntel },
];

const TOTAL_PREMIUM = 13;

export function PremiumSectionsPreview({
  totalRisks,
  onUnlockClick,
}: PremiumSectionsPreviewProps) {
  return (
    <div className="space-y-6">
      {SECTIONS.map((section, index) => (
        <div key={section.number}>
          <BlurFade inView delay={index * 0.05}>
            <SectionHeader number={section.number} title={section.title} />
            <LockedSection
              title={section.title}
              sectionNumber={section.number}
              blurIntensity={section.blur}
              onUnlockClick={onUnlockClick}
            >
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6">
                <section.Component count={totalRisks} />
              </div>
            </LockedSection>
          </BlurFade>

          {/* Mini CTA after every 3rd section */}
          {(index + 1) % 3 === 0 && index < SECTIONS.length - 1 && (
            <MiniCTA viewed={index + 1} total={TOTAL_PREMIUM} onUnlockClick={onUnlockClick} />
          )}
        </div>
      ))}
    </div>
  );
}
