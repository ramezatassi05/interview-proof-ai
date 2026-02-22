'use client';

import { useState } from 'react';
import { CreditsBundleCard } from './CreditsBundleCard';
import { CREDIT_BUNDLES, CREDITS_PER_REPORT, type CreditBundle } from '@/lib/stripe';

interface CreditsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsPurchaseModal({ isOpen, onClose }: CreditsPurchaseModalProps) {
  const [loadingBundle, setLoadingBundle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (bundle: CreditBundle) => {
    setLoadingBundle(bundle.id);
    setError(null);

    try {
      const res = await fetch('/api/checkout/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId: bundle.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingBundle(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl animate-fade-in rounded-[20px] bg-[var(--bg-card)] p-6 shadow-warm">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Buy Credits</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Choose a credit bundle to unlock diagnostic reports
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-3 text-center text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {/* Bundle cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {CREDIT_BUNDLES.map((bundle) => (
            <CreditsBundleCard
              key={bundle.id}
              name={bundle.name}
              credits={bundle.credits}
              price={bundle.price}
              pricePerCredit={bundle.pricePerCredit}
              popular={bundle.popular}
              loading={loadingBundle === bundle.id}
              onPurchase={() => handlePurchase(bundle)}
            />
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          {CREDITS_PER_REPORT} credits unlock one full diagnostic report with all insights.
        </p>
      </div>
    </div>
  );
}
