'use client';

import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { BlurFade } from '@/components/ui/blur-fade';
import { Tabs, TabList, TabTrigger, TabContent, useTabsContext } from '@/components/ui/Tabs';
import { relativeTime } from '@/lib/relative-time';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import { agentMeta } from './agents';
import { DashboardHero } from './DashboardHero';
import { HeroApprovalCard } from './HeroApprovalCard';
import { DecisionsStrip, type Decision } from './DecisionsStrip';
import type { AgentHeartbeat } from '@/server/agents/company/heartbeats';
import type { RoadmapStatus } from '@/server/agents/company/roadmap/types';
import { OrgChartCard } from './OrgChartCard';
import { RoadmapStatusCard } from './RoadmapStatusCard';
import { AgentDrawer } from './agent-drawer/AgentDrawer';
import { COMPANY_AGENT_KINDS } from '@/server/agents/company/types';
import { TaskKanban, type CompanyTask } from './TaskKanban';
import {
  ApprovalDetailModal,
  ApprovalRow,
  type CompanyAction,
} from './_approvals';
import { InboxTab } from './InboxTab';
import { IdeasTab } from './IdeasTab';
import { AuditTimeline } from './AuditTimeline';
import { TicketsCard } from './artifacts';

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

interface BriefData {
  summary: string;
  metrics: CompanyMetricsSnapshot;
  pendingActions: CompanyAction[];
  nextBestQuestions: string[];
  decisions?: Decision[];
  tasks?: CompanyTask[];
  heartbeats?: AgentHeartbeat[];
  spend30dCents?: number;
  roadmapStatus?: RoadmapStatus;
}

export function CommandCenterClient({
  initialBrief,
  viewerFirstName,
}: {
  initialBrief: BriefData;
  viewerFirstName: string;
}) {
  const [brief, setBrief] = useState(initialBrief);
  const [selectedAgent, setSelectedAgent] = useState<CompanyAgentKind>('ceo_orchestrator');
  const [actions, setActions] = useState<CompanyAction[]>(initialBrief.pendingActions);
  const [refreshing, setRefreshing] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<CompanyAction[]>([]);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>(initialBrief.decisions ?? []);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openAction = useMemo(
    () => actions.find((a) => a.id === openActionId) ?? null,
    [actions, openActionId]
  );

  const metrics = brief.metrics;
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

  const taskCountsByOwner = useMemo(() => {
    const counts = Object.fromEntries(
      COMPANY_AGENT_KINDS.map((k) => [k, { delegated: 0, escalated: 0 }])
    ) as Record<CompanyAgentKind, { delegated: number; escalated: number }>;
    for (const t of brief.tasks ?? []) {
      const bucket = counts[t.ownerKind];
      if (!bucket) continue;
      if (t.delegatedBy === 'ceo_orchestrator' && t.status !== 'done' && t.status !== 'canceled') {
        bucket.delegated += 1;
      }
      if (t.escalatedAt && t.status !== 'done' && t.status !== 'canceled') {
        bucket.escalated += 1;
      }
    }
    return counts;
  }, [brief.tasks]);

  const openAgentDrawer = useCallback((agent: CompanyAgentKind) => {
    setSelectedAgent(agent);
    setDrawerOpen(true);
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
      // brief.tasks flows through to TaskKanban via initialTasks prop, which
      // resyncs on change — so approving a create_task action lights the board.
    } finally {
      setRefreshing(false);
    }
  }, []);

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

  const nextHeartbeatIso = useMemo(() => {
    const fires = (brief.heartbeats ?? [])
      .map((h) => h.nextFireIso)
      .filter((iso): iso is string => Boolean(iso))
      .sort();
    return fires[0] ?? null;
  }, [brief.heartbeats]);

  const heroApproval = pendingApprovals[0];
  const restApprovals = pendingApprovals.slice(1);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <DashboardHero
          viewerFirstName={viewerFirstName}
          pendingCount={pendingApprovals.length}
          totalUsers={metrics.totalUsers}
          totalReports={metrics.totalReports}
          unlockRate={metrics.unlockRate}
          estimatedRevenueCents={metrics.estimatedRevenueCents}
          activeCompanySessions={metrics.activeCompanySessions}
          spend30dCents={brief.spend30dCents}
          capturedAt={metrics.capturedAt}
          nextHeartbeatIso={nextHeartbeatIso}
          refreshing={refreshing}
          onRefresh={refreshBrief}
        />

        <DecisionsStrip
          decisions={decisions}
          onCreated={(d) => setDecisions((prev) => [d, ...prev].slice(0, 10))}
        />

        <Tabs defaultTab="dashboard">
          <TabList className="self-start">
            <TabTrigger id="dashboard">Dashboard</TabTrigger>
            <TabTrigger
              id="inbox"
              badge={
                pendingApprovals.length > 0 ? (
                  <Badge variant="accent">{pendingApprovals.length}</Badge>
                ) : null
              }
            >
              Inbox
            </TabTrigger>
            <TabTrigger id="ideas">Ideas</TabTrigger>
            <TabTrigger id="audit">Audit</TabTrigger>
          </TabList>

          <TabContent id="dashboard">
            <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_400px]">
              {/* LEFT RAIL */}
              <aside className="order-2 flex flex-col gap-4 lg:order-1">
                <BlurFade delay={0.04}>
                  <OrgChartCard
                    pendingByAgent={pendingByAgent}
                    heartbeats={brief.heartbeats ?? []}
                    onSelect={openAgentDrawer}
                    taskCountsByOwner={taskCountsByOwner}
                  />
                </BlurFade>

                {brief.roadmapStatus && (
                  <BlurFade delay={0.1}>
                    <RoadmapStatusCard initialStatus={brief.roadmapStatus} />
                  </BlurFade>
                )}

                <BlurFade delay={0.16}>
                  <TicketsCard />
                </BlurFade>
              </aside>

              {/* CENTER — Goals Kanban */}
              <section className="order-1 flex flex-col gap-5 lg:order-2">
                <BlurFade delay={0.04}>
                  <TaskKanban initialTasks={brief.tasks ?? []} />
                </BlurFade>
              </section>

              {/* RIGHT RAIL — pending approvals */}
              <aside className="order-3 flex flex-col gap-4">
                <BlurFade delay={0.04}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                        Waiting on your OK
                      </h2>
                      <div className="flex items-center gap-2">
                        {pendingApprovals.length > 0 && (
                          <Badge variant="accent">{pendingApprovals.length}</Badge>
                        )}
                        <ViewAllInboxLink />
                      </div>
                    </div>
                    <p className="text-[12px] text-[var(--text-muted)]">
                      Things your team drafted that need a yes or no.
                    </p>
                    {approvalError && (
                      <p className="text-[12px] text-[var(--color-danger)]">{approvalError}</p>
                    )}

                    {pendingApprovals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--border-default)]/70 py-10 text-center">
                        <span className="text-3xl text-[var(--text-muted)]" aria-hidden>
                          ✓
                        </span>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          You&apos;re all caught up.
                        </p>
                        <p className="max-w-[220px] text-[12px] text-[var(--text-muted)]">
                          Nothing is waiting on you. Your team will queue the next call.
                        </p>
                      </div>
                    ) : (
                      <>
                        {heroApproval && (
                          <HeroApprovalCard
                            action={heroApproval}
                            pending={pendingActionId === heroApproval.id}
                            onTransition={transitionAction}
                            onOpenDetail={(a) => setOpenActionId(a.id)}
                          />
                        )}
                        {restApprovals.length > 0 && (
                          <div className="flex flex-col gap-2.5">
                            {restApprovals.map((action) => (
                              <ApprovalRow
                                key={action.id}
                                action={action}
                                pending={pendingActionId === action.id}
                                onTransition={transitionAction}
                                onOpenDetail={(a) => setOpenActionId(a.id)}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </BlurFade>

                {recentExecutions.length > 0 && (
                  <BlurFade delay={0.12}>
                    <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        Just shipped
                      </h3>
                      <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                        Stuff you approved and what came of it.
                      </p>
                      <div className="mt-3 flex flex-col gap-3">
                        {recentExecutions.map((action) => (
                          <ExecutedActionRow key={action.id} action={action} />
                        ))}
                      </div>
                    </div>
                  </BlurFade>
                )}
              </aside>
            </section>
          </TabContent>

          <TabContent id="inbox">
            <InboxTab
              pendingActionId={pendingActionId}
              approvalError={approvalError}
              onTransition={transitionAction}
            />
          </TabContent>

          <TabContent id="ideas">
            <IdeasTab />
          </TabContent>

          <TabContent id="audit">
            <AuditTimeline />
          </TabContent>
        </Tabs>
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
        agentKind={selectedAgent}
        suggestedPrompts={brief.nextBestQuestions}
        onActionsCreated={refreshBrief}
      />
    </main>
  );
}

function ViewAllInboxLink() {
  const { setActiveTab } = useTabsContext();
  return (
    <button
      type="button"
      onClick={() => setActiveTab('inbox')}
      className="text-[11px] font-medium text-[var(--accent-primary)] hover:underline"
    >
      View all →
    </button>
  );
}

function ExecutedActionRow({ action }: { action: CompanyAction }) {
  const isFailed = action.status === 'failed';
  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isFailed ? 'default' : 'accent'}>{isFailed ? 'hit a snag' : 'done'}</Badge>
        <span className="text-[11px] font-medium text-[var(--accent-primary)]">
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
          <summary className="cursor-pointer text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            See what came back
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words border border-[var(--border-default)] bg-[var(--bg-primary)] p-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
            {JSON.stringify(action.resultJson, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
