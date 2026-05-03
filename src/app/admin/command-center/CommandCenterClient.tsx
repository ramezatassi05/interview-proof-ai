'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, severityToVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

type CompanyAgentKind =
  | 'ceo_orchestrator'
  | 'executive_assistant'
  | 'director_marketing'
  | 'director_finance'
  | 'director_engineering';

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
  resultJson?: Record<string, unknown> | null;
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
}

interface AgentOption {
  value: CompanyAgentKind;
  label: string;
  discipline: string;
  placeholder: string;
}

const AGENT_OPTIONS: AgentOption[] = [
  {
    value: 'ceo_orchestrator',
    label: 'CEO Orchestrator',
    discipline: 'Strategy · prioritization · cross-functional',
    placeholder: 'What should I focus on this week given current metrics?',
  },
  {
    value: 'executive_assistant',
    label: 'Executive Assistant',
    discipline: 'Calendar · inbox · meeting prep · follow-ups',
    placeholder: 'Draft an agenda for the next leadership sync.',
  },
  {
    value: 'director_marketing',
    label: 'Director of Marketing',
    discipline: 'Positioning · growth · content · launches',
    placeholder: 'Propose a 7-day content plan to lift unlock rate.',
  },
  {
    value: 'director_finance',
    label: 'Director of Finance',
    discipline: 'Revenue · pricing · runway · unit economics',
    placeholder: 'Review last week’s revenue and flag anomalies.',
  },
  {
    value: 'director_engineering',
    label: 'Director of Engineering',
    discipline: 'Roadmap · specs · reliability · velocity',
    placeholder: 'Turn the next roadmap item into a GitHub-ready spec.',
  },
];

function agentMeta(kind: CompanyAgentKind): AgentOption {
  return AGENT_OPTIONS.find((a) => a.value === kind) ?? AGENT_OPTIONS[0];
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  if (diff < 0) return 'just now';
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
      {children}
    </p>
  );
}

function MetricTile({
  label,
  value,
  caption,
  emphasis = false,
}: {
  label: string;
  value: string;
  caption?: string;
  emphasis?: boolean;
}) {
  const valueColor = emphasis ? 'text-[var(--color-warning)]' : 'text-[var(--text-primary)]';
  const labelColor = emphasis ? 'text-[var(--color-warning)]' : 'text-[var(--text-muted)]';
  return (
    <div className="min-w-[140px] flex-1 border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3">
      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${labelColor}`}>
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
      {caption && (
        <p className="mt-0.5 text-[10px] text-[var(--text-muted)] tabular-nums">{caption}</p>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: CompanyAction['priority'] }) {
  return <Badge variant={severityToVariant(priority)}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: CompanyAction['status'] }) {
  const isAwaiting = status === 'awaiting_approval';
  return <Badge variant={isAwaiting ? 'accent' : 'default'}>{status.replace(/_/g, ' ')}</Badge>;
}

function ApprovalRow({
  action,
  pending,
  onTransition,
}: {
  action: CompanyAction;
  pending: boolean;
  onTransition: (id: string, status: 'approved' | 'rejected') => void;
}) {
  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3">
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
      <div className="mt-3 flex items-center justify-end gap-2">
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
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const metrics = brief.metrics;
  const activeAgent = agentMeta(selectedAgent);
  const pendingApprovals = useMemo(
    () => actions.filter((a) => a.status === 'awaiting_approval'),
    [actions]
  );

  const refreshBrief = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/company-agent/brief');
      if (!res.ok) return;
      const json = (await res.json()) as { data: BriefData };
      setBrief(json.data);
      setActions(json.data.pendingActions);
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

            <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <SectionLabel>Leadership</SectionLabel>
              <div className="mt-3 flex flex-col">
                {AGENT_OPTIONS.map((agent) => {
                  const selected = selectedAgent === agent.value;
                  return (
                    <button
                      key={agent.value}
                      type="button"
                      onClick={() => setSelectedAgent(agent.value)}
                      className={`flex flex-col gap-0.5 border-l-2 px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? 'border-l-[var(--accent-primary)] bg-[var(--bg-elevated)]'
                          : 'border-l-transparent hover:bg-[var(--bg-elevated)]/50'
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold ${
                          selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {agent.label}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {agent.discipline}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <SectionLabel>Suggested prompts</SectionLabel>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {brief.nextBestQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => fillPrompt(q)}
                    className="border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-left text-[11px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER — composer + output */}
          <section className="order-1 flex flex-col gap-5 lg:order-2">
            <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    {activeAgent.label}
                  </h2>
                  <Badge variant="default">Draft-only</Badge>
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {activeAgent.discipline}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Output is advisory. External, customer-visible, financial, or production-changing
                work requires your explicit approval.
              </p>

              <textarea
                ref={composerRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                className="mt-4 min-h-[140px] w-full resize-y border border-[var(--border-default)] bg-[var(--bg-primary)] p-3 text-sm leading-relaxed text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--border-accent)]"
                placeholder={activeAgent.placeholder}
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[11px] tabular-nums text-[var(--text-muted)]">
                  <span>{message.length} chars</span>
                  <span aria-hidden>·</span>
                  <span>
                    <kbd className="border border-[var(--border-default)] bg-[var(--bg-primary)] px-1 py-0.5 font-mono text-[10px]">
                      ⌘↵
                    </kbd>{' '}
                    to send
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  loading={loading}
                  disabled={!message.trim()}
                  onClick={sendMessage}
                >
                  {loading ? 'Working' : 'Send to agent'}
                </Button>
              </div>

              {error && (
                <div className="mt-3 flex items-start justify-between gap-3 border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2">
                  <p className="text-xs text-[var(--color-danger)]">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-danger)] hover:opacity-80"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <div className="flex items-center justify-between gap-2">
                <SectionLabel>Latest output</SectionLabel>
                {output && <Badge variant="accent">{agentMeta(output.agentKind).label}</Badge>}
              </div>

              {!output && !loading && (
                <div className="mt-6 flex flex-col items-center justify-center gap-2 py-8">
                  <span className="text-2xl text-[var(--text-muted)]" aria-hidden>
                    —
                  </span>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Send a message to see the agent&apos;s response.
                  </p>
                </div>
              )}

              {loading && !output && (
                <div className="mt-6 flex flex-col items-center justify-center gap-2 py-8">
                  <p className="text-sm text-[var(--text-secondary)]">Drafting response…</p>
                </div>
              )}

              {output && (
                <div className="mt-4 flex flex-col gap-5">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">
                    {output.summary}
                  </p>

                  {output.priorities.length > 0 && (
                    <div className="border-t border-[var(--border-default)] pt-4">
                      <SectionLabel>Priorities</SectionLabel>
                      <ol className="mt-3 flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
                        {output.priorities.map((priority, idx) => (
                          <li
                            key={`${idx}-${priority.slice(0, 24)}`}
                            className="flex items-start gap-3 border-l-2 border-[var(--accent-primary)] pl-3"
                          >
                            <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span>{priority}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {output.proposedActions.length > 0 && (
                    <div className="border-t border-[var(--border-default)] pt-4">
                      <div className="flex items-center justify-between">
                        <SectionLabel>Proposed actions</SectionLabel>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {output.proposedActions.length} drafted
                        </span>
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        {output.proposedActions.map((action) => (
                          <ProposedActionRow key={action.id} action={action} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
