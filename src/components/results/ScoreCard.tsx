import type { RiskBand } from '@/types';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';

interface ScoreCardProps {
  score: number;
  riskBand: RiskBand;
  totalRisks?: number;
}

export function ScoreCard({ score, riskBand, totalRisks }: ScoreCardProps) {
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = () => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Readiness Score
        </p>

        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className={`text-6xl font-bold tabular-nums ${getScoreColor()}`}>{score}</span>
          <span className="text-2xl text-zinc-400 dark:text-zinc-500">/ 100</span>
        </div>

        <div className="mt-4 flex justify-center">
          <Badge variant={riskBandToVariant(riskBand)} className="text-sm">
            {riskBand} Risk
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mx-auto mt-6 max-w-xs">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {totalRisks !== undefined && (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            {totalRisks} rejection risk{totalRisks !== 1 ? 's' : ''} identified
          </p>
        )}
      </div>
    </div>
  );
}
