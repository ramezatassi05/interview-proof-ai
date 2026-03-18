'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BlurFade } from '@/components/ui/blur-fade';
import { TextAnimate } from '@/components/ui/text-animate';
import { MagicCard } from '@/components/ui/magic-card';
import { BorderBeam } from '@/components/ui/border-beam';
import { DotPattern } from '@/components/ui/dot-pattern';
import { ProgressBar } from '@/components/ui/ProgressBar';
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

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  totalEarned: number;
  bonusPerReferral: number;
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

function ScoreSparkline({ scores }: { scores: number[] }) {
  const width = 120;
  const height = 40;
  const padding = 4;
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const range = max - min || 1;

  const points = scores.map((score, i) => {
    const x = padding + (i / (scores.length - 1)) * (width - padding * 2);
    const y = height - padding - ((score - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const trending = scores[scores.length - 1] >= scores[0];
  const color = trending ? 'var(--color-success)' : 'var(--color-danger)';

  return (
    <svg width={width} height={height} className="mt-1">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r={3}
          fill={color}
        />
      )}
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { balance } = useCredits();
  const [data, setData] = useState<AccountData | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [insights, setInsights] = useState<AggregateInsightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login?redirect=/dashboard');
      return;
    }

    const fetchAll = async () => {
      try {
        const [accountRes, referralRes, insightsRes] = await Promise.allSettled([
          fetch('/api/account'),
          fetch('/api/referral'),
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

        if (referralRes.status === 'fulfilled' && referralRes.value.ok) {
          const result = await referralRes.value.json();
          setReferralData(result.data);
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

  const recentReports = useMemo(() => data?.reports.slice(0, 5) ?? [], [data]);

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

  // Last 5 scored reports for sparkline (oldest first)
  const sparklineScores = useMemo(() => {
    const scored = scoredReports
      .slice(0, 5)
      .map((r) => r.readinessScore as number)
      .reverse();
    return scored.length >= 2 ? scored : [];
  }, [scoredReports]);

  const greeting = getGreeting();
  const firstName = data?.name
    ? data.name.split(/\s+/)[0].charAt(0).toUpperCase() + data.name.split(/\s+/)[0].slice(1).toLowerCase()
    : data?.email
      ? extractFirstName(data.email)
      : '';

  const handleCopyReferral = useCallback(() => {
    if (!referralData) return;
    const url = `${window.location.origin}/auth/login?ref=${referralData.referralCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    });
  }, [referralData]);

  // Subtitle based on user's data
  const subtitle = useMemo(() => {
    if (!data || totalReports === 0) return 'Ready to start your interview prep journey?';
    if (avgScore !== null && insights?.avgReadinessScore) {
      const diff = avgScore - insights.avgReadinessScore;
      if (diff > 5) return `You're scoring ${diff} points above average. Keep it up!`;
      if (diff < -5) return `${totalReports} report${totalReports !== 1 ? 's' : ''} analyzed. Let's close the gap.`;
    }
    return `${totalReports} report${totalReports !== 1 ? 's' : ''} analyzed. ${avgScore !== null ? `Avg score: ${avgScore}.` : ''}`;
  }, [data, totalReports, avgScore, insights]);

  if (authLoading || loading) {
    return (
      <AppLayout showIntelligencePanel={false}>
        {/* Greeting skeleton */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-5 w-80" />
        </div>
        {/* Stats skeleton */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        {/* Goal skeleton */}
        <Skeleton className="mb-8 h-20 rounded-2xl" />
        {/* Actions skeleton */}
        <div className="mb-8 flex gap-3">
          <Skeleton className="h-11 w-36 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
        {/* Reports skeleton */}
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

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

  const weeklyGoal = 3;

  return (
    <AppLayout showIntelligencePanel={false}>
      {/* Personalized Greeting Header */}
      <BlurFade delay={0}>
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8">
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

      {/* Stats Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Reports */}
        <BlurFade delay={0.05}>
          <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {totalReports > 0 ? <NumberTicker value={totalReports} /> : '0'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">Total Reports</p>
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        {/* Average Score */}
        <BlurFade delay={0.1}>
          <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div className="flex-1">
                <p
                  className="text-2xl font-bold"
                  style={{ color: avgScore !== null ? getScoreColor(avgScore) : 'var(--text-primary)' }}
                >
                  {avgScore !== null ? <NumberTicker value={avgScore} /> : '\u2014'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">Avg Score</p>
              </div>
            </div>
            {sparklineScores.length > 0 && <ScoreSparkline scores={sparklineScores} />}
          </MagicCard>
        </BlurFade>

        {/* Credits Balance */}
        <BlurFade delay={0.15}>
          <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--accent-primary)]">
                  {balance > 0 ? <NumberTicker value={balance} /> : '0'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">Credits</p>
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        {/* This Week */}
        <BlurFade delay={0.2}>
          <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-success)]/10 text-[var(--color-success)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {reportsThisWeek > 0 ? <NumberTicker value={reportsThisWeek} /> : '0'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">This Week</p>
              </div>
            </div>
          </MagicCard>
        </BlurFade>
      </div>

      {/* Weekly Goal */}
      <BlurFade delay={0.25}>
        <Card className="mb-8">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">Weekly Goal</span>
                <Badge variant={reportsThisWeek >= weeklyGoal ? 'success' : 'default'}>
                  {reportsThisWeek}/{weeklyGoal}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {reportsThisWeek >= weeklyGoal
                  ? 'Goal reached! You\'re on fire.'
                  : reportsThisWeek > 0
                    ? `${weeklyGoal - reportsThisWeek} more to hit your goal`
                    : 'Run your first analysis this week'}
              </p>
            </div>
            <ProgressBar
              value={reportsThisWeek}
              max={weeklyGoal}
              variant="accent"
              size="sm"
              showValue={false}
            />
          </CardContent>
        </Card>
      </BlurFade>

      {/* Quick Actions */}
      <BlurFade delay={0.3}>
        <div className="mb-8 flex flex-wrap gap-3">
          <Link href="/new">
            <Button variant="gradient" rounded>
              New Analysis
            </Button>
          </Link>
          <Link href="/wallet">
            <Button variant="secondary" rounded>
              View Wallet
            </Button>
          </Link>
          {referralData && (
            <Button variant="secondary" rounded onClick={handleCopyReferral}>
              {referralCopied ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Share Referral
                </>
              )}
            </Button>
          )}
        </div>
      </BlurFade>

      {/* Recent Reports */}
      <div>
        <BlurFade delay={0.35}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Reports</h2>
            {totalReports > 5 && (
              <Link
                href="/account"
                className="text-sm text-[var(--accent-primary)] hover:underline"
              >
                View all
              </Link>
            )}
          </div>
        </BlurFade>

        {recentReports.length === 0 ? (
          <BlurFade delay={0.4}>
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-12 text-center">
              <BorderBeam size={250} duration={12} delay={0} />
              <div className="relative">
                <p className="text-lg font-medium text-[var(--text-primary)]">
                  No reports yet
                </p>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Upload your resume and job description to get your first diagnostic.
                </p>
                <Link href="/new">
                  <Button variant="gradient" rounded className="mt-6">
                    Start Your First Analysis
                  </Button>
                </Link>
              </div>
            </div>
          </BlurFade>
        ) : (
          <div className="space-y-3">
            {recentReports.map((report, i) => (
              <BlurFade key={report.id} delay={0.4 + i * 0.05}>
                <Link href={`/r/${report.id}${report.paidUnlocked ? '/full' : ''}`}>
                  <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] transition-colors duration-200 hover:border-[var(--border-accent)]">
                    <div className="flex items-center justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--text-primary)]">
                          {report.companyName ? `${report.companyName} ` : ''}
                          {report.roundType.charAt(0).toUpperCase() + report.roundType.slice(1)}{' '}
                          Interview
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-[var(--text-muted)]">
                            {getRelativeDate(report.createdAt)}
                          </span>
                          {report.top3Risks.length > 0 && (
                            <>
                              <span className="text-xs text-[var(--text-muted)]">&middot;</span>
                              <span className="truncate text-xs text-[var(--text-secondary)]">
                                {report.top3Risks[0].title}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-shrink-0 items-center gap-3">
                        {report.readinessScore !== null && (
                          <span
                            className="text-lg font-bold"
                            style={{ color: getScoreColor(report.readinessScore) }}
                          >
                            {report.readinessScore}
                          </span>
                        )}
                        {report.riskBand && (
                          <Badge variant={riskBandToVariant(report.riskBand)}>
                            {report.riskBand}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </MagicCard>
                </Link>
              </BlurFade>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
