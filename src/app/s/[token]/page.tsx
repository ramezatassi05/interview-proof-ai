'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LoadingOverlay } from '@/components/ui/Spinner';
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs';
import { ExecutiveSummary } from '@/components/results/ExecutiveSummary';
import { StrengthsAndRisks } from '@/components/results/StrengthsAndRisks';
import { RiskList } from '@/components/results/RiskList';
import { InterviewQuestions } from '@/components/diagnostic/InterviewQuestions';
import { StudyPlan } from '@/components/diagnostic/StudyPlan';
import { ScoreBreakdown } from '@/components/diagnostic/ScoreBreakdown';
import { CoachingHub } from '@/components/diagnostic/CoachingHub';
import { CognitiveRadar } from '@/components/diagnostic/CognitiveRadar';
import { RecruiterView } from '@/components/diagnostic/RecruiterView';
import { PracticeIntelligencePanel } from '@/components/diagnostic/PracticeIntelligencePanel';
import { PriorityActions } from '@/components/diagnostic/PriorityActions';
import { HireZoneChart } from '@/components/diagnostic/HireZoneChart';

import type { GetReportResponse } from '@/lib/api';

type SharedReportData = GetReportResponse['data'] & { isShared?: boolean };

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token as string;

  const [report, setReport] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedReport = async () => {
      try {
        const res = await fetch(`/api/report/shared/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Report not found');
          return;
        }

        setReport(data.data);
      } catch {
        setError('Failed to load shared report');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedReport();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <LoadingOverlay message="Loading shared report..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Container size="sm">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8 text-center">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Report Not Available
              </h2>
              <p className="mt-2 text-[var(--text-secondary)]">
                {error || 'This shared report link is no longer active.'}
              </p>
              <Link
                href="/new"
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
              >
                Get Your Own Report
              </Link>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />
      <main className="flex-1 py-8">
        <Container>
          {/* Shared badge + header */}
          <div className="mb-8">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-accent)] bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Shared Report
            </span>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {report.extractedJD?.companyName
                ? `${report.extractedJD.companyName} Readiness Intelligence Report`
                : 'Readiness Intelligence Report'}
            </h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              {report.roundType.charAt(0).toUpperCase() + report.roundType.slice(1)} interview
              analysis
              {report.extractedJD?.companyName ? ` for ${report.extractedJD.companyName}` : ''}
            </p>
          </div>

          {/* Executive Summary */}
          <ExecutiveSummary
            readinessScore={report.readinessScore!}
            riskBand={report.riskBand!}
            totalRisks={report.allRisks?.length ?? 0}
            roundType={report.roundType}
            scoreBreakdown={report.scoreBreakdown}
            evidenceContext={report.diagnosticIntelligence?.evidenceContext}
            companyName={report.extractedJD?.companyName}
            jobTitle={report.extractedJD?.jobTitle}
            conversionLikelihood={report.diagnosticIntelligence?.executiveScores?.conversionLikelihood}
            technicalFit={report.diagnosticIntelligence?.executiveScores?.technicalFit}
          />

          {/* Priority Actions */}
          {report.personalizedCoaching?.priorityActions && (
            <div className="mt-8">
              <PriorityActions
                actions={report.personalizedCoaching.priorityActions}
                companyName={report.extractedJD?.companyName}
              />
            </div>
          )}

          {/* Strengths & Risks */}
          <div className="mt-8">
            <StrengthsAndRisks
              scoreBreakdown={report.scoreBreakdown}
              risks={report.allRisks ?? []}
              maxItems={4}
              evidenceContext={report.diagnosticIntelligence?.evidenceContext}
            />
          </div>

          {/* Tabbed Content */}
          <Tabs defaultTab="scores" className="mt-8">
            <TabList className="mb-6">
              <TabTrigger
                id="scores"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              >
                Signal Strength
              </TabTrigger>
              <TabTrigger
                id="hirezone"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
              >
                Hire Zone
              </TabTrigger>
              <TabTrigger
                id="risks"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
              >
                Red Flags ({report.allRisks?.length ?? 0})
              </TabTrigger>
              <TabTrigger
                id="questions"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Questions ({report.interviewQuestions?.length ?? 0})
              </TabTrigger>
              <TabTrigger
                id="study"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
              >
                Execution Roadmap
              </TabTrigger>
              <TabTrigger
                id="archetype"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                }
              >
                Coaching
              </TabTrigger>
              <TabTrigger
                id="cognitive"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                }
              >
                Cognitive Map
              </TabTrigger>
              <TabTrigger
                id="recruiter"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              >
                Recruiter View
              </TabTrigger>
              <TabTrigger
                id="practice"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                }
              >
                Practice Intel
              </TabTrigger>
            </TabList>

            <TabContent id="scores">
              {report.scoreBreakdown ? (
                <ScoreBreakdown
                  breakdown={report.scoreBreakdown}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  No signal strength data available
                </div>
              )}
            </TabContent>

            <TabContent id="hirezone">
              {report.diagnosticIntelligence?.hireZoneAnalysis ? (
                <HireZoneChart
                  hireZone={report.diagnosticIntelligence.hireZoneAnalysis}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  No hire zone analysis available
                </div>
              )}
            </TabContent>

            <TabContent id="risks">
              {report.allRisks && report.allRisks.length > 0 ? (
                <RiskList
                  risks={report.allRisks}
                  title={`${report.extractedJD?.companyName ? `${report.extractedJD.companyName} ` : ''}All Recruiter Red Flags (${report.allRisks.length})`}
                  showEvidence
                />
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  No recruiter red flags identified
                </div>
              )}
            </TabContent>

            <TabContent id="questions">
              {report.interviewQuestions && report.interviewQuestions.length > 0 ? (
                <InterviewQuestions
                  questions={report.interviewQuestions}
                  companyName={report.extractedJD?.companyName}
                  reportId={report.reportId}
                />
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  No interview questions generated
                </div>
              )}
            </TabContent>

            <TabContent id="study">
              {report.studyPlan && report.studyPlan.length > 0 ? (
                <StudyPlan
                  tasks={report.studyPlan}
                  personalizedStudyPlan={report.personalizedStudyPlan}
                  companyName={report.extractedJD?.companyName}
                  reportId={report.reportId}
                />
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  No execution roadmap available
                </div>
              )}
            </TabContent>

            <TabContent id="archetype">
              {report.diagnosticIntelligence?.archetypeProfile ? (
                <CoachingHub
                  archetypeProfile={report.diagnosticIntelligence.archetypeProfile}
                  roundForecasts={report.diagnosticIntelligence.roundForecasts}
                  trajectoryProjection={report.diagnosticIntelligence.trajectoryProjection}
                  evidenceContext={report.diagnosticIntelligence.evidenceContext}
                  personalizedCoaching={report.personalizedCoaching}
                  companyDifficulty={report.diagnosticIntelligence.companyDifficulty}
                  userRoundType={report.roundType}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  No coaching data available
                </div>
              )}
            </TabContent>

            <TabContent id="cognitive">
              {report.diagnosticIntelligence?.cognitiveRiskMap ? (
                <CognitiveRadar
                  riskMap={report.diagnosticIntelligence.cognitiveRiskMap}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  No cognitive risk map available
                </div>
              )}
            </TabContent>

            <TabContent id="recruiter">
              {report.diagnosticIntelligence?.recruiterSimulation ? (
                <RecruiterView
                  simulation={report.diagnosticIntelligence.recruiterSimulation}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  No recruiter simulation available
                </div>
              )}
            </TabContent>

            <TabContent id="practice">
              {report.diagnosticIntelligence?.practiceIntelligence ? (
                <PracticeIntelligencePanel
                  data={report.diagnosticIntelligence.practiceIntelligence}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  No practice intelligence available
                </div>
              )}
            </TabContent>
          </Tabs>

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-[var(--border-accent)] bg-[var(--color-accent)]/5 p-8 text-center">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Want your own interview diagnostic?
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Upload your resume and job description to get a personalized readiness report.
            </p>
            <Link
              href="/new"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
            >
              Get started free
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
