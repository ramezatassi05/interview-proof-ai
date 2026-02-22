'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCredits } from '@/hooks/useCredits';
import { api, APIRequestError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CREDITS_PER_REPORT } from '@/lib/stripe';

interface PaywallCTAProps {
  reportId: string;
  totalRisks: number;
}

const FEATURES = [
  {
    text: 'See all rejection risks with evidence',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    text: 'Get targeted interview questions',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    text: 'Receive prioritized study plan',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
  },
  {
    text: '1 free rerun to track progress',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
  },
];

export function PaywallCTA({ reportId, totalRisks }: PaywallCTAProps) {
  const router = useRouter();
  const { balance, openPurchaseModal, refreshBalance } = useCredits();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasEnoughCredits = balance >= CREDITS_PER_REPORT;

  const handleUnlockWithCredits = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.unlockReport(reportId);

      if (result.data.unlocked || result.data.alreadyUnlocked) {
        refreshBalance();
        router.push(`/r/${reportId}/full`);
      } else {
        setError('Failed to unlock report.');
        setLoading(false);
      }
    } catch (err) {
      if (err instanceof APIRequestError) {
        setError(err.message);
      } else {
        setError('Failed to unlock report. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleBuyCredits = () => {
    openPurchaseModal();
  };

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-elevated)] to-[var(--accent-primary)]/10 shadow-warm shadow-[0_0_40px_rgba(255,107,53,0.15)]">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--accent-secondary)]/10" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-primary)]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--accent-secondary)]/10 rounded-full blur-3xl" />

      <div className="relative p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 mb-4">
            <svg
              className="h-4 w-4 text-[var(--accent-primary)]"
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
            <span className="text-sm font-medium text-[var(--accent-primary)]">
              Premium Diagnostic
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Unlock Full Analysis</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            {totalRisks} more risk{totalRisks !== 1 ? 's' : ''} waiting to be uncovered
          </p>
        </div>

        <ul className="mx-auto max-w-md space-y-4 mb-8">
          {FEATURES.map((feature, index) => (
            <li key={index} className="flex items-center gap-3 text-[var(--text-primary)]">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-success)]/20 text-[var(--color-success)]">
                {feature.icon}
              </div>
              <span className="text-sm font-medium">{feature.text}</span>
            </li>
          ))}
        </ul>

        <div className="text-center">
          {hasEnoughCredits ? (
            <>
              <Button
                variant="accent"
                size="lg"
                onClick={handleUnlockWithCredits}
                loading={loading}
                glow
                className="px-12 glow-coral"
              >
                Unlock with {CREDITS_PER_REPORT} Credits
              </Button>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                You have <span className="font-semibold text-[var(--text-primary)]">{balance}</span>{' '}
                credits
              </p>
            </>
          ) : (
            <>
              <Button variant="accent" size="lg" onClick={handleBuyCredits} glow className="px-12 glow-coral">
                Buy Credits to Unlock
              </Button>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                You need {CREDITS_PER_REPORT} credits to unlock this report.
                {balance > 0 && (
                  <span className="block mt-1">
                    Current balance:{' '}
                    <span className="font-semibold text-[var(--text-primary)]">{balance}</span>{' '}
                    credit{balance !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </>
          )}

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Secure checkout
            </span>
            <span>&bull;</span>
            <span>Starting at $5</span>
            <span>&bull;</span>
            <span>No subscription</span>
          </div>
        </div>

        {error && <p className="mt-4 text-center text-sm text-[var(--color-danger)]">{error}</p>}
      </div>
    </div>
  );
}
