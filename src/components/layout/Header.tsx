'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CreditsBalance } from '@/components/ui/CreditsBalance';
import { Container } from './Container';

export function Header() {
  const { user, loading, signOut } = useAuth();
  const { balance, loading: creditsLoading, openPurchaseModal } = useCredits();

  return (
    <header className="bg-[var(--bg-card)] shadow-warm">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] shadow-warm group-hover:shadow-[0_0_20px_rgba(255,107,53,0.3)] transition-shadow">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-[var(--text-primary)] group-hover:text-gradient transition-colors">
                InterviewProof
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-4">
            <ThemeToggle />
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
            ) : user ? (
              <div className="flex items-center gap-4">
                {!creditsLoading && (
                  <CreditsBalance balance={balance} size="sm" onClick={openPurchaseModal} />
                )}
                <Link href="/new">
                  <Button variant="accent" size="sm">
                    New Analysis
                  </Button>
                </Link>
                <Link
                  href="/account"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:block"
                >
                  Account
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:block"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth/login">
                <Button variant="accent" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </Container>
    </header>
  );
}
