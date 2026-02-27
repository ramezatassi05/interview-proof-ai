'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, APIRequestError, GetReportResponse } from '@/lib/api';
import type { DeltaComparison } from '@/types';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LoadingOverlay } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ReportSidebar } from '@/components/diagnostic/ReportSidebar';
import { SectionHeader } from '@/components/diagnostic/SectionHeader';
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
import { CompetencyHeatmap } from '@/components/diagnostic/CompetencyHeatmap';
import { ShareModal } from '@/components/share/ShareModal';
import { DeltaView } from '@/components/diagnostic/DeltaView';

type ReportData = GetReportResponse['data'];

const REPORT_SECTIONS = [
  { id: 'summary', number: '00', label: 'Executive Summary' },
  { id: 'priority', number: '01', label: 'Priority Actions' },
  { id: 'strengths', number: '02', label: 'Strengths & Risks' },
  { id: 'scores', number: '03', label: 'Signal Strength' },
  { id: 'hirezone', number: '04', label: 'Hire Zone' },
  { id: 'competency', number: '05', label: 'Competency Map' },
  { id: 'risks', number: '06', label: 'Red Flags' },
  { id: 'questions', number: '07', label: 'Questions' },
  { id: 'study', number: '08', label: 'Execution Roadmap' },
  { id: 'coaching', number: '09', label: 'Coaching' },
  { id: 'cognitive', number: '10', label: 'Cognitive Map' },
  { id: 'recruiter', number: '11', label: 'Recruiter View' },
  { id: 'practice', number: '12', label: 'Practice Intel' },
];

export default function FullDiagnosticPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const reportId = params.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);
  const [rerunDelta, setRerunDelta] = useState<DeltaComparison | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/auth/login?redirect=/r/${reportId}/full`);
      return;
    }

    const fetchReport = async () => {
      try {
        const result = await api.getReport(reportId);
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

  // Elapsed-time timer during rerun
  useEffect(() => {
    if (!rerunning) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [rerunning]);

  const handleRerun = async () => {
    setRerunning(true);
    setRerunError(null);
    setRerunDelta(null);
    try {
      const result = await api.rerunReport(reportId);
      setRerunDelta(result.data.delta);
      const updated = await api.getReport(reportId);
      setReport(updated.data);
    } catch (err: unknown) {
      console.error('Rerun failed:', err);
      if (err instanceof APIRequestError) {
        setRerunError(err.message);
      } else if (err instanceof Error) {
        setRerunError(err.message);
      } else {
        setRerunError('Rerun failed. Please try again.');
      }
    } finally {
      setRerunning(false);
    }
  };

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
          <div className="mx-auto max-w-md">
            <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-8 text-center">
              <h2 className="text-lg font-semibold text-[var(--color-danger)]">Error</h2>
              <p className="mt-2 text-[var(--text-secondary)]">{error}</p>
              <Button variant="secondary" onClick={() => router.push('/new')} className="mt-4">
                Start New Analysis
              </Button>
            </div>
          </div>
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
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <ReportSidebar sections={REPORT_SECTIONS} />

        {/* Main Content — single scrollable column */}
        <main className="flex-1 min-w-0 py-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Header with actions */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                  {report.extractedJD?.companyName
                    ? `${report.extractedJD.companyName} Readiness Intelligence Report`
                    : 'Readiness Intelligence Report'}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {report.roundType.charAt(0).toUpperCase() + report.roundType.slice(1)} interview
                  analysis
                  {report.extractedJD?.companyName ? ` for ${report.extractedJD.companyName}` : ''}
                  {report.extractedJD?.jobTitle ? ` · ${report.extractedJD.jobTitle}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-accent)]"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                <a
                  href={`/api/report/${reportId}/pdf`}
                  download
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-accent)]"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
                {canRerun && (
                  <Button variant="secondary" size="sm" onClick={handleRerun} disabled={rerunning}>
                    {rerunning ? 'Rerunning…' : 'Rerun Analysis'}
                  </Button>
                )}
              </div>
            </div>

            {rerunning && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--border-accent)]/30 bg-[var(--bg-card)] px-4 py-3">
                <svg className="h-4 w-4 animate-spin text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-[var(--text-secondary)]">
                  Running full analysis pipeline — this may take up to a minute…
                  {elapsedSeconds >= 5 && (
                    <span className="ml-1 text-[var(--text-muted)]">({elapsedSeconds}s)</span>
                  )}
                </span>
              </div>
            )}

            {rerunError && (
              <div className="mb-6 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-4 py-3 text-sm text-[var(--color-danger)]">
                {rerunError}
              </div>
            )}

            {rerunDelta && (
              <div className="mb-8">
                <DeltaView delta={rerunDelta} />
              </div>
            )}

            {/* 00 — Executive Summary */}
            <section id="summary">
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
                priorEmploymentSignal={report.diagnosticIntelligence?.priorEmploymentSignal}
              />
            </section>

            {/* 01 — Priority Actions */}
            {report.personalizedCoaching?.priorityActions && (
              <section id="priority" className="mt-12">
                <SectionHeader number="01" title="Priority Actions" />
                <PriorityActions
                  actions={report.personalizedCoaching.priorityActions}
                  companyName={report.extractedJD?.companyName}
                />
              </section>
            )}

            {/* 02 — Strengths & Risks */}
            <section id="strengths" className="mt-12">
              <SectionHeader number="02" title="Strengths & Risks" />
              <StrengthsAndRisks
                scoreBreakdown={report.scoreBreakdown}
                risks={report.allRisks ?? []}
                maxItems={4}
                evidenceContext={report.diagnosticIntelligence?.evidenceContext}
              />
            </section>

            {/* 03 — Signal Strength */}
            <section id="scores" className="mt-12">
              <SectionHeader number="03" title="Signal Strength" />
              {report.scoreBreakdown ? (
                <ScoreBreakdown
                  breakdown={report.scoreBreakdown}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No signal strength data available</p>
              )}
            </section>

            {/* 04 — Hire Zone */}
            <section id="hirezone" className="mt-12">
              <SectionHeader number="04" title="Hire Zone" />
              {report.diagnosticIntelligence?.hireZoneAnalysis ? (
                <HireZoneChart
                  hireZone={report.diagnosticIntelligence.hireZoneAnalysis}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No hire zone analysis available</p>
              )}
            </section>

            {/* 05 — Competency Map */}
            <section id="competency" className="mt-12">
              <SectionHeader number="05" title="Competency Map" />
              {report.diagnosticIntelligence?.competencyHeatmap ? (
                <CompetencyHeatmap
                  heatmap={report.diagnosticIntelligence.competencyHeatmap}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No competency heatmap available</p>
              )}
            </section>

            {/* 06 — Red Flags */}
            <section id="risks" className="mt-12">
              <SectionHeader number="06" title={`${report.extractedJD?.companyName ? `${report.extractedJD.companyName} ` : ''}All Recruiter Red Flags (${report.allRisks?.length ?? 0})`} />
              {report.allRisks && report.allRisks.length > 0 ? (
                <RiskList risks={report.allRisks} showEvidence />
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No recruiter red flags identified</p>
              )}
            </section>

            {/* 07 — Questions */}
            <section id="questions" className="mt-12">
              <SectionHeader number="07" title={`Questions (${report.interviewQuestions?.length ?? 0})`} />
              {report.interviewQuestions && report.interviewQuestions.length > 0 ? (
                <InterviewQuestions
                  questions={report.interviewQuestions}
                  companyName={report.extractedJD?.companyName}
                  reportId={reportId}
                />
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No interview questions generated</p>
              )}
            </section>

            {/* 08 — Execution Roadmap */}
            <section id="study" className="mt-12">
              <SectionHeader number="08" title="Execution Roadmap" />
              {report.studyPlan && report.studyPlan.length > 0 ? (
                <StudyPlan
                  tasks={report.studyPlan}
                  personalizedStudyPlan={report.personalizedStudyPlan}
                  companyName={report.extractedJD?.companyName}
                  reportId={reportId}
                />
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No execution roadmap available</p>
              )}
            </section>

            {/* 09 — Coaching */}
            <section id="coaching" className="mt-12">
              <SectionHeader number="09" title="Coaching" />
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
                <p className="text-sm text-[var(--text-muted)]">No coaching data available</p>
              )}
            </section>

            {/* 10 — Cognitive Map */}
            <section id="cognitive" className="mt-12">
              <SectionHeader number="10" title="Cognitive Map" />
              {report.diagnosticIntelligence?.cognitiveRiskMap ? (
                <CognitiveRadar
                  riskMap={report.diagnosticIntelligence.cognitiveRiskMap}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No cognitive risk map available</p>
              )}
            </section>

            {/* 11 — Recruiter View */}
            <section id="recruiter" className="mt-12">
              <SectionHeader number="11" title="Recruiter View" />
              {report.diagnosticIntelligence?.recruiterSimulation ? (
                <RecruiterView
                  simulation={report.diagnosticIntelligence.recruiterSimulation}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No recruiter simulation available</p>
              )}
            </section>

            {/* 12 — Practice Intel */}
            <section id="practice" className="mt-12 mb-16">
              <SectionHeader number="12" title="Practice Intel" />
              {report.diagnosticIntelligence?.practiceIntelligence ? (
                <PracticeIntelligencePanel
                  data={report.diagnosticIntelligence.practiceIntelligence}
                  companyName={report.extractedJD?.companyName}
                />
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No practice intelligence available</p>
              )}
            </section>
          </div>
        </main>
      </div>

      <Footer />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        reportId={reportId}
        initialEnabled={report.shareEnabled || false}
        initialShareUrl={report.shareUrl}
        readinessScore={report.readinessScore}
        companyName={report.extractedJD?.companyName}
      />
    </div>
  );
}
