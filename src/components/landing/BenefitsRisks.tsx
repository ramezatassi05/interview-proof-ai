import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';

const BENEFITS = [
  'Pinpoint exact rejection risks before the interview',
  'Get a prioritized fix plan — biggest impact first',
  "See yourself through the recruiter's lens",
  'Get personalized interview questions based on your resume and the job',
  'Receive AI coaching and tips on how to answer using your real experience',
  'Walk in knowing your score, your questions, and your game plan',
];

const RISKS = [
  'Most candidates repeat the same mistakes across interviews',
  'Recruiters screen you out in under 30 seconds',
  'Generic prep wastes hours on the wrong things',
  "You won't know what disqualified you — they never tell you",
  'Confidence drops with each unexplained rejection',
  'The right role goes to someone who prepared smarter',
];

const STATS = [
  {
    value: '87%',
    label: 'improved within 7 days',
    description: 'of users who completed their study plan',
  },
  { value: '+14', label: 'avg score improvement', description: 'across all diagnostic re-runs' },
  { value: '< 60s', label: 'time to diagnostic', description: 'from upload to full readiness report' },
  { value: '6', label: 'scoring dimensions', description: 'modeled on real hiring rubrics' },
];

export function BenefitsRisks() {
  return (
    <section id="benefits" className="py-20 lg:py-28">
      <Container size="2xl">
        {/* Header */}
        <div className="text-center">
          <SectionBadge label="Why InterviewProof" />
          <h2 className="heading-modern mt-5 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            Why Use InterviewProof?
          </h2>
          <p className="mt-3 text-base text-[var(--text-secondary)]">
            The cost of going in unprepared is higher than you think
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {/* Benefits */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
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
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
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

        {/* Stats grid */}
        <div className="mt-14">
          <SectionBadge label="Proof" />
          <h3 className="mt-4 text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Data, not promises.
          </h3>
          <div className="mt-6 grid gap-px grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden border border-[var(--border-default)]">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-[var(--bg-card)] p-6">
                <span className="font-mono text-3xl font-bold text-[var(--accent-primary)]">
                  {stat.value}
                </span>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{stat.label}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
