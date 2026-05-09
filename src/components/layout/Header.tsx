'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import FloatingActionMenu from '@/components/ui/floating-action-menu';
import { NotificationBell } from './NotificationBell';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Container } from './Container';
import { useWaitlistMode } from '@/hooks/useWaitlistMode';

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'Security', href: '#security' },
  { label: 'FAQ', href: '#faq' },
];

export function Header() {
  const { user, loading, signOut } = useAuth();

  const router = useRouter();
  const WAITLIST_MODE = useWaitlistMode();
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
      className={`sticky top-0 z-50 bg-[var(--header-bg)] backdrop-blur-lg transition-shadow duration-200 ${
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
              <span className="text-sm font-semibold text-[var(--header-text)]">
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
                  className="text-sm text-[var(--header-text-secondary)] hover:text-[var(--header-text)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          <nav className="flex items-center gap-3">
            <div
              style={
                {
                  '--bg-elevated': 'var(--header-elevated)',
                  '--border-default': 'var(--header-border)',
                  '--text-secondary': 'var(--header-text-secondary)',
                  '--text-primary': 'var(--header-text)',
                } as React.CSSProperties
              }
            >
              <ThemeToggle />
            </div>

            {/* Mobile hamburger — landing page only */}
            {isLanding && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-[var(--header-text-secondary)] hover:text-[var(--header-text)] hover:bg-[var(--header-elevated)] transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                )}
              </button>
            )}

            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-[var(--header-elevated)]" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <LiquidButton
                  href="/new"
                  variant="gradient"
                  size={null}
                  className="px-4 py-2 text-sm"
                >
                  New Analysis
                </LiquidButton>
                <FloatingActionMenu
                  userInitial={user.email?.[0]?.toUpperCase() ?? 'U'}
                  options={[
                    {
                      label: 'Dashboard',
                      Icon: (
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
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                        </svg>
                      ),
                      onClick: () => router.push('/dashboard'),
                    },
                    {
                      label: 'Career Advisor',
                      Icon: (
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
                          <circle cx="12" cy="12" r="10" />
                          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                        </svg>
                      ),
                      onClick: () => router.push('/dashboard/career-advisor'),
                    },
                    {
                      label: 'Opportunities',
                      Icon: (
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
                          <path d="M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                          <path d="M10 5h4v2h-4z" />
                        </svg>
                      ),
                      onClick: () => router.push('/opportunities'),
                    },
                    {
                      label: 'Outbox',
                      Icon: (
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
                          <polyline points="3 12 9 12 11 16 13 8 15 12 21 12" />
                          <path d="M22 12v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7" />
                          <path d="M12 2v10" />
                          <polyline points="8 6 12 2 16 6" />
                        </svg>
                      ),
                      onClick: () => router.push('/outbox'),
                    },
                    {
                      label: 'Account',
                      Icon: (
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
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      ),
                      onClick: () => router.push('/account'),
                    },
                    {
                      label: 'Sign Out',
                      Icon: (
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
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      ),
                      onClick: () => signOut(),
                    },
                  ]}
                />
              </div>
            ) : !WAITLIST_MODE ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-[var(--header-text-secondary)] hover:text-[var(--header-text)] transition-colors"
                >
                  Login
                </Link>
                <LiquidButton variant="gradient" size="sm" href="/onboarding">
                  Get Started
                </LiquidButton>
              </div>
            ) : null}
          </nav>
        </div>
      </Container>

      {/* Mobile nav dropdown */}
      {isLanding && mobileOpen && (
        <div className="lg:hidden border-t border-[var(--header-border)] bg-[var(--header-bg)] backdrop-blur-lg">
          <Container>
            <div className="flex flex-col gap-1 py-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="rounded-lg px-3 py-2.5 text-sm text-[var(--header-text-secondary)] hover:text-[var(--header-text)] hover:bg-[var(--header-elevated)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--accent-primary)] hover:bg-[var(--header-elevated)] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
