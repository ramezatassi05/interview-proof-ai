'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import { agentMeta } from './agents';
import { ApprovalRow, type CompanyAction, type TransitionStatus } from './_approvals';

export function InboxGroup({
  agentKind,
  actions,
  pendingActionId,
  onTransition,
  onRequestReject,
  onOpenDetail,
  defaultOpen = true,
}: {
  agentKind: CompanyAgentKind;
  actions: CompanyAction[];
  pendingActionId: string | null;
  onTransition: (id: string, status: TransitionStatus) => void;
  onRequestReject: (action: CompanyAction) => void;
  onOpenDetail: (action: CompanyAction) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (actions.length === 0) return null;

  const meta = agentMeta(agentKind);
  const pendingCount = actions.filter((a) => a.status === 'awaiting_approval').length;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-left transition-colors hover:bg-[var(--bg-elevated)]"
        aria-expanded={open}
      >
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{meta.label}</span>
        <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
          {actions.length} {actions.length === 1 ? 'item' : 'items'}
        </span>
        {pendingCount > 0 && pendingCount !== actions.length && (
          <Badge variant="accent">{pendingCount} pending</Badge>
        )}
      </button>

      {open && (
        <div className="flex flex-col gap-2 pl-4">
          {actions.map((action) => (
            <ApprovalRow
              key={action.id}
              action={action}
              pending={pendingActionId === action.id}
              onTransition={onTransition}
              onRequestReject={onRequestReject}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
