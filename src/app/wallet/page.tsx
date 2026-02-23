'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingOverlay } from '@/components/ui/Spinner';
import type { CreditLedgerEntry } from '@/types';
import { InsightOwlReading, InsightOwlWaving } from '@/components/svg/InsightOwlMascot';

interface ReferralInfo {
  referralCode: string;
  totalReferrals: number;
  totalEarned: number;
  bonusPerReferral: number;
}

const PAGE_SIZE = 20;

export default function WalletPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { balance, openPurchaseModal, refreshBalance } = useCredits();
  const [entries, setEntries] = useState<CreditLedgerEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchHistory = useCallback(async (offset: number, append: boolean) => {
    const res = await fetch(`/api/credits/history?limit=${PAGE_SIZE}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    const result = await res.json();
    setEntries((prev) => (append ? [...prev, ...result.data.entries] : result.data.entries));
    setTotalCount(result.data.totalCount);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login?redirect=/wallet');
      return;
    }

    const init = async () => {
      try {
        await Promise.all([
          fetchHistory(0, false),
          fetch('/api/referral')
            .then((r) => r.json())
            .then((r) => setReferral(r.data)),
        ]);
        refreshBalance();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, authLoading, router, fetchHistory, refreshBalance]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchHistory(entries.length, true);
    } catch {
      // Silently handle - user can retry
    } finally {
      setLoadingMore(false);
    }
  };

  const copyReferralCode = async () => {
    if (!referral) return;
    const appUrl = window.location.origin;
    const shareUrl = `${appUrl}/new?ref=${referral.referralCode}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute stats from entries
  const stats = entries.reduce(
    (acc, e) => {
      if (e.type === 'purchase') acc.purchased += e.amount;
      else if (e.type === 'spend') acc.spent += Math.abs(e.amount);
      else if (e.type === 'grant') acc.earned += e.amount;
      else if (e.type === 'refund') acc.earned += e.amount;
      return acc;
    },
    { earned: 0, spent: 0, purchased: 0 }
  );

  const getEntryDescription = (entry: CreditLedgerEntry): string => {
    const sid = entry.stripeEventId || '';
    if (sid.startsWith('grant:upload:')) return 'Upload bonus';
    if (sid.startsWith('grant:first_unlock:')) return 'First unlock bonus';
    if (sid.startsWith('grant:referral:')) return 'Referral bonus';
    if (entry.type === 'purchase') return 'Credit purchase';
    if (entry.type === 'spend') return 'Report unlock';
    if (entry.type === 'refund') return 'Refund';
    if (entry.type === 'grant') return 'Bonus credit';
    return 'Transaction';
  };

  const getTypeBadgeVariant = (type: string): 'success' | 'high' | 'accent' | 'default' => {
    switch (type) {
      case 'purchase':
      case 'grant':
        return 'success';
      case 'spend':
        return 'high';
      case 'refund':
        return 'accent';
      default:
        return 'default';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <LoadingOverlay message="Loading wallet..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Container size="sm">
            <div className="rounded-lg border border-[var(--color-danger)] border-opacity-30 bg-[var(--color-danger-muted)] p-8 text-center">
              <h2 className="text-lg font-semibold text-[var(--color-danger)]">Error</h2>
              <p className="mt-2 text-[var(--color-danger)]">{error}</p>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />

      <main className="flex-1 py-12">
        <Container size="md">
          <h1 className="mb-8 text-2xl font-bold text-[var(--text-primary)]">Credits Wallet</h1>

          {/* Balance Overview */}
          <Card className="mb-6">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-2">
                {/* Owl mascot — always visible */}
                <div style={{ animation: 'owl-enter-v2 0.7s ease-out' }}>
                  <InsightOwlReading size={96} />
                </div>
                {/* Speech bubble */}
                <div className="relative rounded-2xl bg-[var(--bg-elevated)] px-4 py-2 text-center text-sm font-medium text-[var(--text-secondary)]">
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderBottom: '8px solid var(--bg-elevated)',
                    }}
                  />
                  {balance === 0
                    ? "Let's get you some credits!"
                    : balance === 1
                      ? 'You have 1 credit ready!'
                      : balance <= 5
                        ? `You have ${balance} credits. Use them wisely!`
                        : `Nice stash! ${balance} credits ready to go.`}
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    Available Balance
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-[var(--text-primary)]">{balance}</span>
                    <span className="text-lg text-[var(--text-secondary)]">
                      credit{balance !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <Button variant="accent" onClick={openPurchaseModal}>
                  Buy Credits
                </Button>
              </div>

              {/* Stats Row */}
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[var(--border-default)] pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--color-success)]">{stats.earned}</p>
                  <p className="text-xs text-[var(--text-muted)]">Earned</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--color-danger)]">{stats.spent}</p>
                  <p className="text-xs text-[var(--text-muted)]">Spent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--accent-primary)]">
                    {stats.purchased}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Purchased</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earning Opportunities */}
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Earn Free Credits
          </h2>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {/* Upload Bonus */}
            <Card>
              <CardContent className="py-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
                  <svg
                    className="h-5 w-5 text-[var(--accent-primary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)]">Upload Bonus</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Earn <span className="font-bold text-[var(--accent-primary)]">1 credit</span>{' '}
                  every time you upload a new analysis.
                </p>
              </CardContent>
            </Card>

            {/* First Unlock Bonus */}
            <Card>
              <CardContent className="py-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-success)]/10">
                  <svg
                    className="h-5 w-5 text-[var(--color-success)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)]">First Report Bonus</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Earn <span className="font-bold text-[var(--color-success)]">2 credits</span> when
                  you unlock your first full diagnostic.
                </p>
                <Badge variant="default" className="mt-2">
                  One-time
                </Badge>
              </CardContent>
            </Card>

            {/* Referral Program */}
            <Card>
              <CardContent className="py-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-warning)]/10">
                  <svg
                    className="h-5 w-5 text-[var(--color-warning)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)]">Referral Program</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Earn <span className="font-bold text-[var(--color-warning)]">3 credits</span> when
                  your referral makes a purchase. They get 3 too!
                </p>
                {referral && referral.totalReferrals > 0 && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {referral.totalReferrals} referral{referral.totalReferrals !== 1 ? 's' : ''} so
                    far
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Referral Code */}
          {referral && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Referral Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="rounded-md bg-[var(--bg-elevated)] px-4 py-2 text-lg font-bold tracking-wider text-[var(--text-primary)]">
                        {referral.referralCode}
                      </code>
                      <Button variant="secondary" size="sm" onClick={copyReferralCode}>
                        {copied ? 'Copied!' : 'Copy Link'}
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      Share your referral link. When someone makes their first credit purchase using
                      your link, you both earn {referral.bonusPerReferral} credits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Transaction History
          </h2>
          {entries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mb-4 flex justify-center">
                  <InsightOwlWaving size={96} />
                </div>
                <p className="text-[var(--text-secondary)]">
                  No transactions yet. Start by uploading your first analysis!
                </p>
                <Button
                  variant="accent"
                  className="mt-4"
                  onClick={() => router.push('/new')}
                >
                  Upload Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--border-default)]">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={getTypeBadgeVariant(entry.type)}>
                          {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {getEntryDescription(entry)}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {new Date(entry.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          entry.amount > 0
                            ? 'text-[var(--color-success)]'
                            : 'text-[var(--color-danger)]'
                        }`}
                      >
                        {entry.amount > 0 ? '+' : ''}
                        {entry.amount}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Load More */}
                {entries.length < totalCount && (
                  <div className="border-t border-[var(--border-default)] px-6 py-4 text-center">
                    <Button variant="secondary" size="sm" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore
                        ? 'Loading...'
                        : `Load More (${totalCount - entries.length} remaining)`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
