'use client';

import { Marquee } from '@/components/ui/marquee';
import { Badge } from '@/components/ui/Badge';
import { NumberTicker } from '@/components/ui/number-ticker';
import { cn } from '@/lib/utils';

const entries = [
  { role: 'SWE', company: 'Google', score: 78, risk: 'Medium' as const },
  { role: 'PM', company: 'Meta', score: 85, risk: 'Low' as const },
  { role: 'Data Eng', company: 'Amazon', score: 62, risk: 'High' as const },
  { role: 'Frontend', company: 'Stripe', score: 91, risk: 'Low' as const },
  { role: 'Backend', company: 'Netflix', score: 71, risk: 'Medium' as const },
  { role: 'ML Eng', company: 'OpenAI', score: 88, risk: 'Low' as const },
  { role: 'DevOps', company: 'Uber', score: 55, risk: 'High' as const },
  { role: 'SWE', company: 'Apple', score: 82, risk: 'Low' as const },
  { role: 'SRE', company: 'Datadog', score: 67, risk: 'Medium' as const },
  { role: 'Full Stack', company: 'Shopify', score: 74, risk: 'Medium' as const },
];

const firstRow = entries.slice(0, 5);
const secondRow = entries.slice(5);

type Risk = 'Low' | 'Medium' | 'High';

const riskVariant: Record<Risk, 'low' | 'medium' | 'high'> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

function DiagnosticCard({ role, company, score, risk }: (typeof entries)[number]) {
  return (
    <div
      className={cn(
        'relative w-64 rounded-2xl border border-[var(--border-default)]',
        'bg-[var(--bg-card)] p-4 overflow-hidden card-hover'
      )}
    >
      {/* Subtle neutral shimmer top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(150,150,150,0.3), transparent)',
        }}
      />

      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-[var(--text-primary)]">
            {score}
            <span className="text-sm font-normal text-[var(--text-muted)]">/100</span>
          </span>
          <Badge variant={riskVariant[risk]}>{risk} Risk</Badge>
        </div>
      </div>

      <div className="mt-3 text-sm font-medium text-[var(--text-primary)]">
        {role}
        <span className="mx-1.5 text-[var(--text-muted)]">@</span>
        <span className="text-[var(--text-secondary)]">{company}</span>
      </div>
    </div>
  );
}

export function LiveAnalysisFeed() {
  return (
    <section
      id="live-feed"
      className="border-y border-[var(--border-default)] bg-[var(--bg-secondary)] py-6"
    >
      <div className="relative flex flex-col gap-4">
        {/* Fade edge overlays */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--bg-secondary)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--bg-secondary)] to-transparent" />

        <Marquee pauseOnHover className="[--duration:35s]">
          {firstRow.map((entry) => (
            <DiagnosticCard key={`${entry.role}-${entry.company}`} {...entry} />
          ))}
        </Marquee>

        <Marquee reverse pauseOnHover className="[--duration:35s]">
          {secondRow.map((entry) => (
            <DiagnosticCard key={`${entry.role}-${entry.company}`} {...entry} />
          ))}
        </Marquee>
      </div>

      <div className="mt-6 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)]" />
          </span>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            <NumberTicker value={2847} className="text-[var(--text-secondary)]" /> diagnostics run
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
          <span className="font-mono text-xs text-[var(--text-muted)]">
            +<NumberTicker value={14} className="text-[var(--text-secondary)]" /> avg improvement
          </span>
        </div>
      </div>
    </section>
  );
}
