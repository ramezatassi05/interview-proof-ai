'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

import { AppLayout } from '@/components/layout/AppLayout';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BlurFade } from '@/components/ui/blur-fade';
import { TextAnimate } from '@/components/ui/text-animate';
import { MagicCard } from '@/components/ui/magic-card';
import { BorderBeam } from '@/components/ui/border-beam';
import { DotPattern } from '@/components/ui/dot-pattern';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ShineBorder } from '@/components/ui/shine-border';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import type { OrbitalNode } from '@/components/ui/radial-orbital-timeline';
import type { RiskBand, RoundType, AggregateInsightStats } from '@/types';

interface ReportSummary {
  id: string;
  roundType: RoundType;
  createdAt: string;
  paidUnlocked: boolean;
  readinessScore: number | null;
  riskBand: RiskBand | null;
  companyName: string | null;
  top3Risks: { title: string; severity: string }[];
  top3StudyPlan: { task: string; timeEstimateMinutes: number }[];
}

interface AccountData {
  email: string;
  name: string | null;
  creditBalance: number;
  reports: ReportSummary[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function extractFirstName(email: string): string {
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  const name = parts[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--color-success)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

/* ── Icons (inline SVGs) ── */

function IconNewAnalysis() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconReports() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function IconStudy() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
    </svg>
  );
}

function IconRisk() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function IconGoal() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconAccount() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

/* ── Center Hub ── */

function CenterHub({
  initial,
  avgScore,
  totalReports,
}: {
  initial: string;
  avgScore: number | null;
  totalReports: number;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center animate-orbital-breathe">
      {/* Gradient avatar circle */}
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full overflow-hidden">
        <ShineBorder
          shineColor={['#6366F1', '#818CF8', '#a78bfa']}
          borderWidth={2}
          duration={8}
        />
        <div
          className="flex h-full w-full items-center justify-center rounded-full text-2xl font-bold text-white"
          style={{ background: 'var(--accent-gradient)' }}
        >
          {initial}
        </div>
      </div>

      {/* Score */}
      <div className="mt-2 text-center">
        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {avgScore !== null ? <NumberTicker value={avgScore} /> : '\u2014'}
        </p>
        <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          {totalReports > 0 ? 'Avg Score' : 'Your Hub'}
        </p>
      </div>
    </div>
  );
}

/* ── Mobile Node Card ── */

function MobileNodeCard({
  node,
  onNavigate,
}: {
  node: OrbitalNode;
  onNavigate: (href: string) => void;
}) {
  return (
    <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 cursor-pointer transition-all duration-200 hover:border-[var(--border-accent)]">
      <div
        className="flex items-center gap-3"
        onClick={() => node.href && onNavigate(node.href)}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: `color-mix(in srgb, ${node.color ?? 'var(--accent-primary)'} 15%, var(--bg-card))`,
            color: node.color ?? 'var(--accent-primary)',
          }}
        >
          {node.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {node.title}
            </p>
            {node.badge && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: node.color ?? 'var(--accent-primary)' }}
              >
                {node.badge}
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {node.description}
          </p>
        </div>
        <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </MagicCard>
  );
}

/* ── Dashboard Page ── */

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AccountData | null>(null);
  const [insights, setInsights] = useState<AggregateInsightStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login?redirect=/dashboard');
      return;
    }

    const fetchAll = async () => {
      try {
        const [accountRes, insightsRes] = await Promise.allSettled([
          fetch('/api/account'),
          fetch('/api/insights'),
        ]);

        if (accountRes.status === 'fulfilled' && accountRes.value.ok) {
          const result = await accountRes.value.json();
          setData(result.data);
        } else if (
          accountRes.status === 'fulfilled' &&
          accountRes.value.status === 401
        ) {
          router.push('/auth/login?redirect=/dashboard');
          return;
        }

        if (insightsRes.status === 'fulfilled' && insightsRes.value.ok) {
          const result = await insightsRes.value.json();
          setInsights(result.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user, authLoading, router]);

  const totalReports = data?.reports.length ?? 0;
  const scoredReports = useMemo(
    () => data?.reports.filter((r) => r.readinessScore !== null) ?? [],
    [data]
  );
  const avgScore = useMemo(
    () =>
      scoredReports.length > 0
        ? Math.round(
            scoredReports.reduce((sum, r) => sum + (r.readinessScore ?? 0), 0) /
              scoredReports.length
          )
        : null,
    [scoredReports]
  );

  const recentReports = useMemo(() => data?.reports.slice(0, 3) ?? [], [data]);

  // Reports created this week (Monday-based)
  const reportsThisWeek = useMemo(() => {
    if (!data) return 0;
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return data.reports.filter((r) => new Date(r.createdAt) >= monday).length;
  }, [data]);

  const greeting = getGreeting();
  const firstName = data?.name
    ? data.name.split(/\s+/)[0].charAt(0).toUpperCase() + data.name.split(/\s+/)[0].slice(1).toLowerCase()
    : data?.email
      ? extractFirstName(data.email)
      : '';

  const subtitle = useMemo(() => {
    if (!data || totalReports === 0) return 'Ready to start your interview prep journey?';
    if (avgScore !== null && insights?.avgReadinessScore) {
      const diff = avgScore - insights.avgReadinessScore;
      if (diff > 5) return `You're scoring ${diff} points above average. Keep it up!`;
      if (diff < -5)
        return `${totalReports} report${totalReports !== 1 ? 's' : ''} analyzed. Let's close the gap.`;
    }
    return `${totalReports} report${totalReports !== 1 ? 's' : ''} analyzed. ${avgScore !== null ? `Avg score: ${avgScore}.` : ''}`;
  }, [data, totalReports, avgScore, insights]);

  const weeklyGoal = 3;

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  /* ── Build orbital nodes ── */
  const orbitalNodes: OrbitalNode[] = useMemo(() => {
    const nodes: OrbitalNode[] = [
      // Inner ring
      {
        id: 'new-analysis',
        title: 'New Analysis',
        description: 'Upload resume + JD to get your interview diagnostic.',
        icon: <IconNewAnalysis />,
        href: '/new',
        color: 'var(--accent-primary)',
        ring: 'inner',
        energyLevel: 100,
      },
      {
        id: 'reports',
        title: 'My Reports',
        description: 'View all your interview diagnostics and scores.',
        icon: <IconReports />,
        href: '/account',
        color: 'var(--accent-primary)',
        ring: 'inner',
        badge: totalReports > 0 ? totalReports : undefined,
        energyLevel: totalReports > 0 ? 50 : 10,
        relatedIds: ['new-analysis', 'study-plans'],
        previewContent:
          recentReports.length > 0 ? (
            <div className="space-y-2">
              {recentReports.slice(0, 2).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span style={{ color: 'var(--text-secondary)' }} className="truncate max-w-[130px]">
                    {r.companyName ?? 'Report'} &middot;{' '}
                    {r.roundType.charAt(0).toUpperCase() + r.roundType.slice(1)}
                  </span>
                  {r.readinessScore !== null && (
                    <span className="font-bold" style={{ color: getScoreColor(r.readinessScore) }}>
                      {r.readinessScore}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : undefined,
      },
      {
        id: 'study-plans',
        title: 'Study Plans',
        description: 'Personalized study roadmaps tailored to your gaps.',
        icon: <IconStudy />,
        href: '/study-intelligence',
        color: 'var(--color-success)',
        ring: 'inner',
        energyLevel: 30,
        relatedIds: ['reports', 'risk-sim'],
      },
      // Outer ring
      {
        id: 'risk-sim',
        title: 'Risk Simulator',
        description: 'Identify and address your top interview rejection risks.',
        icon: <IconRisk />,
        href: '/risk-simulation',
        color: 'var(--color-warning)',
        ring: 'outer',
        energyLevel: 30,
        relatedIds: ['reports', 'study-plans'],
      },
      {
        id: 'weekly-goal',
        title: 'Weekly Goal',
        description:
          reportsThisWeek >= weeklyGoal
            ? 'Goal reached! You\'re on fire.'
            : reportsThisWeek > 0
              ? `${weeklyGoal - reportsThisWeek} more to hit your goal this week.`
              : 'Run your first analysis this week.',
        icon: <IconGoal />,
        href: '/new',
        color: reportsThisWeek >= weeklyGoal ? 'var(--color-success)' : 'var(--accent-secondary)',
        ring: 'outer',
        badge: `${reportsThisWeek}/${weeklyGoal}`,
        energyLevel: Math.round((reportsThisWeek / weeklyGoal) * 80),
        relatedIds: ['new-analysis'],
        previewContent: (
          <div>
            <ProgressBar
              value={reportsThisWeek}
              max={weeklyGoal}
              variant="accent"
              size="sm"
              showValue={false}
            />
            <p className="mt-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {reportsThisWeek}/{weeklyGoal} analyses this week
            </p>
          </div>
        ),
      },
      {
        id: 'account',
        title: 'Account',
        description: 'Settings, history, and credits.',
        icon: <IconAccount />,
        href: '/account',
        color: 'var(--accent-secondary)',
        ring: 'outer',
        badge: data?.creditBalance !== undefined && data.creditBalance > 0 ? data.creditBalance : undefined,
        energyLevel: 10,
      },
    ];
    return nodes;
  }, [totalReports, recentReports, reportsThisWeek, weeklyGoal, data?.creditBalance]);

  const initial = firstName ? firstName.charAt(0).toUpperCase() : '?';

  /* ── Loading ── */
  if (authLoading || loading) {
    return (
      <AppLayout showIntelligencePanel={false}>
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-5 w-80" />
        </div>
        <div className="flex items-center justify-center py-24">
          <Skeleton className="h-[400px] w-[400px] rounded-full" />
        </div>
      </AppLayout>
    );
  }

  /* ── Error ── */
  if (!data) {
    return (
      <AppLayout showIntelligencePanel={false}>
        <div className="rounded-lg border border-[var(--color-danger)] border-opacity-30 bg-[var(--color-danger-muted)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--color-danger)]">Error</h2>
          <p className="mt-2 text-[var(--color-danger)]">Failed to load dashboard</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showIntelligencePanel={false}>
      {/* ── Greeting Header ── */}
      <BlurFade delay={0}>
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8">
          <DotPattern className="opacity-20 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
          <div className="relative">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              <TextAnimate animation="blurInUp" by="word">
                {`${greeting}, ${firstName}`}
              </TextAnimate>
            </h1>
            <p className="mt-2 text-[var(--text-secondary)]">{subtitle}</p>
          </div>
        </div>
      </BlurFade>

      {/* ── Desktop: Orbital Hub ── */}
      <BlurFade delay={0.1}>
        <div className="hidden md:flex items-center justify-center py-8">
          <RadialOrbitalTimeline
            nodes={orbitalNodes}
            innerRadius={160}
            outerRadius={250}
            className="h-[580px] w-full max-w-[600px]"
            onNavigate={handleNavigate}
            centerContent={
              <CenterHub
                initial={initial}
                avgScore={avgScore}
                totalReports={totalReports}
              />
            }
          />
        </div>
      </BlurFade>

      {/* ── Mobile: Hub Card + Grid ── */}
      <div className="md:hidden">
        {/* Center hub card */}
        <BlurFade delay={0.05}>
          <div className="mb-6 flex flex-col items-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
            <CenterHub initial={initial} avgScore={avgScore} totalReports={totalReports} />
          </div>
        </BlurFade>

        {/* Node grid */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {orbitalNodes.map((node, i) => (
            <BlurFade key={node.id} delay={0.1 + i * 0.05}>
              <MobileNodeCard node={node} onNavigate={handleNavigate} />
            </BlurFade>
          ))}
        </div>
      </div>

      {/* ── Recent Reports Strip ── */}
      <BlurFade delay={0.3}>
        <div className="mt-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Reports</h2>
            {totalReports > 3 && (
              <Link
                href="/account"
                className="text-xs text-[var(--accent-primary)] hover:underline"
              >
                View all
              </Link>
            )}
          </div>

          {recentReports.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-10 text-center">
              <BorderBeam size={250} duration={12} delay={0} />
              <div className="relative">
                <p className="text-sm font-medium text-[var(--text-primary)]">No reports yet</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Upload your resume and job description to get your first diagnostic.
                </p>
                <Link href="/new">
                  <button
                    className="mt-4 rounded-full px-5 py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
                    style={{ background: 'var(--accent-gradient)' }}
                  >
                    Start Your First Analysis
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {recentReports.map((report) => (
                <Link key={report.id} href={`/r/${report.id}${report.paidUnlocked ? '/full' : ''}`}>
                  <MagicCard className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] transition-colors duration-200 hover:border-[var(--border-accent)]">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {report.companyName ? `${report.companyName} ` : ''}
                          {report.roundType.charAt(0).toUpperCase() + report.roundType.slice(1)} Interview
                        </p>
                        <span className="text-xs text-[var(--text-muted)]">
                          {getRelativeDate(report.createdAt)}
                        </span>
                      </div>
                      <div className="ml-4 flex shrink-0 items-center gap-2">
                        {report.readinessScore !== null && (
                          <span
                            className="text-base font-bold"
                            style={{ color: getScoreColor(report.readinessScore) }}
                          >
                            {report.readinessScore}
                          </span>
                        )}
                        {report.riskBand && (
                          <Badge variant={riskBandToVariant(report.riskBand)}>{report.riskBand}</Badge>
                        )}
                      </div>
                    </div>
                  </MagicCard>
                </Link>
              ))}
            </div>
          )}
        </div>
      </BlurFade>
    </AppLayout>
  );
}
