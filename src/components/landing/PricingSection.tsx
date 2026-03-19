'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Container } from '@/components/layout/Container';
import { SectionBadge } from '@/components/landing/SectionBadge';
import { BorderBeam } from '@/components/ui/border-beam';
import { InsightOwlThinking } from '@/components/svg/InsightOwlMascot';
import { fireConfetti } from '@/components/ui/confetti';
import { CREDIT_BUNDLES, CREDITS_PER_REPORT } from '@/lib/stripe-config';
import type { CreditBundle } from '@/lib/stripe-config';

const FEATURES: Record<string, string[]> = {
  starter: [
    '1 full diagnostic report',
    'All 9 insight tabs',
    'Practice questions & feedback',
    'PDF export',
  ],
  popular: [
    '4 full diagnostic reports',
    'Best value per report',
    'Everything in Starter',
  ],
  pro: [
    '10 full diagnostic reports',
    'Lowest cost per credit',
    'Everything in Popular',
  ],
};

function getSavingsPercent(bundle: CreditBundle): number | null {
  const baseline = CREDIT_BUNDLES[0];
  if (!baseline || bundle.id === baseline.id) return null;
  return Math.round((1 - bundle.pricePerCredit / baseline.pricePerCredit) * 100);
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="mt-0.5 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M13.25 4.75L6 12 2.75 8.75"
        stroke="var(--accent-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function PricingSection() {
  const { user } = useAuth();
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [loadingBundle, setLoadingBundle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async (bundle: CreditBundle) => {
    if (!user) {
      router.push('/auth/login?redirect=/#pricing');
      return;
    }

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

      if (data.data?.url) {
        fireConfetti();
        window.location.href = data.data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingBundle(null);
    }
  };

  const getCardAnimation = (index: number) => {
    const ease = 'easeOut' as const;

    if (!isDesktop) {
      return {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: index * 0.1 },
      };
    }

    if (index === 0) {
      return {
        initial: { opacity: 0, rotateY: -8, x: -20 },
        whileInView: { opacity: 1, rotateY: 0, x: 0 },
        transition: { duration: 0.7, ease },
      };
    }
    if (index === 1) {
      return {
        initial: { opacity: 0, scale: 0.9, y: 20 },
        whileInView: { opacity: 1, scale: 1.05, y: 0 },
        transition: { duration: 0.7, delay: 0.1, ease },
      };
    }
    return {
      initial: { opacity: 0, rotateY: 8, x: 20 },
      whileInView: { opacity: 1, rotateY: 0, x: 0 },
      transition: { duration: 0.7, delay: 0.2, ease },
    };
  };

  return (
    <section
      id="pricing"
      className="py-20 lg:py-28 bg-[var(--bg-dark-band)]"
      style={
        {
          '--text-primary': 'var(--text-dark-band-primary)',
          '--text-secondary': 'var(--text-dark-band-secondary)',
          '--text-muted': 'var(--text-dark-band-secondary)',
          '--bg-card': 'var(--bg-dark-band-card)',
          '--bg-elevated': 'var(--bg-dark-band-card)',
          '--border-default': 'var(--border-dark-band)',
        } as React.CSSProperties
      }
    >
      <Container size="lg">
        <div className="mb-14 text-center">
          <SectionBadge label="Pricing" />
          <h2 className="heading-modern mt-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            Simple, one-time pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--text-secondary)] lg:text-lg">
            No subscriptions. Buy credits once, use them whenever you&apos;re ready. Each diagnostic
            costs {CREDITS_PER_REPORT} credits.
          </p>
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-md rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <div
          className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-6 md:grid-cols-3 md:gap-5 lg:gap-8"
          style={isDesktop ? { perspective: '800px' } : undefined}
        >
          {CREDIT_BUNDLES.map((bundle, index) => {
            const savings = getSavingsPercent(bundle);
            const isPopular = bundle.popular === true;
            const isLoading = loadingBundle === bundle.id;
            const features = FEATURES[bundle.id] || [];
            const reports = Math.floor(bundle.credits / CREDITS_PER_REPORT);
            const anim = getCardAnimation(index);

            return (
              <motion.div
                key={bundle.id}
                initial={anim.initial}
                whileInView={anim.whileInView}
                transition={anim.transition}
                viewport={{ once: true, margin: '-50px' }}
                className="relative flex flex-col"
                style={isDesktop ? { transformStyle: 'preserve-3d' } : undefined}
              >
                {/* Owl above popular card */}
                {isPopular && (
                  <div className="flex justify-center -mb-2 relative z-10">
                    <InsightOwlThinking size={48} />
                  </div>
                )}

                <div
                  className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border p-6 lg:p-8 ${
                    isPopular
                      ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)] bg-gradient-to-b from-[var(--accent-primary)]/5 to-[var(--bg-card)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-card)]'
                  }`}
                >
                  {/* Border beam on popular */}
                  {isPopular && <BorderBeam duration={12} size={150} />}

                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                        {bundle.name}
                      </span>
                      {isPopular && (
                        <span className="rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary,var(--accent-primary))] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          Most Popular
                        </span>
                      )}
                    </div>

                    {/* Credits */}
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold tabular-nums text-[var(--text-primary)]">
                        {bundle.credits}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-muted)]">credits</span>
                    </div>

                    {/* Reports unlockable */}
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Unlocks{' '}
                      <span className="font-semibold text-[var(--text-primary)]">{reports}</span>{' '}
                      {reports === 1 ? 'report' : 'reports'}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">
                      ${(bundle.price / 100).toFixed(2)}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">one-time</span>
                    {savings && (
                      <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                        Save {savings}%
                      </span>
                    )}
                  </div>

                  {/* Per-credit cost */}
                  <p className="mb-6 text-xs text-[var(--text-muted)]">
                    ${bundle.pricePerCredit.toFixed(2)} per credit
                  </p>

                  {/* Features */}
                  <ul className="mb-8 flex flex-1 flex-col gap-3">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                        <CheckIcon />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleBuy(bundle)}
                    disabled={isLoading}
                    className={`w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
                      isPopular
                        ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary,var(--accent-primary))] text-white shadow-lg shadow-[var(--accent-primary)]/25 hover:shadow-xl hover:shadow-[var(--accent-primary)]/30 hover:brightness-110'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] ring-1 ring-[var(--border-default)] hover:ring-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner />
                        Processing...
                      </span>
                    ) : (
                      'Buy Now'
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust note */}
        <p className="mt-10 text-center text-xs text-[var(--text-muted)]">
          Secure checkout powered by Stripe. Credits never expire.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 text-[var(--text-muted)]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span className="text-xs">
            100% Satisfaction Guarantee — not satisfied? Contact us within 7 days for a full
            refund.
          </span>
        </div>
      </Container>
    </section>
  );
}
