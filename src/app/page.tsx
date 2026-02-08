'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';
import { RadialScoreIndicator } from '@/components/ui/RadialScoreIndicator';

interface LastReport {
  id: string;
  readinessScore: number;
  riskBand: string;
  roundType: string;
  paidUnlocked: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [lastReport, setLastReport] = useState<LastReport | null>(null);

  const ctaHref = user ? '/new' : '/auth/login?redirect=/new';

  useEffect(() => {
    if (!user) return;
    fetch('/api/account')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.data?.reports?.length) return;
        const r = data.data.reports[0];
        if (r.readinessScore != null) {
          setLastReport({
            id: r.id,
            readinessScore: r.readinessScore,
            riskBand: r.riskBand ?? 'Medium',
            roundType: r.roundType,
            paidUnlocked: r.paidUnlocked,
            createdAt: r.createdAt,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />

      <main className="flex-1">
        {/* Hero Section — split layout */}
        <section className="relative overflow-hidden border-b border-[var(--border-default)]">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--accent-primary)]/10 rounded-full blur-3xl" />

          <Container className="relative py-16">
            <div className="flex flex-col md:flex-row md:items-center md:gap-12 lg:gap-16">
              {/* Left column — text */}
              <div className="flex-1 md:max-w-[55%]">
                <Badge variant="accent">Interview Intelligence Platform</Badge>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
                  Know Exactly What Will{' '}
                  <span className="text-[var(--color-danger)]">Sink You</span>
                </h1>

                <p className="mt-4 max-w-lg text-base text-[var(--text-secondary)] lg:text-lg">
                  Stop guessing why you fail interviews. Get a job-specific diagnostic that reveals
                  your exact rejection risks.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href={ctaHref}>
                    <Button variant="accent" size="lg" glow disabled={loading}>
                      Start Here
                    </Button>
                  </Link>
                  <Link href={ctaHref}>
                    <Button variant="secondary" size="lg" disabled={loading}>
                      See Recruiter View
                    </Button>
                  </Link>
                </div>

                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  Free preview. Full diagnostic for $15.
                </p>
              </div>

              {/* Right column — diagnostic preview */}
              <div className="mt-10 flex justify-center md:mt-0 md:flex-1">
                {lastReport ? (
                  /* Returning user — real data */
                  <div className="w-full max-w-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">
                        Your Last Diagnostic
                      </span>
                      <Badge variant="default">{timeAgo(lastReport.createdAt)}</Badge>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <RadialScoreIndicator
                        score={lastReport.readinessScore}
                        size="lg"
                        variant="auto"
                      />
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-2">
                      <Badge
                        variant={riskBandToVariant(
                          lastReport.riskBand as 'High' | 'Medium' | 'Low'
                        )}
                      >
                        {lastReport.riskBand} Risk
                      </Badge>
                      <span className="text-sm text-[var(--text-muted)]">
                        {lastReport.roundType}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Link
                        href={`/r/${lastReport.id}${lastReport.paidUnlocked ? '/full' : ''}`}
                        className="block"
                      >
                        <Button variant="accent" size="sm" className="w-full">
                          View Full Report
                        </Button>
                      </Link>
                      <Link href="/new" className="block">
                        <Button variant="secondary" size="sm" className="w-full">
                          Run New Analysis
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* New / anonymous visitor — mock preview */
                  <div className="relative flex flex-col items-center">
                    <div className="relative">
                      <RadialScoreIndicator score={73} size="lg" variant="warning" animated />
                      <div className="absolute -top-2 -right-2 rounded-full border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]">
                        Preview
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <span className="rounded-full bg-[var(--color-danger-muted)] px-2.5 py-1 text-xs font-medium text-[var(--color-danger)]">
                        3 Red Flags
                      </span>
                      <span className="rounded-full bg-[var(--color-warning-muted)] px-2.5 py-1 text-xs font-medium text-[var(--color-warning)]">
                        2hr Fix Time
                      </span>
                      <span className="rounded-full bg-[var(--color-success-muted)] px-2.5 py-1 text-xs font-medium text-[var(--color-success)]">
                        87% Match
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>

        {/* Section divider */}
        <div className="section-divider" />

        {/* Quick Value Cards */}
        <section className="border-b border-[var(--border-default)]">
          <Container className="py-10">
            <div className="grid gap-5 md:grid-cols-3">
              {/* Card 1: Hire-Zone Score */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 card-hover">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Your Hire-Zone Score
                  </h3>
                  <Badge variant="success">Instant</Badge>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <RadialScoreIndicator
                    score={lastReport?.readinessScore ?? 73}
                    size="sm"
                    variant={lastReport ? 'auto' : 'warning'}
                  />
                  <p className="text-sm text-[var(--text-secondary)]">
                    {lastReport
                      ? 'Scored across 6 dimensions against job requirements.'
                      : 'See where you stand. Scored across 6 dimensions against job requirements.'}
                  </p>
                </div>
              </div>

              {/* Card 2: Top Rejection Risks */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 card-hover">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Top Rejection Risks
                  </h3>
                  <Badge variant="high">Evidence-Backed</Badge>
                </div>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-danger)]" />
                    Missing system design depth
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-danger)]" />
                    No CI/CD pipeline experience
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-warning)]" />
                    Weak behavioral examples
                  </li>
                </ul>
              </div>

              {/* Card 3: Fastest Wins */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 card-hover">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Fastest Wins</h3>
                  <Badge variant="accent">Prioritized</Badge>
                </div>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">
                      Add metrics to project bullets
                    </span>
                    <span className="flex-shrink-0 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                      20min
                    </span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Prepare 2 STAR stories</span>
                    <span className="flex-shrink-0 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                      30min
                    </span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">
                      Review system design basics
                    </span>
                    <span className="flex-shrink-0 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                      45min
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* How It Works */}
        <section className="border-b border-[var(--border-default)]">
          <Container className="py-14">
            <h2 className="text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              How It Works
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                {
                  number: '1',
                  title: 'Upload',
                  description:
                    'Upload your resume and paste the job description. Takes 30 seconds.',
                },
                {
                  number: '2',
                  title: 'Diagnose',
                  description:
                    'Get your readiness score, top rejection risks, and evidence mapping.',
                },
                {
                  number: '3',
                  title: 'Practice',
                  description:
                    'Follow your prioritized study plan. Fix the highest-impact gaps first.',
                },
              ].map((step, index) => (
                <div key={step.number} className="relative">
                  {index < 2 && (
                    <div className="hidden md:block absolute top-5 left-[calc(50%+32px)] w-[calc(100%-64px)] h-0.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-sm font-bold text-white shadow-lg glow-accent">
                      {step.number}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Credibility Strip */}
        <section className="border-b border-[var(--border-default)] bg-[var(--bg-card)] backdrop-blur-sm">
          <Container className="py-6">
            <div
              className="flex items-center justify-center gap-3 text-center"
              title="Our analysis engine uses structured rubrics, role-specific scoring dimensions, and evidence-based risk mapping. No generic advice."
            >
              <svg
                className="h-5 w-5 flex-shrink-0 text-[var(--accent-primary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <p className="text-sm text-[var(--text-secondary)]">
                Built from patterns across 50+ interview rubrics and real hiring data
              </p>
            </div>
          </Container>
        </section>

        {/* Footer CTA */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-elevated)]">
          <div className="absolute inset-0 bg-[var(--accent-primary)]/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-3xl" />

          <Container className="relative py-14 text-center">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              Ready to Find Your Gaps?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--text-secondary)]">
              Get a clear, evidence-based diagnostic in minutes.
            </p>
            <div className="mt-6">
              <Link href={ctaHref}>
                <Button variant="accent" size="lg" glow disabled={loading}>
                  Start Here
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
