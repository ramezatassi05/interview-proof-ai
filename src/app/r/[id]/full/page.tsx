'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, APIRequestError, GetReportResponse } from '@/lib/api';

import { AppLayout } from '@/components/layout/AppLayout';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LoadingOverlay } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs';
import { ExecutiveSummary } from '@/components/results/ExecutiveSummary';
import { StrengthsAndRisks } from '@/components/results/StrengthsAndRisks';
import { RiskList } from '@/components/results/RiskList';
import { InterviewQuestions } from '@/components/diagnostic/InterviewQuestions';
import { StudyPlan } from '@/components/diagnostic/StudyPlan';
import { ScoreBreakdown } from '@/components/diagnostic/ScoreBreakdown';
import { ArchetypeCard } from '@/components/diagnostic/ArchetypeCard';
import { CognitiveRadar } from '@/components/diagnostic/CognitiveRadar';
import { RecruiterView } from '@/components/diagnostic/RecruiterView';
import { PracticeIntelligencePanel } from '@/components/diagnostic/PracticeIntelligencePanel';
import { PriorityActions } from '@/components/diagnostic/PriorityActions';
import { HireZoneChart } from '@/components/diagnostic/HireZoneChart';

type ReportData = GetReportResponse['data'];

export default function FullDiagnosticPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const reportId = params.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('scores');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/auth/login?redirect=/r/${reportId}/full`);
      return;
    }

    const fetchReport = async () => {
      try {
        const result = await api.getReport(reportId);

        // TEMP: Bypass paywall - allow access regardless of payment status

        setReport(result.data);
      } catch (err) {
        if (err instanceof APIRequestError) {
          if (err.isUnauthorized) {
            router.push(`/auth/login?redirect=/r/${reportId}/full`);
          } else if (err.isNotFound) {
            setError('Report not found.');
          } else if (err.isForbidden) {
            router.push(`/r/${reportId}`);
          } else {
            setError(err.message);
          }
        } else {
          setError('Failed to load report.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <LoadingOverlay message="Loading your diagnostic..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Container size="sm">
            <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-8 text-center">
              <h2 className="text-lg font-semibold text-[var(--color-danger)]">Error</h2>
              <p className="mt-2 text-[var(--text-secondary)]">{error}</p>
              <Button variant="secondary" onClick={() => router.push('/new')} className="mt-4">
                Start New Analysis
              </Button>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const canRerun = (report.runCount ?? 0) < 2;

  return (
    <AppLayout activeTab={activeTab} reportData={report}>
      {/* Header with actions */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
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
        <div className="flex gap-3">
          <a
            href={`/api/report/${reportId}/pdf`}
            download
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--bg-card)] hover:border-[var(--border-accent)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </a>
          {canRerun && (
            <Button
              variant="secondary"
              onClick={() => {
                router.push(`/r/${reportId}/rerun`);
              }}
            >
              Rerun Analysis
            </Button>
          )}
        </div>
      </div>

      {/* Executive Summary - Always visible at top */}
      <ExecutiveSummary
        readinessScore={report.readinessScore!}
        riskBand={report.riskBand!}
        totalRisks={report.totalRisks ?? 0}
        roundType={report.roundType}
        scoreBreakdown={report.scoreBreakdown}
        evidenceContext={report.diagnosticIntelligence?.evidenceContext}
        companyName={report.extractedJD?.companyName}
      />

      {/* Priority Actions - High visibility "Start Here" section */}
      {report.personalizedCoaching?.priorityActions && (
        <div className="mt-8">
          <PriorityActions
            actions={report.personalizedCoaching.priorityActions}
            companyName={report.extractedJD?.companyName}
          />
        </div>
      )}

      {/* Strengths & Risks - Two column layout */}
      <div className="mt-8">
        <StrengthsAndRisks
          scoreBreakdown={report.scoreBreakdown}
          risks={report.allRisks ?? []}
          maxItems={4}
          evidenceContext={report.diagnosticIntelligence?.evidenceContext}
        />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultTab="scores" className="mt-8" onTabChange={setActiveTab}>
        <TabList className="mb-6">
          <TabTrigger
            id="scores"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
          >
            Signal Strength
          </TabTrigger>
          <TabTrigger
            id="hirezone"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            }
          >
            Hire Zone
          </TabTrigger>
          <TabTrigger
            id="risks"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            }
          >
            Red Flags ({report.allRisks?.length ?? 0})
          </TabTrigger>
          <TabTrigger
            id="questions"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          >
            Questions ({report.interviewQuestions?.length ?? 0})
          </TabTrigger>
          <TabTrigger
            id="study"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            }
          >
            Execution Roadmap
          </TabTrigger>
          <TabTrigger
            id="archetype"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            }
          >
            Coaching
          </TabTrigger>
          <TabTrigger
            id="cognitive"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            }
          >
            Cognitive Map
          </TabTrigger>
          <TabTrigger
            id="recruiter"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            }
          >
            Recruiter View
          </TabTrigger>
          <TabTrigger
            id="practice"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
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
            />
          ) : (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              No execution roadmap available
            </div>
          )}
        </TabContent>

        <TabContent id="archetype">
          {report.diagnosticIntelligence?.archetypeProfile ? (
            <ArchetypeCard
              profile={report.diagnosticIntelligence.archetypeProfile}
              companyName={report.extractedJD?.companyName}
            />
          ) : (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              No archetype profile available
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
    </AppLayout>
  );
}
