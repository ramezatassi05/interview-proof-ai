'use client';

import { Button } from '@/components/ui/Button';
import { TextAnimate } from '@/components/ui/text-animate';
import { relativeTime } from '@/lib/relative-time';
import { HeroMetric, MetaStat } from './_primitives';

interface DashboardHeroProps {
  viewerFirstName: string;
  pendingCount: number;
  totalUsers: number;
  totalReports: number;
  unlockRate: number;
  estimatedRevenueCents: number;
  activeCompanySessions: number;
  spend30dCents?: number;
  capturedAt: string;
  nextHeartbeatIso: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}

function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatMoneyCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(dollars >= 10000 ? 0 : 1)}k`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(dollars);
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toLocaleString();
}

function nextBeatLabel(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 'now';
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

function summaryLine(pending: number): string {
  if (pending === 0) return 'Your team is running. Nothing waiting on you right now.';
  if (pending === 1) return 'Your team is running. 1 thing needs your call.';
  return `Your team is running. ${pending} things need your call.`;
}

export function DashboardHero({
  viewerFirstName,
  pendingCount,
  totalUsers,
  totalReports,
  unlockRate,
  estimatedRevenueCents,
  activeCompanySessions,
  spend30dCents,
  capturedAt,
  nextHeartbeatIso,
  refreshing,
  onRefresh,
}: DashboardHeroProps) {
  const greeting = greetingFor(new Date());

  return (
    <header className="flex flex-col gap-6 border-b border-[var(--border-default)] pb-7 sm:pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-[34px]">
            <TextAnimate animation="blurInUp" by="word" duration={0.35}>
              {`${greeting}, ${viewerFirstName}.`}
            </TextAnimate>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
            {summaryLine(pendingCount)}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={refreshing}
          onClick={onRefresh}
          className="w-fit"
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
        <HeroMetric
          label={pendingCount === 1 ? 'pending decision' : 'pending decisions'}
          value={pendingCount.toLocaleString()}
          gradient={pendingCount > 0}
        />
        <HeroMetric
          label="revenue (est.)"
          value={formatMoneyCompact(estimatedRevenueCents)}
        />
        <HeroMetric
          label="unlock rate"
          value={`${Math.round(unlockRate * 100)}%`}
        />
      </div>

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-[var(--text-muted)]">
        <MetaStat value={formatCount(totalUsers)} label="users" />
        <span aria-hidden className="text-[var(--text-muted)]/60">·</span>
        <MetaStat value={formatCount(totalReports)} label="reports" />
        <span aria-hidden className="text-[var(--text-muted)]/60">·</span>
        <MetaStat value={activeCompanySessions.toLocaleString()} label="sessions" />
        {typeof spend30dCents === 'number' && (
          <>
            <span aria-hidden className="text-[var(--text-muted)]/60">·</span>
            <MetaStat value={formatMoneyCompact(spend30dCents)} label="spend (30d)" />
          </>
        )}
        <span aria-hidden className="text-[var(--text-muted)]/60">·</span>
        <MetaStat value={`in ${nextBeatLabel(nextHeartbeatIso)}`} label="next beat" />
        <span aria-hidden className="text-[var(--text-muted)]/60">·</span>
        <span className="text-[12px] tabular-nums text-[var(--text-muted)]">
          last refresh {relativeTime(capturedAt)}
        </span>
      </div>
    </header>
  );
}
