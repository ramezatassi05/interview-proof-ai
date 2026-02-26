import { Container } from './Container';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
      <Container>
        <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">IP</span>
            <span className="text-xs text-[var(--text-muted)]">
              InterviewProof - Know what will sink you.
            </span>
          </div>

          <div className="flex gap-6 text-xs text-[var(--text-muted)]">
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">
              Contact
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border-default)] py-4 sm:flex-row">
          <span className="text-xs text-[var(--text-muted)]">
            &copy; 2026 InterviewProof AI. All rights reserved.
          </span>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Trusted</span>
            </div>

            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Compliant</span>
            </div>

            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="12" width="4" height="9" />
                <rect x="10" y="8" width="4" height="13" />
                <rect x="17" y="4" width="4" height="17" />
              </svg>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Data-Driven</span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
