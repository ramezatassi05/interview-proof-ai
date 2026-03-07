'use client';

import { useState } from 'react';
import { CreditsBundleCard } from './CreditsBundleCard';
import { CREDIT_BUNDLES, CREDITS_PER_REPORT, ABANDONED_DISCOUNT, type CreditBundle } from '@/lib/stripe';
import { useCredits } from '@/hooks/useCredits';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface CreditsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsPurchaseModal({ isOpen, onClose }: CreditsPurchaseModalProps) {
  const { hasAbandonmentDiscount } = useCredits();
  const [loadingBundle, setLoadingBundle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (bundle: CreditBundle) => {
    setLoadingBundle(bundle.id);
    setError(null);

    try {
      const res = await fetch('/api/checkout/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId: bundle.id, applyDiscount: hasAbandonmentDiscount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingBundle(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Buy Credits</DialogTitle>
          <DialogDescription className="text-center">
            Choose a credit bundle to unlock diagnostic reports
          </DialogDescription>
        </DialogHeader>

        {/* Discount banner */}
        {hasAbandonmentDiscount && (
          <div className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-2.5 text-center">
            <span className="text-sm font-semibold text-[var(--color-success)]">
              Limited Time: {ABANDONED_DISCOUNT.percentOff}% Off All Bundles
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-3 text-center text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {/* Bundle cards */}
        <div className="grid gap-4 pt-14 sm:grid-cols-3">
          {CREDIT_BUNDLES.map((bundle) => (
            <CreditsBundleCard
              key={bundle.id}
              name={bundle.name}
              credits={bundle.credits}
              price={bundle.price}
              pricePerCredit={bundle.pricePerCredit}
              popular={bundle.popular}
              loading={loadingBundle === bundle.id}
              discountPercent={hasAbandonmentDiscount ? ABANDONED_DISCOUNT.percentOff : undefined}
              onPurchase={() => handlePurchase(bundle)}
            />
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          {CREDITS_PER_REPORT} credits unlock one full diagnostic report with all insights.
        </p>
      </DialogContent>
    </Dialog>
  );
}
