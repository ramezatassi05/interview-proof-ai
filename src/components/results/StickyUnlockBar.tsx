'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCredits } from '@/hooks/useCredits';
import { api, APIRequestError } from '@/lib/api';
import { CREDITS_PER_REPORT } from '@/lib/stripe-config';
import { Button } from '@/components/ui/Button';
import { BorderBeam } from '@/components/ui/border-beam';
import { fireConfetti } from '@/components/ui/confetti';

interface StickyUnlockBarProps {
  visible: boolean;
  reportId: string;
}

export function StickyUnlockBar({ visible, reportId }: StickyUnlockBarProps) {
  const router = useRouter();
  const { balance, openPurchaseModal, refreshBalance } = useCredits();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasEnoughCredits = balance >= CREDITS_PER_REPORT;
  const show = visible && !dismissed;

  const handleUnlock = async () => {
    if (!hasEnoughCredits) {
      openPurchaseModal();
      return;
    }

    setLoading(true);
    try {
      const result = await api.unlockReport(reportId);
      if (result.data.unlocked || result.data.alreadyUnlocked) {
        refreshBalance();
        fireConfetti();
        toast.success('Report unlocked!');
        router.push(`/r/${reportId}/full`);
      }
    } catch (err) {
      if (err instanceof APIRequestError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to unlock. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50"
        >
          <div className="relative overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-card)]/80 backdrop-blur-2xl">
            <BorderBeam size={200} duration={8} />

            <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:gap-4 sm:py-3">
              {/* Lock icon + text */}
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)]/15">
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
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    13 premium sections locked
                  </p>
                  {balance > 0 && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Balance: {balance} credit{balance !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleUnlock}
                  loading={loading}
                  className="rounded-lg whitespace-nowrap bg-[var(--accent-primary)]"
                >
                  {hasEnoughCredits
                    ? `Unlock (${CREDITS_PER_REPORT} cr)`
                    : 'Buy Credits'}
                </Button>

                {/* Dismiss button */}
                <button
                  onClick={() => setDismissed(true)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--text-muted)]/10 hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Dismiss"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
