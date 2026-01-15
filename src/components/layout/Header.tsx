'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Container } from './Container';

export function Header() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-zinc-900 dark:text-white">InterviewProof</span>
          </Link>

          <nav className="flex items-center gap-4">
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <Link href="/new">
                  <Button variant="secondary" size="sm">
                    New Analysis
                  </Button>
                </Link>
                <Link
                  href="/account"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Account
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </nav>
        </div>
      </Container>
    </header>
  );
}
