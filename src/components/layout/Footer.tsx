import { Container } from './Container';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
      <Container>
        <div className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <p className="text-sm text-[var(--text-secondary)]">
            InterviewProof - Know what will sink you.
          </p>
          <div className="flex gap-6 text-sm text-[var(--text-muted)]">
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
              Terms
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
