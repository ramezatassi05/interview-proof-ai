'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/Button';
import { CreditsBalance } from '@/components/ui/CreditsBalance';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Container } from './Container';

export function Header() {
  const { user, loading, signOut } = useAuth();
  const { balance, loading: creditsLoading, openPurchaseModal } = useCredits();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur-lg">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="font-mono text-base font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded">
                IP
              </span>
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
