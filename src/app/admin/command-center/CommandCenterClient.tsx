'use client';

import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { BlurFade } from '@/components/ui/blur-fade';
import { BorderBeam } from '@/components/ui/border-beam';
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
import { MissionStatusBar } from './MissionStatusBar';
import {
  ApprovalDetailModal,
  ApprovalRow,
  type CompanyAction,
} from './_approvals';
import { InboxTab } from './InboxTab';
import { RejectActionDialog } from './RejectActionDialog';
import { IdeasTab } from './IdeasTab';
import { AuditTimeline } from './AuditTimeline';
import { TicketsCard } from './artifacts';
import { BodySection } from './_section-frame';

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
  const [rejectTarget, setRejectTarget] = useState<CompanyAction | null>(null);

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
    async (id: string, status: 'approved' | 'rejected', feedback?: string | null) => {
      setApprovalError(null);
      setPendingActionId(id);
      const prevActions = actions;
      setActions((current) => current.filter((a) => a.id !== id));
      try {
        const body: Record<string, unknown> = { status };
        if (status === 'rejected' && feedback) body.feedback = feedback;
        const res = await fetch(`/api/admin/company-agent/actions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
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

  const requestReject = useCallback((action: CompanyAction) => {
    setRejectTarget(action);
  }, []);

  const confirmReject = useCallback(
    async (id: string, feedback: string | null) => {
      setRejectTarget(null);
      await transitionAction(id, 'rejected', feedback);
    },
    [transitionAction]
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

  const hasPendingApprovals = pendingApprovals.length > 0;
  const agentsOnline = (brief.heartbeats ?? []).length || COMPANY_AGENT_KINDS.length;
  const nextBeatLabelText = (() => {
    if (!nextHeartbeatIso) return '—';
    const diffMs = new Date(nextHeartbeatIso).getTime() - Date.now();
    if (diffMs <= 0) return 'now';
    const min = Math.floor(diffMs / 60_000);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 48) return `${hr}h`;
    return `${Math.floor(hr / 24)}d`;
  })();

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <MissionStatusBar
        agentsOnline={agentsOnline}
        pendingCount={pendingApprovals.length}
        nextBeatLabel={nextBeatLabelText}
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-6 pt-2 sm:gap-10 sm:px-6 sm:pb-8 sm:pt-3">
        <Tabs defaultTab="dashboard">
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
            decisionsStrip={
              <DecisionsStrip
                decisions={decisions}
                onCreated={(d) => setDecisions((prev) => [d, ...prev].slice(0, 10))}
              />
            }
            tabList={
              <TabList className="self-start">
                <TabTrigger id="dashboard">Dashboard</TabTrigger>
                <TabTrigger
                  id="inbox"
                  badge={
                    hasPendingApprovals ? (
                      <Badge variant="accent">{pendingApprovals.length}</Badge>
                    ) : null
                  }
                >
                  Inbox
                </TabTrigger>
                <TabTrigger id="ideas">Ideas</TabTrigger>
                <TabTrigger id="audit">Audit</TabTrigger>
              </TabList>
            }
          />

          <TabContent id="dashboard">
            <section className="grid gap-x-8 gap-y-10 lg:grid-cols-[300px_minmax(0,1fr)_380px]">
              {/* LEFT RAIL */}
              <aside className="order-2 flex flex-col gap-10 lg:order-1">
                <BlurFade delay={0.04}>
                  <BodySection
                    index="01"
                    eyebrow="Team"
                    title="Your team"
                    tagline="Direct reports and their pulse. Tap a row to talk."
                  >
                    <OrgChartCard
                      pendingByAgent={pendingByAgent}
                      heartbeats={brief.heartbeats ?? []}
                      onSelect={openAgentDrawer}
                      taskCountsByOwner={taskCountsByOwner}
                    />
                  </BodySection>
                </BlurFade>

                {brief.roadmapStatus && (
                  <BlurFade delay={0.1}>
                    <BodySection
                      eyebrow="Roadmap"
                      title="What grounds them"
                      tagline="The CSV files your agents read before they propose anything."
                    >
                      <RoadmapStatusCard initialStatus={brief.roadmapStatus} />
                    </BodySection>
                  </BlurFade>
                )}

                <BlurFade delay={0.16}>
                  <BodySection
                    eyebrow="Tickets"
                    title="In flight between agents"
                    tagline="Work one director filed against another."
                  >
                    <TicketsCard />
                  </BodySection>
                </BlurFade>
              </aside>

              {/* CENTER — Goals Kanban */}
              <section className="order-1 flex flex-col gap-5 lg:order-2">
                <BlurFade delay={0.04}>
                  <BodySection
                    index="02"
                    eyebrow="Goals"
                    title="What everyone is moving"
                    tagline="Drag a card across columns to update where it sits."
                    action={
                      <span className="font-serif text-[15px] font-medium tabular-nums text-[var(--text-muted)]">
                        {(brief.tasks ?? []).length}
                      </span>
                    }
                    divider
                  >
                    <TaskKanban initialTasks={brief.tasks ?? []} />
                  </BodySection>
                </BlurFade>
              </section>

              {/* RIGHT RAIL — pending approvals: editorial frame + surfaced action panel with BorderBeam */}
              <aside className="order-3 flex flex-col gap-10">
                <BlurFade delay={0.04}>
                  <BodySection
                    index="03"
                    eyebrow="Decisions"
                    title="Waiting on your OK"
                    tagline="Things your team drafted that need a yes or no."
                    muted={!hasPendingApprovals}
                    action={
                      <div className="flex items-center gap-3">
                        {hasPendingApprovals && (
                          <Badge variant="accent">{pendingApprovals.length}</Badge>
                        )}
                        <ViewAllInboxLink />
                      </div>
                    }
                  >
                    <div
                      className={`relative bg-[var(--bg-card)] ${
                        hasPendingApprovals
                          ? 'border border-[var(--border-accent)]/50 p-4'
                          : 'border border-[var(--border-default)]/60 p-4'
                      }`}
                    >
                      {hasPendingApprovals && (
                        <BorderBeam
                          size={220}
                          duration={11}
                          colorFrom="var(--accent-primary)"
                          colorTo="var(--accent-secondary)"
                        />
                      )}

                      {approvalError && (
                        <p className="mb-3 text-[12px] text-[var(--color-danger)]">{approvalError}</p>
                      )}

                      {!hasPendingApprovals ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
                          <span className="text-2xl text-[var(--text-muted)]" aria-hidden>
                            ✓
                          </span>
                          <p className="text-[13px] font-medium text-[var(--text-primary)]">
                            You&apos;re all caught up.
                          </p>
                          <p className="max-w-[220px] text-[11.5px] text-[var(--text-muted)]">
                            Your team will queue the next call.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {heroApproval && (
                            <HeroApprovalCard
                              action={heroApproval}
                              pending={pendingActionId === heroApproval.id}
                              onTransition={transitionAction}
                              onRequestReject={requestReject}
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
                                  onRequestReject={requestReject}
                                  onOpenDetail={(a) => setOpenActionId(a.id)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </BodySection>
                </BlurFade>

                {recentExecutions.length > 0 && (
                  <BlurFade delay={0.12}>
                    <BodySection
                      eyebrow="Just shipped"
                      title="What came back"
                      tagline="Recent actions you approved and the result."
                    >
                      <div className="flex flex-col gap-3">
                        {recentExecutions.map((action) => (
                          <ExecutedActionRow key={action.id} action={action} />
                        ))}
                      </div>
                    </BodySection>
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
              onRequestReject={requestReject}
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
        onRequestReject={requestReject}
      />

      <RejectActionDialog
        key={rejectTarget?.id ?? 'none'}
        action={rejectTarget}
        open={!!rejectTarget}
        pending={rejectTarget ? pendingActionId === rejectTarget.id : false}
        onOpenChange={(next) => {
          if (!next) setRejectTarget(null);
        }}
        onConfirm={confirmReject}
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
