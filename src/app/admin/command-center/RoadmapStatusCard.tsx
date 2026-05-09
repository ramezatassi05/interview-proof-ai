'use client';

import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { RoadmapStatus } from '@/server/agents/company/roadmap/types';

interface RoadmapStatusCardProps {
  initialStatus: RoadmapStatus;
}

const DOMAIN_LABELS: Record<'product' | 'marketing' | 'finance', string> = {
  product: 'Product',
  marketing: 'Marketing',
  finance: 'Finance',
};

function DomainRow({
  label,
  filename,
  loaded,
  active,
  total,
}: {
  label: string;
  filename: string;
  loaded: boolean;
  active: number;
  total: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
        <span className="font-mono text-[11px] text-[var(--text-muted)]">{filename}</span>
      </div>
      {loaded ? (
        <span className="text-[12px] tabular-nums text-[var(--text-secondary)]">
          {active} active <span className="text-[var(--text-muted)]">/ {total}</span>
        </span>
      ) : (
        <span className="text-[12px] text-[var(--text-muted)]">no file</span>
      )}
    </div>
  );
}

export function RoadmapStatusCard({ initialStatus }: RoadmapStatusCardProps) {
  const [status, setStatus] = useState<RoadmapStatus>(initialStatus);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/company-agent/roadmap-status', { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as { data: RoadmapStatus };
      setStatus(json.data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const totalActive =
    status.product.activeRows + status.marketing.activeRows + status.finance.activeRows;

  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Roadmap your team reads</h3>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="text-[11px] text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline disabled:opacity-50"
        >
          {refreshing ? 'refreshing…' : 'refresh'}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 py-1">
        <span className="text-[13px] font-medium text-[var(--text-primary)]">North Star</span>
        {status.northStarLoaded ? (
          <Badge variant="accent">loaded</Badge>
        ) : (
          <Badge variant="default">missing</Badge>
        )}
      </div>

      <div className="mt-1 divide-y divide-[var(--border-default)]/60 border-t border-[var(--border-default)]/60">
        <DomainRow
          label={DOMAIN_LABELS.product}
          filename="roadmap/product.csv"
          loaded={status.product.loaded}
          active={status.product.activeRows}
          total={status.product.totalRows}
        />
        <DomainRow
          label={DOMAIN_LABELS.marketing}
          filename="roadmap/marketing.csv"
          loaded={status.marketing.loaded}
          active={status.marketing.activeRows}
          total={status.marketing.totalRows}
        />
        <DomainRow
          label={DOMAIN_LABELS.finance}
          filename="roadmap/finance.csv"
          loaded={status.finance.loaded}
          active={status.finance.activeRows}
          total={status.finance.totalRows}
        />
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-[var(--text-muted)]">
        {totalActive} active row{totalActive === 1 ? '' : 's'} grounding what your team proposes.
        Edit these files in the repo to steer direction.
      </p>
    </div>
  );
}
