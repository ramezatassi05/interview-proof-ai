'use client';

import { Badge } from '@/components/ui/Badge';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import type { AgentHeartbeat } from '@/server/agents/company/heartbeats';
import { getDirectReports } from '@/server/agents/company/org';
import { AGENT_OPTIONS, agentMeta } from './agents';
import { SoftLabel } from './_primitives';

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

function nodeKindClasses(): string {
  return 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)]';
}

function nextFireLabel(iso: string | null | undefined): string {
  if (!iso) return 'On demand';
  const target = new Date(iso).getTime();
  const diffMs = target - Date.now();
  if (diffMs <= 0) return 'now';
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) return `next: in ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `next: in ${hr}h`;
  return `next: in ${Math.floor(hr / 24)}d`;
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

  const totalDelegated = directReportKinds.reduce(
    (sum, k) => sum + (taskCountsByOwner?.[k]?.delegated ?? 0),
    0
  );

  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center justify-between gap-2">
        <SoftLabel>Your team</SoftLabel>
        <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
          Tap to talk to anyone
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center">
        {ceo && (
          <button
            type="button"
            onClick={() => onSelect(ceo.value)}
            className={`flex w-full max-w-[260px] flex-col items-center border px-3 py-2 text-center transition-colors ${nodeKindClasses()}`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
              CEO
            </span>
            <span className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
              {ceo.label}
            </span>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
              {pendingByAgent[ceo.value] > 0 && (
                <Badge variant="accent">{pendingByAgent[ceo.value]} waiting on you</Badge>
              )}
              {totalDelegated > 0 && (
                <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
                  {totalDelegated} delegated
                </span>
              )}
              <span className="text-[10px] text-[var(--text-muted)]">On demand</span>
            </div>
          </button>
        )}

        <div className="my-2 h-4 w-px bg-[var(--border-default)]" aria-hidden />

        <div className="grid w-full grid-cols-2 gap-2">
          {directReportKinds.map((kind) => {
            const meta = agentMeta(kind);
            const pending = pendingByAgent[kind] ?? 0;
            const beat = beatsByKind.get(kind);
            const counts = taskCountsByOwner?.[kind];
            const showAsDirector = kind !== 'executive_assistant';
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onSelect(kind)}
                className={`flex flex-col items-start gap-1 border px-3 py-2 text-left transition-colors ${nodeKindClasses()}`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
                  {showAsDirector ? 'Director' : 'Assistant'}
                </span>
                <span className="text-[12px] font-semibold leading-tight text-[var(--text-primary)]">
                  {meta.label.replace('Director of ', '')}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {pending > 0 ? (
                    <Badge variant="accent">{pending} waiting on you</Badge>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)]">All clear</span>
                  )}
                  {counts && counts.delegated > 0 && (
                    <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
                      {counts.delegated} from CEO
                    </span>
                  )}
                  {counts && counts.escalated > 0 && (
                    <Badge variant="default">{counts.escalated} escalated</Badge>
                  )}
                </div>
                <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
                  {beat?.scheduleHuman ?? '—'} · {nextFireLabel(beat?.nextFireIso)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
