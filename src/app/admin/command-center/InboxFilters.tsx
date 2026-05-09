'use client';

import { useEffect, useState } from 'react';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import { COMPANY_AGENT_KINDS } from '@/server/agents/company/types';
import { agentMeta } from './agents';
import { SoftLabel } from './_primitives';
import type {
  InboxApprovalScope,
  InboxFilters,
  InboxStatus,
  InboxTriggeredBy,
} from './useInboxQuery';

const STATUS_OPTIONS: { value: InboxStatus; label: string }[] = [
  { value: 'awaiting_approval', label: 'Pending' },
  { value: 'completed', label: 'Done' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'failed', label: 'Failed' },
];

const TRIGGERED_OPTIONS: { value: InboxTriggeredBy; label: string }[] = [
  { value: 'any', label: 'Any source' },
  { value: 'cron', label: 'Acted on its own' },
  { value: 'agent', label: 'Agent-asked' },
  { value: 'user', label: 'You-asked' },
  { value: 'ceo_cli', label: 'From Claude Code' },
];

const APPROVAL_SCOPE_OPTIONS: { value: InboxApprovalScope; label: string }[] = [
  { value: 'awaiting', label: 'Awaiting' },
  { value: 'auto_executed', label: 'Auto-executed' },
  { value: 'any', label: 'Any' },
];

function Chip({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`px-3 py-1.5 text-[11px] font-medium transition-colors border ${
        active
          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
          : 'border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
      }`}
    >
      {children}
    </button>
  );
}

export function InboxFiltersBar({
  value,
  onChange,
  resultCount,
  loading,
}: {
  value: InboxFilters;
  onChange: (next: InboxFilters) => void;
  resultCount: number;
  loading: boolean;
}) {
  // Debounce the search input so we don't fire on every keystroke.
  const [qDraft, setQDraft] = useState(value.q);
  useEffect(() => {
    setQDraft(value.q);
  }, [value.q]);
  useEffect(() => {
    if (qDraft === value.q) return;
    const id = setTimeout(() => onChange({ ...value, q: qDraft }), 220);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDraft]);

  const toggleAgent = (kind: CompanyAgentKind) => {
    const has = value.agentKinds.includes(kind);
    onChange({
      ...value,
      agentKinds: has ? value.agentKinds.filter((k) => k !== kind) : [...value.agentKinds, kind],
    });
  };

  const setStatus = (s: InboxStatus) => onChange({ ...value, status: s });
  const setTriggered = (t: InboxTriggeredBy) => onChange({ ...value, triggeredBy: t });
  const setApprovalScope = (a: InboxApprovalScope) => onChange({ ...value, approvalScope: a });

  return (
    <div className="flex flex-col gap-3 border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <SoftLabel>Status</SoftLabel>
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <Chip key={opt.value} active={value.status === opt.value} onClick={() => setStatus(opt.value)}>
              {opt.label}
            </Chip>
          ))}
        </div>
        <span className="ml-auto text-[11px] tabular-nums text-[var(--text-muted)]" aria-live="polite">
          {loading ? 'Loading…' : `${resultCount} ${resultCount === 1 ? 'item' : 'items'}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SoftLabel>Agent</SoftLabel>
        <div className="flex flex-wrap gap-1.5">
          {COMPANY_AGENT_KINDS.map((k) => (
            <Chip
              key={k}
              active={value.agentKinds.includes(k)}
              onClick={() => toggleAgent(k)}
              ariaLabel={`Filter to ${agentMeta(k).label}`}
            >
              {agentMeta(k).label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SoftLabel>Triggered by</SoftLabel>
          <div className="flex gap-1.5">
            {TRIGGERED_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                active={value.triggeredBy === opt.value}
                onClick={() => setTriggered(opt.value)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SoftLabel>Approval</SoftLabel>
          <div className="flex gap-1.5">
            {APPROVAL_SCOPE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                active={value.approvalScope === opt.value}
                onClick={() => setApprovalScope(opt.value)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <SoftLabel>Search</SoftLabel>
          <input
            type="text"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="Title or rationale…"
            maxLength={80}
            className="border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
