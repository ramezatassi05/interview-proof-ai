'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/Button';
import { CreditsBalance } from '@/components/ui/CreditsBalance';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Container } from './Container';

const WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';

export function Header() {
  const { user, loading, signOut } = useAuth();
  const { balance, loading: creditsLoading, openPurchaseModal } = useCredits();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur-lg">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <defs>
                  <linearGradient id="logo-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#312E81" />
                  </linearGradient>
                </defs>
                <path
                  d="M16 1C16 1 4 3 4 6v12c0 6 5.5 10.5 12 13 6.5-2.5 12-7 12-13V6c0-3-12-5-12-5z"
                  fill="url(#logo-grad)"
                />
                <text
                  x="16"
                  y="21.5"
                  textAnchor="middle"
                  fontFamily="ui-monospace,SFMono-Regular,monospace"
                  fontSize="13"
                  fontWeight="700"
                  fill="white"
                  letterSpacing="-0.5"
                >
                  IP
                </text>
              </svg>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                InterviewProof
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-3">
            <ThemeToggle />
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {!creditsLoading && (
                  <CreditsBalance balance={balance} size="sm" onClick={openPurchaseModal} />
                )}
                <Link href="/new">
                  <Button variant="accent" size="sm">
                    New Analysis
                  </Button>
                </Link>
                <Link href="/wallet" className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-mono font-semibold text-[var(--text-secondary)]">
                    {user.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="hidden sm:inline">Account</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:block"
                >
                  Sign Out
                </button>
              </div>
            ) : !WAITLIST_MODE ? (
              <Link href="/auth/login">
                <Button variant="accent" size="sm">
                  Sign In
                </Button>
              </Link>
            ) : null}
          </nav>
        </div>
      </Container>
    </header>
  );
}
