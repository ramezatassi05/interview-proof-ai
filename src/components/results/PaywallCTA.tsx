'use client';

import { useState } from 'react';
import { api, APIRequestError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface PaywallCTAProps {
  reportId: string;
  totalRisks: number;
}

export function PaywallCTA({ reportId, totalRisks }: PaywallCTAProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create Stripe checkout session and redirect
      const result = await api.createCheckoutSession(reportId);

      if (result.data.url) {
        window.location.href = result.data.url;
      } else {
        setError('Failed to create checkout session.');
      }
    } catch (err) {
      if (err instanceof APIRequestError) {
        setError(err.message);
      } else {
        setError('Failed to start checkout. Please try again.');
      }
      setLoading(false);
    }
    // Don't setLoading(false) on success - we're redirecting
  };

  return (
    <Card className="border-2 border-zinc-900 dark:border-zinc-100">
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Unlock Full Diagnostic
        </h2>

        <ul className="mx-auto mt-6 max-w-sm space-y-3 text-left">
          <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <svg
              className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            See all {totalRisks} rejection risks with evidence
          </li>
          <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <svg
              className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Get targeted interview questions
          </li>
          <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <svg
              className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Receive prioritized study plan
          </li>
          <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <svg
              className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            1 free rerun to track progress
          </li>
        </ul>

        <div className="mt-8">
          <Button size="lg" onClick={handleUnlock} loading={loading}>
            Unlock for $15
          </Button>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            One-time payment. No subscription.
          </p>
        </div>

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </Card>
  );
}
