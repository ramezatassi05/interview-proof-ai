import type { RiskItem as RiskItemType } from '@/types';
import { RiskItem } from './RiskItem';

interface RiskListProps {
  risks: RiskItemType[];
  showEvidence?: boolean;
  title?: string;
}

export function RiskList({
  risks,
  showEvidence = false,
  title = 'Rejection Risks',
}: RiskListProps) {
  if (risks.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">No risks identified.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <div className="space-y-3">
        {risks.map((risk, index) => (
          <RiskItem key={risk.id} risk={risk} index={index} showEvidence={showEvidence} />
        ))}
      </div>
    </div>
  );
}
