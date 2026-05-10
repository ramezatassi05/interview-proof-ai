'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { TextAnimate } from '@/components/ui/text-animate';
import { relativeTime } from '@/lib/relative-time';
import { MetaStat } from './_primitives';

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
  decisionsStrip?: ReactNode;
  tabList?: ReactNode;
  chatSlot?: ReactNode;
}

function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
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
  decisionsStrip,
  tabList,
  chatSlot,
}: DashboardHeroProps) {
  const now = new Date();
  const greeting = greetingFor(now);
  const dateLine = formatDateLong(now);
  const hasPending = pendingCount > 0;

  return (
    <header className="relative overflow-hidden border-b border-[var(--border-default)]">
      {/* Decorative radial backdrop — subtle, sets the 'stage' tone */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: hasPending
            ? 'radial-gradient(ellipse 80% 60% at 85% 0%, color-mix(in oklab, var(--accent-primary) 8%, transparent), transparent 70%)'
            : 'radial-gradient(ellipse 80% 60% at 85% 0%, color-mix(in oklab, var(--accent-primary) 4%, transparent), transparent 70%)',
        }}
      />

      <div className="relative flex flex-col gap-10 pb-7 pt-2 sm:gap-12 sm:pb-9">
        {/* TOP STRIP — date + refresh */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[10.5px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span aria-hidden className="h-px w-6 bg-[var(--text-muted)]/40" />
            <span>{dateLine}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            loading={refreshing}
            onClick={onRefresh}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Refresh
          </Button>
        </div>

        {/* MAIN STAGE — greeting (left) paired with primary metric or chat (right) */}
        <div
          className={`grid grid-cols-1 gap-10 sm:items-end sm:gap-12 ${
            chatSlot
              ? 'sm:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]'
              : 'sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-16'
          }`}
        >
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-[42px] font-semibold leading-[1.05] tracking-tight text-[var(--text-primary)] sm:text-[56px]">
              <TextAnimate animation="blurInUp" by="word" duration={0.45}>
                {`${greeting}, ${viewerFirstName}.`}
              </TextAnimate>
            </h1>
            <p className="max-w-xl text-[17px] leading-relaxed text-[var(--text-secondary)]">
              {summaryLine(pendingCount)}
            </p>
          </div>

          {chatSlot ? (
            // RIGHT COLUMN with chat — condensed pending counter on top, chat below.
            <div className="flex flex-col items-start gap-4 sm:items-stretch">
              <div className="flex items-baseline justify-between gap-3 sm:justify-end">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  {pendingCount === 1 ? 'pending decision' : 'pending decisions'}
                </span>
                <span
                  className={`font-serif font-semibold leading-none tracking-[-0.02em] tabular-nums ${
                    hasPending
                      ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent text-[34px]'
                      : 'text-[var(--text-muted)]/50 text-[28px]'
                  }`}
                >
                  {pendingCount.toLocaleString()}
                </span>
              </div>
              {chatSlot}
            </div>
          ) : (
            // PRIMARY METRIC — dramatic when > 0, calm when 0 (legacy layout)
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {pendingCount === 1 ? 'pending decision' : 'pending decisions'}
              </span>
              <span
                className={`font-serif font-semibold leading-[0.85] tracking-[-0.04em] tabular-nums ${
                  hasPending
                    ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent text-[88px] sm:text-[140px]'
                    : 'text-[var(--text-muted)]/40 text-[64px] sm:text-[96px]'
                }`}
              >
                {pendingCount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* SECONDARY METRICS — supporting context, demoted weight */}
        <div className="flex flex-wrap items-baseline gap-x-12 gap-y-5">
          <SecondaryMetric label="revenue (est.)" value={formatMoneyCompact(estimatedRevenueCents)} />
          <SecondaryMetric label="unlock rate" value={`${Math.round(unlockRate * 100)}%`} />
          <SecondaryMetric label="active sessions" value={activeCompanySessions.toLocaleString()} />
        </div>

        {/* META STRIP — quietest tier */}
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-[var(--text-muted)]">
          <MetaStat value={formatCount(totalUsers)} label="users" />
          <span aria-hidden className="text-[var(--text-muted)]/60">·</span>
          <MetaStat value={formatCount(totalReports)} label="reports" />
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

        {/* DECISIONS ANCHOR — quiet inline strip */}
        {decisionsStrip && (
          <div className="border-t border-[var(--border-default)]/60 pt-5">{decisionsStrip}</div>
        )}

        {/* TAB ROW — sits inside the header surface */}
        {tabList && <div className="-mb-1">{tabList}</div>}
      </div>
    </header>
  );
}

function SecondaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
        {label}
      </span>
      <span className="font-serif text-[28px] font-medium leading-none tracking-tight tabular-nums text-[var(--text-primary)] sm:text-[34px]">
        {value}
      </span>
    </div>
  );
}
