'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { relativeTime } from '@/lib/relative-time';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import { agentMeta } from './agents';
import { SectionLabel, MetricTile, PriorityBadge, StatusBadge, humanizeKey } from './_primitives';
import { DecisionsStrip, type Decision } from './DecisionsStrip';
import type { AgentHeartbeat } from '@/server/agents/company/heartbeats';
import { OrgChartCard } from './OrgChartCard';
import { AgentDrawer } from './AgentDrawer';
import { COMPANY_AGENT_KINDS } from '@/server/agents/company/types';
import { TaskKanban, type CompanyTask } from './TaskKanban';

interface CompanyMetricsSnapshot {
  totalUsers: number;
  totalReports: number;
  unlockedReports: number;
  unlockRate: number;
  totalCreditsPurchased: number;
  estimatedRevenueCents: number;
  pendingCompanyActions: number;
  activeCompanySessions: number;
  capturedAt: string;
}

interface EvidenceRef {
  label: string;
  source: string;
}

interface CompanyAction {
  id: string;
  sessionId: string | null;
  agentKind: CompanyAgentKind;
  actionType: string;
  title: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'drafted' | 'awaiting_approval' | 'approved' | 'rejected' | 'completed' | 'failed';
  triggeredBy?: 'user' | 'cron' | 'agent';
  payloadJson?: Record<string, unknown> | null;
  resultJson?: Record<string, unknown> | null;
  evidenceRefsJson?: EvidenceRef[] | null;
  completedAt?: string | null;
  error?: string | null;
  createdAt: string;
}

interface CompanyAgentOutput {
  agentKind: CompanyAgentKind;
  summary: string;
  priorities: string[];
  proposedActions: CompanyAction[];
}

interface BriefData {
  summary: string;
  metrics: CompanyMetricsSnapshot;
  pendingActions: CompanyAction[];
  nextBestQuestions: string[];
  decisions?: Decision[];
  tasks?: CompanyTask[];
  heartbeats?: AgentHeartbeat[];
  spend30dCents?: number;
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatHeartbeat(iso: string): string {
  const target = new Date(iso).getTime();
  const diffMs = target - Date.now();
  if (diffMs <= 0) return 'now';
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) return `in ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `in ${hr}h`;
  const day = Math.floor(hr / 24);
  return `in ${day}d`;
}

function ApprovalRow({
  action,
  pending,
  onTransition,
  onOpenDetail,
}: {
  action: CompanyAction;
  pending: boolean;
  onTransition: (id: string, status: 'approved' | 'rejected') => void;
  onOpenDetail: (action: CompanyAction) => void;
}) {
  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-card)]">
      <button
        type="button"
        onClick={() => onOpenDetail(action)}
        className="block w-full px-4 py-3 text-left transition-colors hover:bg-[var(--bg-elevated)] focus:bg-[var(--bg-elevated)] focus:outline-none"
        aria-label={`View full details for ${action.title}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={action.priority} />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
            {agentMeta(action.agentKind).label}
          </span>
          {action.triggeredBy === 'cron' && <Badge variant="default">Autonomous</Badge>}
          <span className="ml-auto text-[10px] tabular-nums text-[var(--text-muted)]">
            {relativeTime(action.createdAt)}
          </span>
        </div>
        <h3
          className="mt-2 truncate text-sm font-semibold text-[var(--text-primary)]"
          title={action.title}
        >
          {action.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
          {action.rationale}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
          View full
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
      <div className="flex items-center justify-end gap-2 border-t border-[var(--border-default)] px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTransition(action.id, 'rejected')}
          disabled={pending}
        >
          Reject
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={pending}
          onClick={() => onTransition(action.id, 'approved')}
        >
          Approve
        </Button>
      </div>
    </div>
  );
}

function PayloadField({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === '') return null;

  let body: React.ReactNode;
  if (typeof value === 'string') {
    body = (
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-secondary)]">
        {value}
      </p>
    );
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    body = <p className="text-sm tabular-nums text-[var(--text-secondary)]">{String(value)}</p>;
  } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    body = (
      <ul className="list-disc pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
        {(value as string[]).map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    );
  } else {
    body = (
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border border-[var(--border-default)] bg-[var(--bg-primary)] p-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{humanizeKey(label)}</SectionLabel>
      {body}
    </div>
  );
}

function ApprovalDetailModal({
  action,
  open,
  onOpenChange,
  pending,
  onTransition,
}: {
  action: CompanyAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onTransition: (id: string, status: 'approved' | 'rejected') => void;
}) {
  if (!action) return null;

  const payloadEntries = action.payloadJson
    ? Object.entries(action.payloadJson).filter(
        ([, v]) => v !== null && v !== undefined && v !== ''
      )
    : [];
  const evidence = action.evidenceRefsJson ?? [];
  const isAwaiting = action.status === 'awaiting_approval';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <PriorityBadge priority={action.priority} />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
              {agentMeta(action.agentKind).label}
            </span>
            {action.triggeredBy === 'cron' && <Badge variant="default">Autonomous</Badge>}
            <StatusBadge status={action.status} />
            <span className="ml-auto text-[10px] tabular-nums text-[var(--text-muted)]">
              {relativeTime(action.createdAt)}
            </span>
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {humanizeKey(action.actionType)}
          </p>
          <DialogTitle className="mt-1 break-words">{action.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Rationale</SectionLabel>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-secondary)]">
              {action.rationale}
            </p>
          </div>

          {payloadEntries.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-[var(--border-default)] pt-4">
              {payloadEntries.map(([key, value]) => (
                <PayloadField key={key} label={key} value={value} />
              ))}
            </div>
          )}

          {evidence.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[var(--border-default)] pt-4">
              <SectionLabel>Evidence</SectionLabel>
              <ul className="flex flex-col gap-1.5">
                {evidence.map((ref, idx) => (
                  <li
                    key={idx}
                    className="flex flex-wrap items-baseline gap-x-2 text-xs text-[var(--text-secondary)]"
                  >
                    <span className="font-semibold text-[var(--text-primary)]">{ref.label}</span>
                    <span className="text-[var(--text-muted)]">·</span>
                    <span className="break-all font-mono text-[11px] text-[var(--text-muted)]">
                      {ref.source}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {action.error && (
            <div className="border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2">
              <SectionLabel>Error</SectionLabel>
              <p className="mt-1 text-xs text-[var(--color-danger)]">{action.error}</p>
            </div>
          )}
        </div>

        {isAwaiting && (
          <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex items-center justify-end gap-2 border-t border-[var(--border-default)] bg-[var(--bg-card)] px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTransition(action.id, 'rejected')}
              disabled={pending}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={pending}
              onClick={() => onTransition(action.id, 'approved')}
            >
              Approve
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProposedActionRow({ action }: { action: CompanyAction }) {
  return (
    <div className="flex items-start gap-3 border-l-2 border-[var(--border-default)] pl-3 py-1.5">
      <PriorityBadge priority={action.priority} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]" title={action.title}>
          {action.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">
          {action.rationale}
        </p>
      </div>
      <StatusBadge status={action.status} />
    </div>
  );
}

export function CommandCenterClient({ initialBrief }: { initialBrief: BriefData }) {
  const [brief, setBrief] = useState(initialBrief);
  const [selectedAgent, setSelectedAgent] = useState<CompanyAgentKind>('ceo_orchestrator');
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [output, setOutput] = useState<CompanyAgentOutput | null>(null);
  const [actions, setActions] = useState<CompanyAction[]>(initialBrief.pendingActions);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<CompanyAction[]>([]);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>(initialBrief.decisions ?? []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const openAction = useMemo(
    () => actions.find((a) => a.id === openActionId) ?? null,
    [actions, openActionId]
  );

  const metrics = brief.metrics;
  const activeAgent = agentMeta(selectedAgent);
  const pendingApprovals = useMemo(
    () => actions.filter((a) => a.status === 'awaiting_approval'),
    [actions]
  );

  const pendingByAgent = useMemo(() => {
    const counts = Object.fromEntries(COMPANY_AGENT_KINDS.map((k) => [k, 0])) as Record<
      CompanyAgentKind,
      number
    >;
    for (const a of pendingApprovals) counts[a.agentKind] = (counts[a.agentKind] ?? 0) + 1;
    return counts;
  }, [pendingApprovals]);

  const openAgentDrawer = useCallback((agent: CompanyAgentKind) => {
    setSelectedAgent((prev) => {
      if (prev !== agent) {
        setSessionId(null);
        setOutput(null);
        setMessage('');
        setError(null);
      }
      return agent;
    });
    setDrawerOpen(true);
    setTimeout(() => composerRef.current?.focus(), 50);
  }, []);

  const refreshBrief = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/company-agent/brief');
      if (!res.ok) return;
      const json = (await res.json()) as { data: BriefData };
      setBrief(json.data);
      setActions(json.data.pendingActions);
      if (json.data.decisions) setDecisions(json.data.decisions);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/company-agent/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId: sessionId ?? undefined,
          agentKind: selectedAgent,
        }),
      });

      const json = (await res.json()) as {
        data?: {
          sessionId: string;
          output: Omit<CompanyAgentOutput, 'proposedActions'> & {
            proposedActions: Omit<CompanyAction, 'id' | 'sessionId' | 'status' | 'createdAt'>[];
          };
          actions: CompanyAction[];
        };
        error?: string;
      };

      if (!res.ok || !json.data) {
        throw new Error(json.error ?? 'Company agent request failed');
      }

      setSessionId(json.data.sessionId);
      setOutput({
        ...json.data.output,
        proposedActions: json.data.actions,
      });
      setActions((prev) => [...json.data!.actions, ...prev]);
      setMessage('');
      await refreshBrief();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [message, loading, sessionId, selectedAgent, refreshBrief]);

  const transitionAction = useCallback(
    async (id: string, status: 'approved' | 'rejected') => {
      setApprovalError(null);
      setPendingActionId(id);
      const prevActions = actions;
      setActions((current) => current.filter((a) => a.id !== id));
      try {
        const res = await fetch(`/api/admin/company-agent/actions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error(`Could not ${status === 'approved' ? 'approve' : 'reject'}.`);
        if (status === 'approved') {
          const json = (await res.json()) as { data?: CompanyAction };
          if (json.data) {
            setRecentExecutions((prev) => [json.data!, ...prev].slice(0, 5));
          }
        }
        await refreshBrief();
      } catch (err) {
        setActions(prevActions);
        setApprovalError(err instanceof Error ? err.message : 'Action failed.');
      } finally {
        setPendingActionId(null);
      }
    },
    [actions, refreshBrief]
  );

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === 'Enter' &&
        document.activeElement === composerRef.current
      ) {
        event.preventDefault();
        void sendMessage();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [sendMessage]);

  function fillPrompt(prompt: string) {
    setMessage(prompt);
    composerRef.current?.focus();
  }

  const nextHeartbeatIso = useMemo(() => {
    const fires = (brief.heartbeats ?? [])
      .map((h) => h.nextFireIso)
      .filter((iso): iso is string => Boolean(iso))
      .sort();
    return fires[0] ?? null;
  }, [brief.heartbeats]);

  const metricTiles = [
    {
      label: 'Users',
      value: metrics.totalUsers.toLocaleString(),
      caption: `Snapshot ${relativeTime(metrics.capturedAt)}`,
    },
    { label: 'Reports', value: metrics.totalReports.toLocaleString() },
    { label: 'Unlock Rate', value: `${Math.round(metrics.unlockRate * 100)}%` },
    { label: 'Revenue Est.', value: formatMoney(metrics.estimatedRevenueCents) },
    { label: 'Sessions', value: metrics.activeCompanySessions.toLocaleString() },
    {
      label: 'Pending',
      value: metrics.pendingCompanyActions.toLocaleString(),
      emphasis: metrics.pendingCompanyActions > 0,
    },
    {
      label: 'Next Heartbeat',
      value: nextHeartbeatIso ? formatHeartbeat(nextHeartbeatIso) : '—',
      caption: nextHeartbeatIso ? new Date(nextHeartbeatIso).toUTCString().slice(0, 22) : undefined,
    },
    {
      label: 'Spend (30d)',
      value: typeof brief.spend30dCents === 'number' ? formatMoney(brief.spend30dCents) : '—',
      caption: 'Sonnet 4.6 token cost',
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-3 border-b border-[var(--border-default)] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="accent">Internal · Draft-only</Badge>
              <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                Snapshot {relativeTime(metrics.capturedAt)}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              CEO Command Center
            </h1>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={refreshing}
            onClick={refreshBrief}
            className="w-fit"
          >
            Refresh
          </Button>
        </header>

        <section className="flex gap-3 overflow-x-auto pb-1">
          {metricTiles.map((tile) => (
            <MetricTile key={tile.label} {...tile} />
          ))}
        </section>

        <DecisionsStrip
          decisions={decisions}
          onCreated={(d) => setDecisions((prev) => [d, ...prev].slice(0, 10))}
        />

        <section className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
          {/* LEFT RAIL */}
          <aside className="order-2 flex flex-col gap-5 lg:order-1">
            <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <SectionLabel>Today</SectionLabel>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {brief.summary}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] tabular-nums text-[var(--text-muted)]">
                <span>
                  <span className="text-[var(--text-secondary)]">
                    {metrics.pendingCompanyActions}
                  </span>{' '}
                  pending
                </span>
                <span>
                  <span className="text-[var(--text-secondary)]">
                    {metrics.activeCompanySessions}
                  </span>{' '}
                  active sessions
                </span>
              </div>
            </div>

            <OrgChartCard
              pendingByAgent={pendingByAgent}
              heartbeats={brief.heartbeats ?? []}
              onSelect={openAgentDrawer}
            />
          </aside>

          {/* CENTER — Goals Kanban */}
          <section className="order-1 flex flex-col gap-5 lg:order-2">
            <TaskKanban initialTasks={brief.tasks ?? []} />
          </section>

          {/* RIGHT RAIL — pending approvals */}
          <aside className="order-3 flex flex-col gap-3">
            <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <div className="flex items-center justify-between gap-2">
                <SectionLabel>Pending approvals</SectionLabel>
                {pendingApprovals.length > 0 && (
                  <Badge variant="accent">{pendingApprovals.length}</Badge>
                )}
              </div>
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                Drafted by agents · awaiting your decision.
              </p>
              {approvalError && (
                <p className="mt-2 text-[11px] text-[var(--color-danger)]">{approvalError}</p>
              )}

              <div className="mt-3 flex flex-col gap-2">
                {pendingApprovals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--border-default)] py-8">
                    <span className="text-2xl text-[var(--text-muted)]" aria-hidden>
                      —
                    </span>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Inbox zero — no actions waiting.
                    </p>
                  </div>
                ) : (
                  pendingApprovals.map((action) => (
                    <ApprovalRow
                      key={action.id}
                      action={action}
                      pending={pendingActionId === action.id}
                      onTransition={transitionAction}
                      onOpenDetail={(a) => setOpenActionId(a.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {recentExecutions.length > 0 && (
              <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
                <SectionLabel>Recently executed</SectionLabel>
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                  Approved actions and their results.
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  {recentExecutions.map((action) => (
                    <ExecutedActionRow key={action.id} action={action} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>

      <ApprovalDetailModal
        action={openAction}
        open={!!openAction}
        onOpenChange={(next) => {
          if (!next) setOpenActionId(null);
        }}
        pending={openAction ? pendingActionId === openAction.id : false}
        onTransition={transitionAction}
      />

      <AgentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        activeAgent={activeAgent}
        message={message}
        onMessageChange={setMessage}
        onSend={sendMessage}
        loading={loading}
        error={error}
        onDismissError={() => setError(null)}
        output={output}
        composerRef={composerRef}
        suggestedPrompts={brief.nextBestQuestions}
        onPickPrompt={fillPrompt}
        renderProposedAction={(action) => (
          <ProposedActionRow key={action.id} action={action as CompanyAction} />
        )}
      />
    </main>
  );
}

function ExecutedActionRow({ action }: { action: CompanyAction }) {
  const isFailed = action.status === 'failed';
  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isFailed ? 'default' : 'accent'}>{isFailed ? 'failed' : 'completed'}</Badge>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
          {agentMeta(action.agentKind).label}
        </span>
        <span className="ml-auto text-[10px] tabular-nums text-[var(--text-muted)]">
          {relativeTime(action.completedAt ?? action.createdAt)}
        </span>
      </div>
      <p
        className="mt-1.5 truncate text-sm font-semibold text-[var(--text-primary)]"
        title={action.title}
      >
        {action.title}
      </p>
      {isFailed && action.error && (
        <p className="mt-1 text-xs text-[var(--color-danger)]">{action.error}</p>
      )}
      {!isFailed && action.resultJson && (
        <details className="mt-2 group">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            View result
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words border border-[var(--border-default)] bg-[var(--bg-primary)] p-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
            {JSON.stringify(action.resultJson, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
