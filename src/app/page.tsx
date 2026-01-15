'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

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
    description: "Paste your resume and the job description for the role you're targeting.",
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
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Container className="py-24 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl md:text-6xl">
              Know What Will <span className="text-red-600 dark:text-red-500">Sink You</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Stop guessing why you fail interviews. Get a job-specific diagnostic that identifies
              your exact rejection risks and tells you what to fix first.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link href={ctaHref}>
                <Button size="lg" disabled={loading}>
                  Start Your Diagnostic
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Free preview. Full diagnostic for $15.
            </p>
          </Container>
        </section>

        {/* Value Props */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <Container className="py-20">
            <div className="grid gap-8 md:grid-cols-3">
              {VALUE_PROPS.map((prop) => (
                <div key={prop.title} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                    {prop.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {prop.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {prop.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* How It Works */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <Container className="py-20">
            <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              How It Works
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.number} className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-lg font-bold text-white dark:bg-white dark:text-zinc-900">
                    {step.number}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="bg-zinc-900 dark:bg-zinc-800">
          <Container className="py-20 text-center">
            <h2 className="text-3xl font-bold text-white">Ready to Find Your Gaps?</h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Don&apos;t walk into your next interview unprepared. Get a clear, evidence-based
              diagnostic in minutes.
            </p>
            <div className="mt-8">
              <Link href={ctaHref}>
                <Button size="lg" variant="secondary" disabled={loading}>
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
