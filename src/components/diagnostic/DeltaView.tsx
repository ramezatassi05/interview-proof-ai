import type { DeltaComparison } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { RiskItem } from '@/components/results/RiskItem';

interface DeltaViewProps {
  delta: DeltaComparison;
}

export function DeltaView({ delta }: DeltaViewProps) {
  const scoreDeltaColor =
    delta.scoreDelta > 0
      ? 'text-[var(--color-success)]'
      : delta.scoreDelta < 0
        ? 'text-[var(--color-danger)]'
        : 'text-[var(--text-muted)]';

  const scoreDeltaSign = delta.scoreDelta > 0 ? '+' : '';

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          Progress Since Last Run
        </h2>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Previous</p>
            <p className="text-2xl font-bold text-[var(--text-secondary)]">
              {delta.previousScore}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Change</p>
            <p className={`text-2xl font-bold ${scoreDeltaColor}`}>
              {scoreDeltaSign}
              {delta.scoreDelta}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Current</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
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
            <span className="text-sm text-[var(--text-muted)]">
              {delta.resolvedRisks.length} risk{delta.resolvedRisks.length !== 1 ? 's' : ''}{' '}
              addressed
            </span>
          </div>
          <div className="space-y-2 opacity-60">
            {delta.resolvedRisks.map((risk) => (
              <div
                key={risk.id}
                className="rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success-muted)] p-3"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-[var(--color-success)]"
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
                  <span className="text-sm font-medium text-[var(--color-success)] line-through">
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
            <span className="text-sm text-[var(--text-muted)]">
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
            <span className="text-sm text-[var(--text-muted)]">
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
