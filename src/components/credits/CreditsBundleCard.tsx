'use client';

import { CREDITS_PER_REPORT } from '@/lib/stripe';

interface CreditsBundleCardProps {
  name: string;
  credits: number;
  price: number; // in cents
  pricePerCredit: number;
  popular?: boolean;
  loading?: boolean;
  onPurchase: () => void;
}

export function CreditsBundleCard({
  name,
  credits,
  price,
  pricePerCredit,
  popular = false,
  loading = false,
  onPurchase,
}: CreditsBundleCardProps) {
  const priceFormatted = (price / 100).toFixed(0);
  const pricePerFormatted = pricePerCredit.toFixed(2);
  const savingsPercent = Math.round((1 - pricePerCredit) * 100);
  const reportsUnlocked = Math.floor(credits / CREDITS_PER_REPORT);

  return (
    <div
      className={`
        relative flex flex-col rounded-xl border p-5 transition-all
        ${
          popular
            ? 'border-[var(--accent-primary)] bg-gradient-to-b from-[var(--accent-primary)]/10 to-transparent shadow-lg'
            : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--border-accent)]'
        }
      `}
    >
      {/* Popular badge */}
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] px-3 py-1 text-xs font-semibold text-white shadow-md">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Popular
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
        {name}
      </h3>

      {/* Credits count */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-[var(--text-primary)]">{credits}</span>
        <span className="text-[var(--text-secondary)]">credits</span>
      </div>

      {/* Reports unlocked */}
      <p className="mt-1 text-sm text-[var(--accent-primary)]">
        {reportsUnlocked} report{reportsUnlocked !== 1 ? 's' : ''}
      </p>

      {/* Price */}
      <div className="mt-4">
        <span className="text-3xl font-bold text-[var(--text-primary)]">${priceFormatted}</span>
      </div>

      {/* Price per credit */}
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        ${pricePerFormatted} per credit
        {savingsPercent > 0 && (
          <span className="ml-2 text-[var(--color-success)]">Save {savingsPercent}%</span>
        )}
      </p>

      {/* Purchase button */}
      <button
        onClick={onPurchase}
        disabled={loading}
        className={`
          mt-5 w-full rounded-lg py-2.5 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50
          ${
            popular
              ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white hover:opacity-90'
              : 'border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10'
          }
        `}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          'Buy Now'
        )}
      </button>
    </div>
  );
}
