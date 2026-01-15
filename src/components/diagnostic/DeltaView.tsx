import type { DeltaComparison } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { RiskItem } from '@/components/results/RiskItem';

interface DeltaViewProps {
  delta: DeltaComparison;
}

export function DeltaView({ delta }: DeltaViewProps) {
  const scoreDeltaColor =
    delta.scoreDelta > 0
      ? 'text-green-600 dark:text-green-400'
      : delta.scoreDelta < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-zinc-600 dark:text-zinc-400';

  const scoreDeltaSign = delta.scoreDelta > 0 ? '+' : '';

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Progress Since Last Run
        </h2>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Previous</p>
            <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
              {delta.previousScore}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Change</p>
            <p className={`text-2xl font-bold ${scoreDeltaColor}`}>
              {scoreDeltaSign}
              {delta.scoreDelta}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Current</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {delta.currentScore}
            </p>
          </div>
        </div>
      </div>

      {/* Resolved Risks */}
      {delta.resolvedRisks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="low">Resolved</Badge>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {delta.resolvedRisks.length} risk{delta.resolvedRisks.length !== 1 ? 's' : ''}{' '}
              addressed
            </span>
          </div>
          <div className="space-y-2 opacity-60">
            {delta.resolvedRisks.map((risk) => (
              <div
                key={risk.id}
                className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm font-medium text-green-800 line-through dark:text-green-300">
                    {risk.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Risks */}
      {delta.newRisks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="high">New</Badge>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {delta.newRisks.length} new risk{delta.newRisks.length !== 1 ? 's' : ''} identified
            </span>
          </div>
          <div className="space-y-2">
            {delta.newRisks.map((risk, index) => (
              <RiskItem key={risk.id} risk={risk} index={index} showEvidence />
            ))}
          </div>
        </div>
      )}

      {/* Remaining Risks */}
      {delta.remainingRisks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="medium">Remaining</Badge>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {delta.remainingRisks.length} risk{delta.remainingRisks.length !== 1 ? 's' : ''} still
              present
            </span>
          </div>
          <div className="space-y-2">
            {delta.remainingRisks.map((risk, index) => (
              <RiskItem key={risk.id} risk={risk} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
