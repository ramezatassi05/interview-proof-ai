'use client';

import { Badge } from '@/components/ui/Badge';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import type { AgentHeartbeat } from '@/server/agents/company/heartbeats';
import { getDirectReports } from '@/server/agents/company/org';
import { AGENT_OPTIONS, agentMeta } from './agents';

export interface AgentTaskCounts {
  delegated: number;
  escalated: number;
}

interface OrgChartCardProps {
  pendingByAgent: Record<CompanyAgentKind, number>;
  heartbeats: AgentHeartbeat[];
  onSelect: (agent: CompanyAgentKind) => void;
  taskCountsByOwner?: Record<CompanyAgentKind, AgentTaskCounts>;
}

const ROOT: CompanyAgentKind = 'ceo_orchestrator';

function nextFireLabel(iso: string | null | undefined): string {
  if (!iso) return 'On demand';
  const target = new Date(iso).getTime();
  const diffMs = target - Date.now();
  if (diffMs <= 0) return 'now';
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) return `next in ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `next in ${hr}h`;
  return `next in ${Math.floor(hr / 24)}d`;
}

function AgentRow({
  role,
  name,
  pending,
  beat,
  counts,
  isCeo,
  onClick,
}: {
  role: string;
  name: string;
  pending: number;
  beat?: AgentHeartbeat;
  counts?: AgentTaskCounts;
  isCeo?: boolean;
  onClick: () => void;
}) {
  const escalated = counts?.escalated ?? 0;
  const delegated = counts?.delegated ?? 0;
  const escalatedClasses = escalated > 0 ? 'border-l-2 border-l-[var(--color-warning)]' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-start gap-3 border-l-2 border-l-transparent px-3 py-2.5 text-left transition-colors hover:border-l-[var(--accent-primary)] hover:bg-[var(--bg-elevated)]/60 ${escalatedClasses}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary)]">
            {role}
          </span>
          {pending > 0 && <Badge variant="accent">{pending} waiting</Badge>}
        </div>
        <p
          className={`mt-0.5 truncate ${
            isCeo ? 'text-[15px]' : 'text-sm'
          } font-semibold leading-tight text-[var(--text-primary)]`}
        >
          {name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--text-muted)]">
          {pending === 0 && !escalated && !delegated ? (
            <span>All clear</span>
          ) : (
            <>
              {delegated > 0 && (
                <span className="tabular-nums">
                  <span className="text-[var(--text-secondary)]">{delegated}</span> from CEO
                </span>
              )}
              {escalated > 0 && (
                <span className="tabular-nums text-[var(--color-warning)]">
                  {escalated} escalated
                </span>
              )}
            </>
          )}
          {beat?.scheduleHuman && (
            <span className="ml-auto truncate tabular-nums">{nextFireLabel(beat.nextFireIso)}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export function OrgChartCard({
  pendingByAgent,
  heartbeats,
  onSelect,
  taskCountsByOwner,
}: OrgChartCardProps) {
  const ceo = AGENT_OPTIONS.find((a) => a.value === ROOT);
  const directReportKinds = getDirectReports(ROOT);
  const beatsByKind = new Map(heartbeats.map((h) => [h.agentKind, h]));

  return (
    <div>
      <div className="flex flex-col gap-2">
        {ceo && (
          <AgentRow
            role="CEO"
            name={ceo.label}
            pending={pendingByAgent[ceo.value] ?? 0}
            counts={taskCountsByOwner?.[ceo.value]}
            beat={beatsByKind.get(ceo.value)}
            isCeo
            onClick={() => onSelect(ceo.value)}
          />
        )}

        {directReportKinds.length > 0 && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Direct reports
          </p>
        )}

        {directReportKinds.map((kind) => {
          const meta = agentMeta(kind);
          const role = kind === 'executive_assistant' ? 'Assistant' : 'Director';
          const name = meta.label.replace('Director of ', '');
          return (
            <AgentRow
              key={kind}
              role={role}
              name={name}
              pending={pendingByAgent[kind] ?? 0}
              counts={taskCountsByOwner?.[kind]}
              beat={beatsByKind.get(kind)}
              onClick={() => onSelect(kind)}
            />
          );
        })}
      </div>
    </div>
  );
}
