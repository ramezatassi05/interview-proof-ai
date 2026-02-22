import type { RiskBand } from '@/types';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';
import { RadialScoreIndicator } from '@/components/ui/RadialScoreIndicator';

interface ScoreCardProps {
  score: number;
  riskBand: RiskBand;
  totalRisks?: number;
}

export function ScoreCard({ score, riskBand, totalRisks }: ScoreCardProps) {
  return (
    <div className="rounded-[20px] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] p-8 shadow-warm">
      <div className="flex flex-col items-center">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">
          Readiness Score
        </p>

        <RadialScoreIndicator
          score={score}
          size="xl"
          variant="auto"
          animated
          showPercentage={false}
        />

        <div className="mt-6 flex flex-col items-center gap-3">
          <Badge variant={riskBandToVariant(riskBand)} className="text-sm px-4 py-1">
            {riskBand} Risk
          </Badge>

          {totalRisks !== undefined && (
            <p className="text-sm text-[var(--text-secondary)]">
              {totalRisks} rejection risk{totalRisks !== 1 ? 's' : ''} identified
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
