import Link from 'next/link';
import { Container } from './Container';

const PRODUCT_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#faq' },
  { label: 'FAQ', href: '#faq' },
  { label: 'About', href: '/about' },
];

const RESOURCE_LINKS = [
  { label: 'Blog', href: '/blog' },
  { label: 'How It Works', href: '/methodology' },
  { label: 'Ambassadors', href: '/ambassadors' },
];

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
];

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isInternal = href.startsWith('/');
  const className =
    'text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors';

  if (isInternal) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer
      className="border-t border-[var(--border-dark-band)] bg-[var(--bg-dark-band)]"
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
      <Container>
        <div className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <defs>
                  <linearGradient id="footer-logo-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#312E81" />
                  </linearGradient>
                </defs>
                <path
                  d="M16 1C16 1 4 3 4 6v12c0 6 5.5 10.5 12 13 6.5-2.5 12-7 12-13V6c0-3-12-5-12-5z"
                  fill="url(#footer-logo-grad)"
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
            <p className="mt-3 max-w-xs text-sm text-[var(--text-muted)] leading-relaxed">
              Know what will sink you. Evidence-backed interview diagnostics that turn anxiety into clear action.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Product
            </h3>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border-default)] py-6 sm:flex-row">
          <span className="text-xs text-[var(--text-muted)]">
            &copy; 2026 InterviewProof AI. All rights reserved.
          </span>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Trusted</span>
            </div>

            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Compliant</span>
            </div>

            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="12" width="4" height="9" />
                <rect x="10" y="8" width="4" height="13" />
                <rect x="17" y="4" width="4" height="17" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Data-Driven</span>
            </div>

          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://tiktok.com/@interviewproofai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              aria-label="TikTok"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.21 8.21 0 0 0 4.76 1.52V6.79a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
            <a
              href="https://instagram.com/interviewproofai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              aria-label="Instagram"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
