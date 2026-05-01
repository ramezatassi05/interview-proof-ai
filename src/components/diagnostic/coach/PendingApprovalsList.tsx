'use client';

import { useState } from 'react';
import type { AgentAction, AgentActionType } from '@/types';

interface PendingApprovalsListProps {
  pendingActions: AgentAction[];
}

const ACTION_TYPE_LABELS: Record<AgentActionType, string> = {
  recommend_drill: 'Recommended drill',
  start_mock_interview: 'Mock interview',
  score_answer: 'Score answer',
  draft_recruiter_reply: 'Draft recruiter reply',
  rewrite_resume_bullet: 'Rewrite resume bullet',
  create_company_brief: 'Company brief',
  update_prep_plan: 'Prep plan update',
  propose_opportunity_update: 'Opportunity update',
  summarize_progress: 'Progress summary',
};

export function PendingApprovalsList({ pendingActions }: PendingApprovalsListProps) {
  const [open, setOpen] = useState<AgentAction | null>(null);

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
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {ACTION_TYPE_LABELS[action.actionType] ?? action.actionType}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
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
                  onClick={() => setOpen(action)}
                  className="shrink-0 rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--accent-primary)]"
                >
                  Review
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && <PreviewModal action={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function PreviewModal({ action, onClose }: { action: AgentAction; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--border-default)] px-6 py-4">
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            {ACTION_TYPE_LABELS[action.actionType] ?? action.actionType}
          </h4>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Drafted {formatRelative(action.createdAt)} — status:{' '}
            <span className="font-mono">{action.status}</span>
          </p>
        </div>
        <div className="space-y-4 px-6 py-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
              Draft payload
            </p>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-secondary)]">
              {JSON.stringify(action.payloadJson, null, 2)}
            </pre>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Full approve / edit / reject flow ships in M8. For now, this preview lets you see what
            your coach is about to do.
          </p>
        </div>
        <div className="flex justify-end border-t border-[var(--border-default)] px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-accent)]"
          >
            Close
          </button>
        </div>
      </div>
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
