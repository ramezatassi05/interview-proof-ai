'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { getWaitlistTier, getTierLabel } from '@/lib/waitlist';

interface WaitlistSuccessProps {
  position: number;
  referralCode: string;
}

export function WaitlistSuccess({ position, referralCode }: WaitlistSuccessProps) {
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralUrl = `${appUrl}?ref=${referralCode}`;
  const tier = getWaitlistTier(position);
  const tierLabel = getTierLabel(tier);

  const shareText = `I just joined the InterviewProof waitlist at position #${position}. Know exactly what will sink your interview before it happens. Join here:`;

  function handleCopy() {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Position display */}
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Your Position
        </p>
        <p className="mt-2 text-6xl font-extrabold text-[var(--accent-primary)]">#{position}</p>
        {tierLabel && (
          <div className="mt-3">
            <Badge variant="accent">{tierLabel}</Badge>
          </div>
        )}
      </div>

      {/* Referral card */}
      <div className="mt-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Move up the list</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Each friend who confirms moves you up 3 spots.
        </p>

        {/* Copy link */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2">
            <p className="truncate font-mono text-xs text-[var(--text-secondary)]">{referralUrl}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Share buttons */}
        <div className="mt-4 flex gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </a>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        We&apos;ll email you when it&apos;s your turn to get early access.
      </p>
    </div>
  );
}
