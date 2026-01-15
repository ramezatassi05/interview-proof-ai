import type { ScoreBreakdown as ScoreBreakdownType } from '@/types';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType;
}

const CATEGORY_LABELS: Record<string, string> = {
  hardRequirementMatch: 'Hard Requirements',
  evidenceDepth: 'Evidence Depth',
  roundReadiness: 'Round Readiness',
  resumeClarity: 'Resume Clarity',
  companyProxy: 'Company Fit',
};

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const categories = [
    {
      key: 'hardRequirementMatch',
      score: breakdown.hardRequirementMatch,
      weight: breakdown.weights.hardRequirementMatch,
    },
    {
      key: 'evidenceDepth',
      score: breakdown.evidenceDepth,
      weight: breakdown.weights.evidenceDepth,
    },
    {
      key: 'roundReadiness',
      score: breakdown.roundReadiness,
      weight: breakdown.weights.roundReadiness,
    },
    {
      key: 'resumeClarity',
      score: breakdown.resumeClarity,
      weight: breakdown.weights.resumeClarity,
    },
    { key: 'companyProxy', score: breakdown.companyProxy, weight: breakdown.weights.companyProxy },
  ];

  const getBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Score Breakdown</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">v{breakdown.version}</span>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          {categories.map(({ key, score, weight }) => (
            <div key={key}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {CATEGORY_LABELS[key]}
                </span>
                <span className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                  {Math.round(score)} / 100
                  <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                    ({Math.round(weight * 100)}%)
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className={`h-full transition-all ${getBarColor(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
