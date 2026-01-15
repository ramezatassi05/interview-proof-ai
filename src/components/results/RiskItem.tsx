import type { RiskItem as RiskItemType } from '@/types';
import { Badge, severityToVariant } from '@/components/ui/Badge';

interface RiskItemProps {
  risk: RiskItemType;
  index: number;
  showEvidence?: boolean;
}

export function RiskItem({ risk, index, showEvidence = false }: RiskItemProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant={severityToVariant(risk.severity)}>{risk.severity}</Badge>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{risk.title}</h3>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{risk.rationale}</p>

          {showEvidence && risk.missingEvidence && (
            <div className="mt-3 rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Missing Evidence
              </p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                {risk.missingEvidence}
              </p>
            </div>
          )}

          {showEvidence && risk.jdRefs && risk.jdRefs.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                JD Requirements
              </p>
              <ul className="mt-1 space-y-1">
                {risk.jdRefs.map((ref, i) => (
                  <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">
                    &bull; {ref}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
