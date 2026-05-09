'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { COMPANY_AGENT_KINDS, type CompanyAgentKind } from '@/server/agents/company/types';
import { agentMeta } from './agents';
import { ApprovalDetailModal, ApprovalRow, type CompanyAction, type TransitionStatus } from './_approvals';
import { InboxFiltersBar } from './InboxFilters';
import { InboxGroup } from './InboxGroup';
import {
  DEFAULT_INBOX_FILTERS,
  useInboxQuery,
  type InboxFilters,
} from './useInboxQuery';

export function InboxTab({
  pendingActionId,
  approvalError,
  onTransition,
}: {
  pendingActionId: string | null;
  approvalError: string | null;
  onTransition: (id: string, status: TransitionStatus) => Promise<void> | void;
}) {
  const [filters, setFilters] = useState<InboxFilters>(DEFAULT_INBOX_FILTERS);
  const { actions, loading, loadingMore, error, nextCursor, loadMore, removeAction } =
    useInboxQuery(filters);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  // When the user filters to a single agent, drop grouping (header would be redundant).
  const grouped = filters.agentKinds.length !== 1;

  // CLI-relayed ideas (triggered_by='ceo_cli') get a dedicated lead group so
  // the CEO sees their own incoming thoughts apart from autonomous proposals.
  // Strictly additive: when there are no such rows, the group disappears and
  // the inbox renders identically to its prior layout.
  const cliIdeaActions = useMemo(
    () => actions.filter((a) => a.triggeredBy === 'ceo_cli'),
    [actions]
  );

  const groupedActions = useMemo(() => {
    if (!grouped) return null;
    const map = new Map<CompanyAgentKind, CompanyAction[]>();
    for (const k of COMPANY_AGENT_KINDS) map.set(k, []);
    for (const a of actions) {
      if (a.triggeredBy === 'ceo_cli') continue; // shown in dedicated lead group
      const bucket = map.get(a.agentKind);
      if (bucket) bucket.push(a);
    }
    return map;
  }, [grouped, actions]);

  const openAction = useMemo(
    () => actions.find((a) => a.id === openActionId) ?? null,
    [actions, openActionId]
  );

  const isFilteredEmpty = !loading && actions.length === 0;
  const filtersAreNonDefault =
    filters.status !== DEFAULT_INBOX_FILTERS.status ||
    filters.agentKinds.length > 0 ||
    filters.triggeredBy !== DEFAULT_INBOX_FILTERS.triggeredBy ||
    filters.approvalScope !== DEFAULT_INBOX_FILTERS.approvalScope ||
    filters.q.trim().length > 0;

  // Wrap the parent's onTransition so the inbox optimistically removes the row.
  const handleTransition = async (id: string, status: TransitionStatus) => {
    removeAction(id);
    try {
      await onTransition(id, status);
    } catch {
      // If the parent surfaces an error, the row stays gone — refetch via filter bump
      // would restore it, but the UX of toggling status filter mirrors a refresh anyway.
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <InboxFiltersBar
        value={filters}
        onChange={setFilters}
        resultCount={actions.length}
        loading={loading}
      />

      {(error || approvalError) && (
        <div
          role="alert"
          className="border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2 text-xs text-[var(--color-danger)]"
        >
          {error ?? approvalError}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 animate-pulse border border-[var(--border-default)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : isFilteredEmpty ? (
        <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-[var(--border-default)] bg-[var(--bg-card)] px-6 py-16 text-center">
          <span className="text-3xl text-[var(--text-muted)]" aria-hidden>
            —
          </span>
          {filtersAreNonDefault ? (
            <>
              <p className="text-sm text-[var(--text-secondary)]">
                No autonomous proposals match these filters.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(DEFAULT_INBOX_FILTERS)}
              >
                Clear filters
              </Button>
            </>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              All clear — your team has nothing waiting on you.
            </p>
          )}
        </div>
      ) : grouped && groupedActions ? (
        <div className="flex flex-col gap-3">
          {cliIdeaActions.length > 0 && (
            <CliIdeasGroup
              actions={cliIdeaActions}
              pendingActionId={pendingActionId}
              onTransition={handleTransition}
              onOpenDetail={(a) => setOpenActionId(a.id)}
            />
          )}
          {COMPANY_AGENT_KINDS.map((kind) => {
            const list = groupedActions.get(kind) ?? [];
            if (list.length === 0) return null;
            return (
              <InboxGroup
                key={kind}
                agentKind={kind}
                actions={list}
                pendingActionId={pendingActionId}
                onTransition={handleTransition}
                onOpenDetail={(a) => setOpenActionId(a.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-[var(--text-muted)]">
            Showing {agentMeta(filters.agentKinds[0]).label}
          </p>
          {actions.map((action) => (
            <ApprovalRow
              key={action.id}
              action={action}
              pending={pendingActionId === action.id}
              onTransition={handleTransition}
              onOpenDetail={(a) => setOpenActionId(a.id)}
            />
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" loading={loadingMore} onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}

      <ApprovalDetailModal
        action={openAction}
        open={!!openAction}
        onOpenChange={(next) => {
          if (!next) setOpenActionId(null);
        }}
        pending={openAction ? pendingActionId === openAction.id : false}
        onTransition={handleTransition}
      />
    </div>
  );
}

function CliIdeasGroup({
  actions,
  pendingActionId,
  onTransition,
  onOpenDetail,
}: {
  actions: CompanyAction[];
  pendingActionId: string | null;
  onTransition: (id: string, status: TransitionStatus) => void;
  onOpenDetail: (action: CompanyAction) => void;
}) {
  const [open, setOpen] = useState(true);
  if (actions.length === 0) return null;
  const pendingCount = actions.filter((a) => a.status === 'awaiting_approval').length;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5 px-3 py-2 text-left transition-colors hover:bg-[var(--accent-primary)]/10"
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
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          Ideas from Claude Code
        </span>
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
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
