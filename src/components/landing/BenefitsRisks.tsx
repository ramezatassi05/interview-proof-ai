'use client';

import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';
import { BlurFade } from '@/components/ui/blur-fade';
import { NumberTicker } from '@/components/ui/number-ticker';

const BENEFITS = [
  'Pinpoint exact rejection risks before the interview',
  'Get a prioritized fix plan — biggest impact first',
  "See yourself through the recruiter's lens",
  'Get personalized interview questions based on your resume and the job',
  'Receive AI coaching and tips on how to answer using your real experience',
  'Walk in knowing your score, your questions, and your game plan',
];

const RISKS = [
  'You practice for hours with no way to tell if it\u2019s helping',
  'Recruiters see gaps you can\u2019t — and screen you out in seconds',
  'Generic prep wastes time on things that won\u2019t move the needle',
  'No one tells you why you got rejected — so the same mistakes repeat',
  'Each unexplained rejection chips away at your confidence',
  'The offer goes to someone who practiced with feedback, not just effort',
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
            The problem isn&apos;t how much you practice — it&apos;s practicing without proof
            it&apos;s working
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {/* Benefits */}
          <BlurFade inView delay={0}>
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

          </BlurFade>

          {/* Risks */}
          <BlurFade inView delay={0.1}>
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
          </BlurFade>
        </div>

        {/* Stats grid */}
        <div className="mt-14">
          <SectionBadge label="Proof" />
          <h3 className="mt-4 text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Data, not promises.
          </h3>
          <div className="mt-6 grid gap-px grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden border border-[var(--border-default)]">
            <div className="bg-[var(--bg-card)] p-6">
              <span className="font-mono text-3xl font-bold text-[var(--accent-primary)]">
                <NumberTicker value={87} delay={0.2} />%
              </span>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">improved within 7 days</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">of users who completed their study plan</p>
            </div>
            <div className="bg-[var(--bg-card)] p-6">
              <span className="font-mono text-3xl font-bold text-[var(--accent-primary)]">
                +<NumberTicker value={14} delay={0.3} />
              </span>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">avg score improvement</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">across all diagnostic re-runs</p>
            </div>
            <div className="bg-[var(--bg-card)] p-6">
              <span className="font-mono text-3xl font-bold text-[var(--accent-primary)]">
                {'< '}<NumberTicker value={60} delay={0.4} />s
              </span>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">time to diagnostic</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">from upload to full readiness report</p>
            </div>
            <div className="bg-[var(--bg-card)] p-6">
              <span className="font-mono text-3xl font-bold text-[var(--accent-primary)]">
                <NumberTicker value={6} delay={0.5} />
              </span>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">scoring dimensions</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">modeled on real hiring rubrics</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
