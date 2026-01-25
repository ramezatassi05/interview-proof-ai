'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, APIRequestError, GetReportResponse } from '@/lib/api';

import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LoadingOverlay } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ScoreCard } from '@/components/results/ScoreCard';
import { RiskList } from '@/components/results/RiskList';
import { InterviewQuestions } from '@/components/diagnostic/InterviewQuestions';
import { StudyPlan } from '@/components/diagnostic/StudyPlan';
import { ScoreBreakdown } from '@/components/diagnostic/ScoreBreakdown';

type ReportData = GetReportResponse['data'];

export default function FullDiagnosticPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const reportId = params.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
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
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Container size="sm">
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">Error</h2>
              <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 py-12">
        <Container size="md">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Full Diagnostic Report
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {report.roundType.charAt(0).toUpperCase() + report.roundType.slice(1)} interview
                analysis
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href={`/api/report/${reportId}/pdf`}
                download
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
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

          <div className="space-y-10">
            {/* Score Card */}
            <ScoreCard score={report.readinessScore!} riskBand={report.riskBand!} />

            {/* Score Breakdown */}
            {report.scoreBreakdown && <ScoreBreakdown breakdown={report.scoreBreakdown} />}

            {/* All Risks */}
            {report.allRisks && report.allRisks.length > 0 && (
              <RiskList
                risks={report.allRisks}
                title={`All Rejection Risks (${report.allRisks.length})`}
                showEvidence
              />
            )}

            {/* Interview Questions */}
            {report.interviewQuestions && report.interviewQuestions.length > 0 && (
              <InterviewQuestions questions={report.interviewQuestions} />
            )}

            {/* Study Plan */}
            {report.studyPlan && report.studyPlan.length > 0 && (
              <StudyPlan tasks={report.studyPlan} />
            )}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
