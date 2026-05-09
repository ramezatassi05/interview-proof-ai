'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AgentAction } from '@/types';
import { ActionApprovalModal } from './ActionApprovalModal';
import { ActionCard } from '@/components/agents/artifacts';

interface PendingApprovalsListProps {
  pendingActions: AgentAction[];
}

export function PendingApprovalsList({ pendingActions }: PendingApprovalsListProps) {
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
      <div className="px-6 pt-4 pb-2 border-b border-[var(--border-default)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Pending Approvals</h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Drafts your agents have prepared. Nothing moves until you approve.
        </p>
      </div>
      <div className="p-6">
        {pendingActions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No pending decisions — your agents are clear.
          </p>
        ) : (
          <ul className="space-y-2">
            {pendingActions.map((action) => (
              <li
                key={action.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <ActionCard action={action} />
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Drafted {formatRelative(action.createdAt)}
                    {action.requiresExternalSend && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] px-1.5 py-px text-[10px] font-medium text-[var(--color-warning)]">
                        external
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenActionId(action.id)}
                  className="shrink-0 rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--accent-primary)]"
                >
                  Review
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ActionApprovalModal
        open={openActionId !== null}
        onClose={() => setOpenActionId(null)}
        actionId={openActionId}
        onResolved={() => router.refresh()}
      />
    </div>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}
