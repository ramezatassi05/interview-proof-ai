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
import { OnboardingCarousel } from '@/components/landing/OnboardingCarousel';
import { LiveAnalysisFeed } from '@/components/landing/LiveAnalysisFeed';
import { PipelineDiagram } from '@/components/landing/PipelineDiagram';
import { BenefitsRisks } from '@/components/landing/BenefitsRisks';
import { FAQ } from '@/components/landing/FAQ';
import { InterviewIntelligenceStats } from '@/components/landing/InterviewIntelligenceStats';
import { ReportPreviewShowcase } from '@/components/landing/ReportPreviewShowcase';
import { InsightOwlMascot } from '@/components/svg/InsightOwlMascot';

interface LastReport {
  id: string;
  readinessScore: number;
  riskBand: string;
  roundType: string;
  paidUnlocked: boolean;
  createdAt: string;
  companyName: string | null;
  top3Risks: { title: string; severity: string }[];
  top3StudyPlan: { task: string; timeEstimateMinutes: number }[];
}

export default function LandingPage() {
  const { user } = useAuth();
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
            companyName: r.companyName ?? null,
            top3Risks: r.top3Risks ?? [],
            top3StudyPlan: r.top3StudyPlan ?? [],
          });
        }
      })
      .catch(() => {});
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <section className="relative dot-grid-bg">
          <Container className="relative py-20 lg:py-28">
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
              {/* Left — text */}
              <div className="flex-1 lg:max-w-[55%]">
                <Badge variant="accent">Interview Intelligence Platform</Badge>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl leading-[1.1]">
                  Know Exactly What Will{' '}
                  <span className="text-[var(--color-danger)]">Sink You</span>
                </h1>

                <p className="mt-5 max-w-lg text-base text-[var(--text-secondary)]">
                  We show you the exact sentence that would get you rejected. Get a job-specific diagnostic that reveals
                  your rejection risks — plus personalized interview questions, coaching, and tips built from your resume and the role.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href={ctaHref}>
                    <Button variant="accent" size="lg">
                      Start Here
                    </Button>
                  </Link>
                  <Link href={ctaHref}>
                    <Button variant="secondary" size="lg">
                      See Recruiter View
                    </Button>
                  </Link>
                  <InsightOwlMascot size={48} />
                </div>

                <p className="mt-4 font-mono text-xs text-[var(--text-muted)]">
                  Free preview. Full diagnostic for $15.
                </p>
              </div>

              {/* Right — preview card */}
              <div className="mt-12 flex justify-center lg:mt-0 lg:flex-1">
                {lastReport ? (
                  /* Returning user — real data */
                  <div className="w-full max-w-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">
                        Your Last Diagnostic
                      </span>
                      <Badge variant={riskBandToVariant(lastReport.riskBand as 'High' | 'Medium' | 'Low')}>
                        {lastReport.riskBand} Risk
                      </Badge>
                    </div>

                    <div className="mt-5 flex justify-center">
                      <RadialScoreIndicator
                        score={lastReport.readinessScore}
                        size="lg"
                        variant="auto"
                        display="clean"
                        label="Readiness"
                      />
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
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
                  /* Terminal preview mock */
                  <div className="w-full max-w-sm rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
                    {/* Terminal bar */}
                    <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-4 py-2.5 bg-[var(--bg-secondary)]">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]/60" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-warning)]/60" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]/60" />
                      </div>
                      <span className="ml-2 font-mono text-[11px] text-[var(--text-muted)]">
                        diagnostic.output
                      </span>
                    </div>
                    {/* Terminal content */}
                    <div className="p-5 font-mono text-sm space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">READINESS</span>
                        <span className="font-semibold text-[var(--color-warning)]">73</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">RISK_BAND</span>
                        <span className="font-semibold text-[var(--color-warning)]">MEDIUM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">RED_FLAGS</span>
                        <span className="font-semibold text-[var(--color-danger)]">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">FIX_TIME</span>
                        <span className="font-semibold text-[var(--text-primary)]">2h 15m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">TECH_FIT</span>
                        <span className="font-semibold text-[var(--color-success)]">87%</span>
                      </div>
                      <div className="h-px bg-[var(--border-default)] my-1" />
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--accent-primary)]">&gt;</span>
                        <span className="text-[var(--text-secondary)]">analyzing</span>
                        <span className="terminal-cursor text-[var(--accent-primary)]">_</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>

        {/* Scroll CTA */}
        <div className="flex justify-center py-12">
          <div className="animate-scroll-cta flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-[var(--text-secondary)]">Scroll to discover more</p>
            <svg
              className="h-6 w-6 text-[var(--accent-primary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <p className="text-xs text-[var(--text-muted)]">Learn how InterviewProof works</p>
          </div>
        </div>

        {/* 2. OnboardingCarousel */}
        <OnboardingCarousel />

        {/* 3. Live Analysis Feed */}
        <LiveAnalysisFeed />

        {/* 4. Quick Value Cards */}
        <section>
          <Container className="py-10">
            <h2 className="mb-5 text-lg font-semibold text-[var(--text-primary)]">
              {lastReport
                ? lastReport.companyName
                  ? `Your last diagnostic for ${lastReport.companyName}`
                  : 'Your last diagnostic'
                : 'What You\u2019ll Get'}
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {/* Card 1: Hire-Zone Score */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
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
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Top Rejection Risks
                  </h3>
                  <Badge variant="high">Evidence-Backed</Badge>
                </div>
                <ul className="mt-3 space-y-2">
                  {(lastReport?.top3Risks?.length ?? 0) > 0
                    ? lastReport!.top3Risks.map((risk, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <span
                            className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                risk.severity === 'critical' || risk.severity === 'high'
                                  ? 'var(--color-danger)'
                                  : risk.severity === 'medium'
                                    ? 'var(--color-warning)'
                                    : 'var(--color-success)',
                            }}
                          />
                          {risk.title}
                        </li>
                      ))
                    : [
                        'Missing system design depth',
                        'No CI/CD pipeline experience',
                        'Weak behavioral examples',
                      ].map((text, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <span
                            className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                i < 2 ? 'var(--color-danger)' : 'var(--color-warning)',
                            }}
                          />
                          {text}
                        </li>
                      ))}
                </ul>
              </div>

              {/* Card 3: Fastest Wins */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Fastest Wins</h3>
                  <Badge variant="accent">Prioritized</Badge>
                </div>
                <ul className="mt-3 space-y-2">
                  {(lastReport?.top3StudyPlan?.length ?? 0) > 0
                    ? lastReport!.top3StudyPlan.map((item, i) => (
                        <li key={i} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">{item.task}</span>
                          <span className="flex-shrink-0 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                            {item.timeEstimateMinutes >= 60
                              ? `${Math.floor(item.timeEstimateMinutes / 60)}hr ${item.timeEstimateMinutes % 60}min`
                              : `${item.timeEstimateMinutes}min`}
                          </span>
                        </li>
                      ))
                    : [
                        { task: 'Add metrics to project bullets', time: '20min' },
                        { task: 'Prepare 2 STAR stories', time: '30min' },
                        { task: 'Review system design basics', time: '45min' },
                      ].map((item, i) => (
                        <li key={i} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">{item.task}</span>
                          <span className="flex-shrink-0 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                            {item.time}
                          </span>
                        </li>
                      ))}
                </ul>
              </div>

              {/* Card 4: Personalized Coaching */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 md:col-span-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Personalized Questions, Coaching & Tips
                  </h3>
                  <Badge variant="success">AI-Powered</Badge>
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Beyond the score — get interview questions the AI predicts you&apos;ll be asked, coaching on how to answer them using your ACTUAL experience, and targeted tips to turn your weak spots into strengths. Every recommendation is built from your resume and the specific job, not generic advice.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* 5. PipelineDiagram */}
        <PipelineDiagram />

        {/* 6. Vertical AI Data Sources */}
        <section className="border-t border-[var(--border-default)]">
          <Container className="py-16">
            <div className="text-center">
              <Badge variant="accent">Vertical AI Model</Badge>
              <h2 className="mt-4 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl tracking-tight">
                Trained on the Best Interview Intelligence Available
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
                This isn&apos;t a generic chatbot wrapper. InterviewProof runs a vertical AI model that continuously scans, reads, and cross-references the highest-quality interview prep sources on the internet — so every diagnostic is backed by real hiring knowledge, not guesswork.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Source 1 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Open-Source Prep Repos</h3>
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  Indexes the top-starred GitHub repositories for system design, coding patterns, behavioral frameworks, and interview question banks.
                </p>
              </div>

              {/* Source 2 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Hiring Rubrics & Frameworks</h3>
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  Structured scoring rubrics from published hiring guides, recruiter playbooks, and real interview evaluation criteria used at top companies.
                </p>
              </div>

              {/* Source 3 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Role-Specific Intelligence</h3>
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  Industry data on role expectations, skill benchmarks, and common rejection patterns mapped per job function and seniority level.
                </p>
              </div>

              {/* Source 4 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Behavioral & STAR Libraries</h3>
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  Curated collections of behavioral question banks, STAR response frameworks, and competency-based evaluation models.
                </p>
              </div>

              {/* Source 5 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Proprietary Analysis Engine</h3>
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  All sources feed into our proprietary scoring engine that cross-references your resume against role requirements — producing diagnostics no generic AI can match.
                </p>
              </div>

              {/* Source 6 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Continuously Updated</h3>
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  New repositories, updated rubrics, and fresh hiring data are ingested regularly — so the model stays current with how companies actually interview today.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* 7. BenefitsRisks */}
        <BenefitsRisks />

        {/* 8. Report Preview Showcase */}
        <ReportPreviewShowcase ctaHref={ctaHref} />

        {/* 9. InterviewIntelligenceStats */}
        <InterviewIntelligenceStats />

        {/* 9. FAQ */}
        <FAQ />

        {/* 10. Credibility Strip */}
        <section className="border-t border-[var(--border-default)] bg-[var(--bg-card)]">
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

        {/* 11. Footer CTA */}
        <section className="border-t border-[var(--border-default)]">
          <Container className="py-16 text-center">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl tracking-tight">
              Ready to Find Your Gaps?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--text-secondary)]">
              Get a clear, evidence-based diagnostic in minutes — plus personalized questions, coaching, and tips tailored to your resume and the role.
            </p>
            <div className="mt-6">
              <Link href={ctaHref}>
                <Button variant="accent" size="lg">
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
