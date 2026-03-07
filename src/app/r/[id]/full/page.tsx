'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLazyTab } from '@/hooks/useLazyTab';
import { api, APIRequestError, GetReportResponse } from '@/lib/api';
import type { DeltaComparison } from '@/types';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { DiagnosticSkeleton } from '@/components/diagnostic/DiagnosticSkeleton';
import { ReportToolbar } from '@/components/diagnostic/ReportToolbar';
import { DiagnosticDashboard } from '@/components/diagnostic/DiagnosticDashboard';
import {
  DiagnosticTabs,
  BarChartIcon,
  BookOpenIcon,
  TargetIcon,
  EyeIcon,
} from '@/components/diagnostic/DiagnosticTabs';
import type { TabId } from '@/components/diagnostic/DiagnosticTabs';
import { DeltaView } from '@/components/diagnostic/DeltaView';
import { ShareModal } from '@/components/share/ShareModal';

import { AnalysisTab } from '@/components/diagnostic/tabs/AnalysisTab';
import { PracticeTab } from '@/components/diagnostic/tabs/PracticeTab';
import { StrategyTab } from '@/components/diagnostic/tabs/StrategyTab';
import { InsightsTab } from '@/components/diagnostic/tabs/InsightsTab';

type ReportData = GetReportResponse['data'];

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

  const { activeTab, switchTab, hasBeenMounted } = useLazyTab('analysis');

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

  const handleTabSwitch = useCallback(
    (tab: string) => {
      switchTab(tab as TabId);
    },
    [switchTab]
  );

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Header />
        <main className="flex-1">
          <DiagnosticSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
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

  if (!report) return null;

  const canRerun = (report.runCount ?? 0) < 2;
  const di = report.diagnosticIntelligence;
  const companyName = report.extractedJD?.companyName;

  // Tab config with badges
  const tabs = [
    {
      id: 'analysis' as TabId,
      label: 'Analysis',
      icon: <BarChartIcon />,
      badge: report.allRisks?.length ?? 0,
    },
    {
      id: 'practice' as TabId,
      label: 'Practice',
      icon: <BookOpenIcon />,
      badge: report.interviewQuestions?.length ?? 0,
    },
    {
      id: 'strategy' as TabId,
      label: 'Strategy',
      icon: <TargetIcon />,
      badge: report.personalizedCoaching?.priorityActions?.length ?? 0,
    },
    {
      id: 'insights' as TabId,
      label: 'Insights',
      icon: <EyeIcon />,
    },
  ];

  // Render active tab content with lazy mounting
  const renderTabContent = () => {
    switch (activeTab) {
      case 'analysis':
        return (
          <AnalysisTab
            scoreBreakdown={report.scoreBreakdown}
            hireZoneAnalysis={di?.hireZoneAnalysis}
            competencyHeatmap={di?.competencyHeatmap}
            allRisks={report.allRisks}
            evidenceContext={di?.evidenceContext}
            companyName={companyName}
          />
        );
      case 'practice':
        return hasBeenMounted('practice') ? (
          <PracticeTab
            interviewQuestions={report.interviewQuestions}
            studyPlan={report.studyPlan}
            personalizedStudyPlan={report.personalizedStudyPlan}
            practiceIntelligence={di?.practiceIntelligence}
            companyName={companyName}
            reportId={reportId}
          />
        ) : null;
      case 'strategy':
        return hasBeenMounted('strategy') ? (
          <StrategyTab
            priorityActions={report.personalizedCoaching?.priorityActions}
            archetypeProfile={di?.archetypeProfile}
            roundForecasts={di?.roundForecasts}
            trajectoryProjection={di?.trajectoryProjection}
            evidenceContext={di?.evidenceContext}
            personalizedCoaching={report.personalizedCoaching}
            companyDifficulty={di?.companyDifficulty}
            cognitiveRiskMap={di?.cognitiveRiskMap}
            userRoundType={report.roundType}
            companyName={companyName}
          />
        ) : null;
      case 'insights':
        return hasBeenMounted('insights') ? (
          <InsightsTab
            recruiterSimulation={di?.recruiterSimulation}
            readinessScore={report.readinessScore!}
            riskBand={report.riskBand!}
            totalRisks={report.allRisks?.length ?? 0}
            roundType={report.roundType}
            scoreBreakdown={report.scoreBreakdown}
            evidenceContext={di?.evidenceContext}
            companyName={companyName}
            jobTitle={report.extractedJD?.jobTitle}
            conversionLikelihood={di?.executiveScores?.conversionLikelihood}
            technicalFit={di?.executiveScores?.technicalFit}
            priorEmploymentSignal={di?.priorEmploymentSignal}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />

      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Report Toolbar */}
          <ReportToolbar
            companyName={companyName}
            jobTitle={report.extractedJD?.jobTitle}
            roundType={report.roundType}
            reportId={reportId}
            canRerun={canRerun}
            rerunning={rerunning}
            onShare={() => setShareModalOpen(true)}
            onRerun={handleRerun}
          />

          {/* Rerun status */}
          {rerunning && (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border-accent)]/30 bg-[var(--bg-card)] px-4 py-3">
              <svg
                className="h-4 w-4 animate-spin text-[var(--color-accent)]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm text-[var(--text-secondary)]">
                Running full analysis pipeline...
                {elapsedSeconds >= 5 && (
                  <span className="ml-1 text-[var(--text-muted)]">({elapsedSeconds}s)</span>
                )}
              </span>
            </div>
          )}

          {rerunError && (
            <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-4 py-3 text-sm text-[var(--color-danger)]">
              {rerunError}
            </div>
          )}

          {rerunDelta && <DeltaView delta={rerunDelta} />}

          {/* Hero Dashboard */}
          <DiagnosticDashboard
            readinessScore={report.readinessScore!}
            riskBand={report.riskBand!}
            totalRisks={report.allRisks?.length ?? 0}
            roundType={report.roundType}
            scoreBreakdown={report.scoreBreakdown}
            evidenceContext={di?.evidenceContext}
            companyName={companyName}
            jobTitle={report.extractedJD?.jobTitle}
            conversionLikelihood={di?.executiveScores?.conversionLikelihood}
            technicalFit={di?.executiveScores?.technicalFit}
            priorEmploymentSignal={di?.priorEmploymentSignal}
            hireZoneAnalysis={di?.hireZoneAnalysis}
            priorityAction={report.personalizedCoaching?.priorityActions?.[0]}
            onTabSwitch={handleTabSwitch}
          />

          {/* Tabbed Sections */}
          <DiagnosticTabs
            activeTab={activeTab as TabId}
            onTabChange={(tab) => switchTab(tab)}
            tabs={tabs}
          >
            {renderTabContent()}
          </DiagnosticTabs>
        </div>
      </main>

      <Footer />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        reportId={reportId}
        initialEnabled={report.shareEnabled || false}
        initialShareUrl={report.shareUrl}
        readinessScore={report.readinessScore}
        companyName={companyName}
      />
    </div>
  );
}
