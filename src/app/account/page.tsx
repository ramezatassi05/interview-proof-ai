'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';
import { LoadingOverlay } from '@/components/ui/Spinner';
import { MagicCard } from '@/components/ui/magic-card';
import { BlurFade } from '@/components/ui/blur-fade';
import { NumberTicker } from '@/components/ui/number-ticker';
import { CREDITS_PER_REPORT } from '@/lib/stripe';
import type { RiskBand, RoundType } from '@/types';

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
  creditBalance: number;
  reports: ReportSummary[];
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

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { balance, openPurchaseModal, refreshBalance } = useCredits();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login?redirect=/account');
      return;
    }

    const fetchAccount = async () => {
      try {
        const res = await fetch('/api/account');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/login?redirect=/account');
            return;
          }
          throw new Error('Failed to fetch account data');
        }
        const result = await res.json();
        setData(result.data);
        // Sync credits balance with the provider
        refreshBalance();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [user, authLoading, router, refreshBalance]);

  if (authLoading || loading) {
    return (
      <AppLayout showIntelligencePanel={false}>
        <div className="flex items-center justify-center py-24">
          <LoadingOverlay message="Loading account..." />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout showIntelligencePanel={false}>
        <div className="rounded-lg border border-[var(--color-danger)] border-opacity-30 bg-[var(--color-danger-muted)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--color-danger)]">Error</h2>
          <p className="mt-2 text-[var(--color-danger)]">{error || 'Failed to load account'}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showIntelligencePanel={false}>
      <BlurFade delay={0}>
        <h1 className="mb-8 text-2xl font-bold text-[var(--text-primary)]">Account</h1>
      </BlurFade>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <BlurFade delay={0.05}>
          <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)]">
            <Card className="border-0 bg-transparent">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Email</p>
                    <p className="font-medium text-[var(--text-primary)]">{data.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MagicCard>
        </BlurFade>

        {/* Credits Card */}
        <BlurFade delay={0.1}>
          <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)]">
            <Card className="border-0 bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Credits</CardTitle>
                <Button variant="accent" size="sm" onClick={openPurchaseModal}>
                  Buy Credits
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[var(--text-primary)]">
                    {balance > 0 ? <NumberTicker value={balance} /> : '0'}
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    credit{balance !== 1 ? 's' : ''} remaining
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {CREDITS_PER_REPORT} credits unlock one full diagnostic report.
                </p>
                {balance > 0 && (
                  <p className="mt-1 text-sm text-[var(--accent-primary)]">
                    You can unlock {Math.floor(balance / CREDITS_PER_REPORT)} report
                    {Math.floor(balance / CREDITS_PER_REPORT) !== 1 ? 's' : ''}.
                  </p>
                )}
              </CardContent>
            </Card>
          </MagicCard>
        </BlurFade>
      </div>

      {/* Reports History */}
      <div className="mt-8">
        <BlurFade delay={0.15}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Reports</h2>
            <Link href="/new">
              <Button size="sm">New Analysis</Button>
            </Link>
          </div>
        </BlurFade>

        {data.reports.length === 0 ? (
          <BlurFade delay={0.2}>
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-[var(--text-secondary)]">
                  No reports yet. Start your first diagnostic!
                </p>
                <Link href="/new">
                  <Button className="mt-4">Start Analysis</Button>
                </Link>
              </CardContent>
            </Card>
          </BlurFade>
        ) : (
          <div className="space-y-3">
            {data.reports.map((report, i) => (
              <BlurFade key={report.id} delay={0.2 + i * 0.03}>
                <Link href={`/r/${report.id}${report.paidUnlocked ? '/full' : ''}`}>
                  <Card className="transition-colors hover:border-[var(--border-accent)]">
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">
                            {report.companyName ? `${report.companyName} ` : ''}
                            {report.roundType.charAt(0).toUpperCase() +
                              report.roundType.slice(1)}{' '}
                            Interview
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {getRelativeDate(report.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {report.readinessScore !== null && (
                          <span className="text-lg font-bold text-[var(--text-primary)]">
                            {report.readinessScore}
                          </span>
                        )}
                        {report.riskBand && (
                          <Badge variant={riskBandToVariant(report.riskBand)}>
                            {report.riskBand}
                          </Badge>
                        )}
                        {report.paidUnlocked ? (
                          <Badge variant="low">Unlocked</Badge>
                        ) : (
                          <Badge variant="default">Free</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </BlurFade>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
