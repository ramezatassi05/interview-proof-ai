'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/layout/Container';
import type { AggregateInsightStats } from '@/types';

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toLocaleString();
}

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--color-success)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

const RISK_COLORS: Record<string, string> = {
  High: 'var(--color-danger)',
  Medium: 'var(--color-warning)',
  Low: 'var(--color-success)',
};

const ROUND_LABELS: Record<string, string> = {
  technical: 'Tech',
  behavioral: 'Behav',
  case: 'Case',
  finance: 'Fin',
  research: 'Res',
};

/** SVG horizontal bar showing score marker vs hire zone range */
function ScoreBar({ score }: { score: number }) {
  const hireZoneMin = 72;
  const hireZoneMax = 85;
  const barWidth = 160;
  const h = 24;
  const scoreX = (score / 100) * barWidth;
  const zoneStartX = (hireZoneMin / 100) * barWidth;
  const zoneWidth = ((hireZoneMax - hireZoneMin) / 100) * barWidth;

  return (
    <svg width={barWidth} height={h} className="mt-2">
      <rect x={0} y={10} width={barWidth} height={4} rx={2} fill="var(--track-bg)" />
      <rect
        x={zoneStartX}
        y={8}
        width={zoneWidth}
        height={8}
        rx={3}
        fill="var(--accent-primary)"
        opacity={0.2}
      />
      <circle cx={scoreX} cy={12} r={5} fill={scoreColor(score)} />
      <text x={0} y={h} fontSize={9} fill="var(--text-muted)" className="font-mono">
        0
      </text>
      <text x={barWidth - 12} y={h} fontSize={9} fill="var(--text-muted)" className="font-mono">
        100
      </text>
    </svg>
  );
}

/** SVG 3-bar horizontal chart for risk distribution */
function RiskBars({
  distribution,
}: {
  distribution: AggregateInsightStats['riskBandDistribution'];
}) {
  const barHeight = 10;
  const gap = 6;
  const maxWidth = 120;

  return (
    <svg width={160} height={distribution.length * (barHeight + gap) + 4} className="mt-2">
      {distribution.map((d, i) => {
        const y = i * (barHeight + gap);
        const barW = Math.max(4, (d.percentage / 100) * maxWidth);
        return (
          <g key={d.band}>
            <rect x={0} y={y} width={maxWidth} height={barHeight} rx={3} fill="var(--track-bg)" />
            <rect
              x={0}
              y={y}
              width={barW}
              height={barHeight}
              rx={3}
              fill={RISK_COLORS[d.band] ?? 'var(--text-muted)'}
              opacity={0.8}
            />
            <text x={maxWidth + 6} y={y + barHeight - 1} fontSize={10} fill="var(--text-secondary)" className="font-mono">
              {d.percentage}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** SVG vertical bar chart for per-round averages */
function RoundBars({ data }: { data: AggregateInsightStats['avgScoreByRound'] }) {
  const barWidth = 24;
  const gap = 12;
  const chartHeight = 48;
  const chartWidth = data.length * (barWidth + gap);

  return (
    <svg width={chartWidth + 4} height={chartHeight + 16} className="mt-2">
      {data.map((d, i) => {
        const x = i * (barWidth + gap) + 2;
        const barH = Math.max(4, (d.avgScore / 100) * chartHeight);
        const y = chartHeight - barH;
        return (
          <g key={d.roundType}>
            <rect x={x} y={0} width={barWidth} height={chartHeight} rx={3} fill="var(--track-bg)" />
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={3}
              fill="var(--accent-primary)"
              opacity={0.7}
            />
            <text
              x={x + barWidth / 2}
              y={chartHeight + 12}
              fontSize={9}
              fill="var(--text-muted)"
              textAnchor="middle"
              className="font-mono"
            >
              {ROUND_LABELS[d.roundType] ?? d.roundType}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function InterviewIntelligenceStats() {
  const [stats, setStats] = useState<AggregateInsightStats | null>(null);

  useEffect(() => {
    fetch('/api/insights')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setStats(json.data);
        }
      })
      .catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <section>
      <Container className="py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl tracking-tight">
            Interview Intelligence
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Real data from diagnostics run on our platform
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {/* Card 1: Analyses Run */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <p className="section-label">Diagnostics Run</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="font-mono text-3xl font-bold text-[var(--text-primary)]">
                {formatNumber(stats.totalAnalyses)}
              </span>
              <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">and counting</p>
          </div>

          {/* Card 2: Avg Readiness Score */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <p className="section-label">Avg Readiness Score</p>
            <div className="mt-2 flex items-center gap-3">
              <span
                className="font-mono text-3xl font-bold"
                style={{ color: scoreColor(stats.avgReadinessScore) }}
              >
                {stats.avgReadinessScore}
              </span>
              <span className="text-sm text-[var(--text-muted)]">/ 100</span>
            </div>
            <ScoreBar score={stats.avgReadinessScore} />
          </div>

          {/* Card 3: Risk Distribution */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <p className="section-label">Risk Distribution</p>
            <div className="mt-2 flex items-center gap-4">
              <div className="space-y-1">
                {stats.riskBandDistribution.map((d) => (
                  <div key={d.band} className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: RISK_COLORS[d.band] }}
                    />
                    <span className="text-[var(--text-secondary)]">{d.band}</span>
                  </div>
                ))}
              </div>
              <RiskBars distribution={stats.riskBandDistribution} />
            </div>
          </div>

          {/* Card 4: Score by Round */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <p className="section-label">Avg Score by Round</p>
            <div className="mt-1 flex items-end gap-4">
              <RoundBars data={stats.avgScoreByRound} />
              <div className="space-y-0.5 pb-4">
                {stats.avgScoreByRound.map((d) => (
                  <div key={d.roundType} className="font-mono text-xs text-[var(--text-muted)]">
                    {Math.round(d.avgScore)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
