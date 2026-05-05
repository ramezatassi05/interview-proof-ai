'use client';

import { Badge } from '@/components/ui/Badge';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import type { AgentHeartbeat } from '@/server/agents/company/heartbeats';
import { AGENT_OPTIONS } from './agents';
import { SoftLabel } from './_primitives';

interface OrgChartCardProps {
  pendingByAgent: Record<CompanyAgentKind, number>;
  heartbeats: AgentHeartbeat[];
  onSelect: (agent: CompanyAgentKind) => void;
}

function nodeKindClasses(active: boolean): string {
  return active
    ? 'border-[var(--border-accent)] bg-[var(--bg-elevated)]'
    : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)]';
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

export function OrgChartCard({ pendingByAgent, heartbeats, onSelect }: OrgChartCardProps) {
  const ceo = AGENT_OPTIONS.find((a) => a.value === 'ceo_orchestrator');
  const directors = AGENT_OPTIONS.filter((a) => a.value !== 'ceo_orchestrator');
  const beatsByKind = new Map(heartbeats.map((h) => [h.agentKind, h]));

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
            className={`flex w-full max-w-[260px] flex-col items-center border px-3 py-2 text-center transition-colors ${nodeKindClasses(false)}`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
              CEO
            </span>
            <span className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
              {ceo.label}
            </span>
            <div className="mt-1 flex items-center gap-2">
              {pendingByAgent[ceo.value] > 0 && (
                <Badge variant="accent">{pendingByAgent[ceo.value]} waiting on you</Badge>
              )}
              <span className="text-[10px] text-[var(--text-muted)]">On demand</span>
            </div>
          </button>
        )}

        <div className="my-2 h-4 w-px bg-[var(--border-default)]" aria-hidden />

        <div className="grid w-full grid-cols-2 gap-2">
          {directors.map((agent) => {
            const pending = pendingByAgent[agent.value] ?? 0;
            const beat = beatsByKind.get(agent.value);
            return (
              <button
                key={agent.value}
                type="button"
                onClick={() => onSelect(agent.value)}
                className={`flex flex-col items-start gap-1 border px-3 py-2 text-left transition-colors ${nodeKindClasses(false)}`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
                  Director
                </span>
                <span className="text-[12px] font-semibold leading-tight text-[var(--text-primary)]">
                  {agent.label.replace('Director of ', '')}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {pending > 0 ? (
                    <Badge variant="accent">{pending} waiting on you</Badge>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)]">All clear</span>
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
