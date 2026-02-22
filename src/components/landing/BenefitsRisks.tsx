import { Container } from '@/components/layout/Container';

const BENEFITS = [
  'Pinpoint exact rejection risks before the interview',
  'Get a prioritized fix plan — biggest impact first',
  "See yourself through the recruiter's lens",
  'Practice with job-specific questions, not generic ones',
  'Track readiness over time with real metrics',
  'Walk in knowing your score, not hoping for the best',
];

const RISKS = [
  'Most candidates repeat the same mistakes across interviews',
  'Recruiters screen you out in under 30 seconds',
  'Generic prep wastes hours on the wrong things',
  "You won't know what disqualified you — they never tell you",
  'Confidence drops with each unexplained rejection',
  'The right role goes to someone who prepared smarter',
];

export function BenefitsRisks() {
  return (
    <section>
      <Container className="py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Why Use InterviewProof?
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            The cost of going in unprepared is higher than you think
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {/* Benefits */}
          <div className="rounded-[20px] bg-[var(--bg-card)] p-6 shadow-warm">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Benefits of Using InterviewProof
              </h3>
            </div>
            <ul className="mt-4 space-y-3">
              {BENEFITS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-success)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="rounded-[20px] bg-[var(--bg-card)] p-6 shadow-warm">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-danger)]/15 text-[var(--color-danger)]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Risks of NOT Using It
              </h3>
            </div>
            <ul className="mt-4 space-y-3">
              {RISKS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-danger)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
