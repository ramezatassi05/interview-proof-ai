'use client';

import { useEffect, useState } from 'react';
import type { publicCompanyAction } from '@/server/agents/company/types';
import { agentMeta } from '../../agents';
import { friendlyActionType } from '../../_action-copy';

type PublicAction = ReturnType<typeof publicCompanyAction>;

const POLL_MS = 3000;
const POLL_LIMIT = 60; // ~3 minutes — orchestrator triage runs are far shorter

export function IdeaActionsList({
  initialActions,
  ideaId,
}: {
  initialActions: PublicAction[];
  ideaId: string;
}) {
  const [actions, setActions] = useState<PublicAction[]>(initialActions);
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (polls >= POLL_LIMIT) return;
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ceo/idea/${encodeURIComponent(ideaId)}/actions`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = (await res.json()) as { actions: PublicAction[] };
          setActions(json.actions);
        }
      } catch {
        // ignore — we'll try again
      } finally {
        setPolls((n) => n + 1);
      }
    }, POLL_MS);
    return () => clearTimeout(id);
  }, [polls, ideaId]);

  if (actions.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
        Waiting on the orchestrator to delegate…
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {actions.map((a) => {
        const meta = agentMeta(a.agentKind);
        return (
          <li
            key={a.id}
            className="border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-secondary)]">{meta.label}</span>
              <span>·</span>
              <span>{friendlyActionType(a.actionType)}</span>
              <span>·</span>
              <span>{a.status.replace('_', ' ')}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{a.title}</p>
            {a.rationale && (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{a.rationale}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
