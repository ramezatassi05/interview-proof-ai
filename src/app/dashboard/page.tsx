'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';
import { LoadingOverlay } from '@/components/ui/Spinner';
import type { RiskBand, RoundType } from '@/types';

interface ReportSummary {
  id: string;
  roundType: RoundType;
  createdAt: string;
  paidUnlocked: boolean;
  readinessScore: number | null;
  riskBand: RiskBand | null;
  companyName: string | null;
}

interface AccountData {
  email: string;
  creditBalance: number;
  reports: ReportSummary[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { balance } = useCredits();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login?redirect=/dashboard');
      return;
    }

    const fetchAccount = async () => {
      try {
        const res = await fetch('/api/account');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/login?redirect=/dashboard');
            return;
          }
          return;
        }
        const result = await res.json();
        setData(result.data);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <AppLayout showIntelligencePanel={false}>
        <div className="flex items-center justify-center py-24">
          <LoadingOverlay message="Loading dashboard..." />
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

  const totalReports = data.reports.length;
  const scoredReports = data.reports.filter((r) => r.readinessScore !== null);
  const avgScore =
    scoredReports.length > 0
      ? Math.round(scoredReports.reduce((sum, r) => sum + (r.readinessScore ?? 0), 0) / scoredReports.length)
      : null;
  const recentReports = data.reports.slice(0, 5);

  return (
    <AppLayout showIntelligencePanel={false}>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Welcome back. Here&apos;s your interview readiness overview.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-3xl font-bold text-[var(--text-primary)]">{totalReports}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Total Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {avgScore !== null ? avgScore : '—'}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Average Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-3xl font-bold text-[var(--accent-primary)]">{balance}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Credits Balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-3">
        <Link href="/new">
          <Button>New Analysis</Button>
        </Link>
        <Link href="/wallet">
          <Button variant="secondary">View Wallet</Button>
        </Link>
      </div>

      {/* Recent Reports */}
      <div>
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

        {recentReports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-[var(--text-secondary)]">
                No reports yet. Upload your resume and job description to get started.
              </p>
              <Link href="/new">
                <Button className="mt-4">Start Your First Analysis</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentReports.map((report) => (
              <Link
                key={report.id}
                href={`/r/${report.id}${report.paidUnlocked ? '/full' : ''}`}
              >
                <Card className="transition-colors hover:border-[var(--border-accent)]">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {report.companyName ? `${report.companyName} ` : ''}
                        {report.roundType.charAt(0).toUpperCase() + report.roundType.slice(1)}{' '}
                        Interview
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
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
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
