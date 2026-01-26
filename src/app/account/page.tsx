'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';
import { LoadingOverlay } from '@/components/ui/Spinner';
import { CREDITS_PER_REPORT } from '@/lib/stripe';
import type { RiskBand, RoundType } from '@/types';

interface ReportSummary {
  id: string;
  roundType: RoundType;
  createdAt: string;
  paidUnlocked: boolean;
  readinessScore: number | null;
  riskBand: RiskBand | null;
}

interface AccountData {
  email: string;
  creditBalance: number;
  reports: ReportSummary[];
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
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <LoadingOverlay message="Loading account..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Container size="sm">
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">Error</h2>
              <p className="mt-2 text-red-600 dark:text-red-400">
                {error || 'Failed to load account'}
              </p>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 py-12">
        <Container size="md">
          <h1 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Account</h1>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{data.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credits Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Credits</CardTitle>
                <Button variant="accent" size="sm" onClick={openPurchaseModal}>
                  Buy Credits
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                    {balance}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    credit{balance !== 1 ? 's' : ''} remaining
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
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
          </div>

          {/* Reports History */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Your Reports
              </h2>
              <Link href="/new">
                <Button size="sm">New Analysis</Button>
              </Link>
            </div>

            {data.reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No reports yet. Start your first diagnostic!
                  </p>
                  <Link href="/new">
                    <Button className="mt-4">Start Analysis</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {data.reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/r/${report.id}${report.paidUnlocked ? '/full' : ''}`}
                  >
                    <Card className="transition-colors hover:border-zinc-400 dark:hover:border-zinc-600">
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {report.roundType.charAt(0).toUpperCase() + report.roundType.slice(1)}{' '}
                              Interview
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {report.readinessScore !== null && (
                            <span className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
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
                ))}
              </div>
            )}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
