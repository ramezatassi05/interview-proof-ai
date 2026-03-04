'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/Button';
import { CreditsBalance } from '@/components/ui/CreditsBalance';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Container } from './Container';

const WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
{ label: 'Benefits', href: '#benefits' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Security', href: '#security' },
  { label: 'FAQ', href: '#faq' },
];

export function Header() {
  const { user, loading, signOut } = useAuth();
  const { balance, loading: creditsLoading, openPurchaseModal } = useCredits();
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith('#')) return;
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMobileOpen(false);
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-lg transition-shadow duration-200 ${
        scrolled ? 'shadow-md shadow-black/5' : ''
      }`}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
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
                <path d="M8 9h3v13H8z" fill="white" />
                <path
                  fillRule="evenodd"
                  d="M13 9h6.5C22.5 9 24 10.5 24 13s-1.5 4-4.5 4H16v5h-3zM16 11.5h3c1.5 0 2.2.7 2.2 1.5s-.7 1.5-2.2 1.5h-3z"
                  fill="white"
                />
              </svg>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                InterviewProof
              </span>
            </Link>
          </div>

          {/* Desktop nav links — landing page only */}
          {isLanding && (
            <nav className="hidden lg:flex items-center gap-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          <nav className="flex items-center gap-3">
            <ThemeToggle />

            {/* Mobile hamburger — landing page only */}
            {isLanding && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                )}
              </button>
            )}

            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {!creditsLoading && (
                  <CreditsBalance balance={balance} size="sm" onClick={openPurchaseModal} />
                )}
                <Link
                  href="/dashboard"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:block"
                >
                  Dashboard
                </Link>
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

      {/* Mobile nav dropdown */}
      {isLanding && mobileOpen && (
        <div className="lg:hidden border-t border-[var(--border-default)] bg-[var(--bg-primary)]/95 backdrop-blur-lg">
          <Container>
            <div className="flex flex-col gap-1 py-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="rounded-lg px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              {user && (
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--accent-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
