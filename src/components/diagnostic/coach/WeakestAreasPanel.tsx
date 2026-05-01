'use client';

import type { CognitiveRiskMap } from '@/types';

const DIMENSION_LABELS: Record<string, string> = {
  analyticalReasoning: 'Analytical Reasoning',
  communicationClarity: 'Communication Clarity',
  technicalDepth: 'Technical Depth',
  adaptability: 'Adaptability',
  problemStructuring: 'Problem Structuring',
};

interface WeakestAreasPanelProps {
  cognitiveRiskMap?: CognitiveRiskMap;
}

export function WeakestAreasPanel({ cognitiveRiskMap }: WeakestAreasPanelProps) {
  if (!cognitiveRiskMap) {
    return (
      <Card title="Weakest Areas" subtitle="Where to focus first">
        <p className="text-sm text-[var(--text-muted)]">
          Cognitive risk map isn&apos;t available for this report yet.
        </p>
      </Card>
    );
  }

  const sorted = Object.entries(cognitiveRiskMap.dimensions)
    .map(([key, value]) => ({ key, value: value as number }))
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);

  return (
    <Card
      title="Weakest Areas"
      subtitle="Your lowest-scoring cognitive dimensions — work these first."
    >
      <div className="space-y-4">
        {sorted.map((dim, idx) => {
          const pct = Math.round(dim.value * 100);
          const tone = pct < 40 ? 'danger' : pct < 65 ? 'warning' : 'success';
          const barColor =
            tone === 'danger'
              ? 'bg-[var(--color-danger)]'
              : tone === 'warning'
                ? 'bg-[var(--color-warning)]'
                : 'bg-[var(--color-success)]';
          return (
            <div key={dim.key}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-xs font-mono text-[var(--text-muted)]">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {DIMENSION_LABELS[dim.key] ?? dim.key}
                  </span>
                </div>
                <span className="font-mono text-[var(--text-secondary)]">{pct}</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                <div
                  className={`${barColor} h-full rounded-full transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
      <div className="px-6 pt-4 pb-2 border-b border-[var(--border-default)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        {subtitle && <p className="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
