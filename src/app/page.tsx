'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { RadialScoreIndicator } from '@/components/ui/RadialScoreIndicator';

const VALUE_PROPS = [
  {
    title: 'Job-Specific Analysis',
    description:
      'Not generic advice. We analyze your exact resume against the specific job description and interview round.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    title: 'Evidence-Backed Risks',
    description:
      'Every rejection risk is mapped to specific evidence in your resume and the job requirements. No guessing.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    title: 'Actionable Study Plan',
    description:
      'Get a prioritized, time-boxed preparation plan. Know exactly what to fix and in what order.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

const STEPS = [
  {
    number: '1',
    title: 'Upload Your Materials',
    description:
      "Upload your resume PDF and paste the job description for the role you're targeting.",
  },
  {
    number: '2',
    title: 'Get Your Readiness Score',
    description: 'See your score and top 3 rejection risks immediately. Free preview included.',
  },
  {
    number: '3',
    title: 'Unlock Full Diagnostic',
    description: 'Get all risks, interview questions, and a prioritized study plan for $15.',
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();

  const ctaHref = user ? '/new' : '/auth/login?redirect=/new';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[var(--border-default)]">
          {/* Background gradient effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--accent-primary)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[var(--accent-secondary)]/10 rounded-full blur-3xl" />

          <Container className="relative py-24 text-center">
            {/* Animated preview radial */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <RadialScoreIndicator score={73} size="xl" variant="warning" animated />
                <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-[var(--color-warning-muted)] border border-[var(--color-warning)]/30 text-xs font-medium text-[var(--color-warning)]">
                  Preview
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl">
              Know What Will <span className="text-[var(--color-danger)]">Sink You</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
              Stop guessing why you fail interviews. Get a job-specific diagnostic that identifies
              your exact rejection risks and tells you what to fix first.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link href={ctaHref}>
                <Button variant="accent" size="lg" glow disabled={loading}>
                  Start Your Diagnostic
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              Free preview. Full diagnostic for $15.
            </p>
          </Container>
        </section>

        {/* Value Props */}
        <section className="border-b border-[var(--border-default)]">
          <Container className="py-20">
            <div className="grid gap-8 md:grid-cols-3">
              {VALUE_PROPS.map((prop) => (
                <div
                  key={prop.title}
                  className="text-center rounded-xl p-6 bg-[var(--bg-card)] border border-[var(--border-default)] card-hover"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-lg">
                    {prop.icon}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-[var(--text-primary)]">
                    {prop.title}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">{prop.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* How It Works */}
        <section className="border-b border-[var(--border-default)]">
          <Container className="py-20">
            <h2 className="text-center text-3xl font-bold text-[var(--text-primary)]">
              How It Works
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.number} className="relative">
                  {/* Connector line */}
                  {index < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-5 left-[calc(50%+32px)] w-[calc(100%-64px)] h-0.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-lg font-bold text-white shadow-lg glow-accent">
                      {step.number}
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-[var(--text-primary)]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-elevated)]">
          <div className="absolute inset-0 bg-[var(--accent-primary)]/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-3xl" />

          <Container className="relative py-20 text-center">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">
              Ready to Find Your Gaps?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--text-secondary)]">
              Don&apos;t walk into your next interview unprepared. Get a clear, evidence-based
              diagnostic in minutes.
            </p>
            <div className="mt-8">
              <Link href={ctaHref}>
                <Button variant="accent" size="lg" glow disabled={loading}>
                  Start Your Diagnostic
                </Button>
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
