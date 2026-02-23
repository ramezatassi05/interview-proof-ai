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
import { PaywallCTA } from '@/components/results/PaywallCTA';
import { InsightOwlCelebrating } from '@/components/svg/InsightOwlMascot';

type ReportData = GetReportResponse['data'];

export default function ResultsPage() {
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
      router.push(`/auth/login?redirect=/r/${reportId}`);
      return;
    }

    const fetchReport = async () => {
      try {
        const result = await api.getReport(reportId);
        setReport(result.data);

        // If already paid, redirect to full diagnostic
        if (result.data.paidUnlocked && result.data.analyzed) {
          router.push(`/r/${reportId}/full`);
        }
      } catch (err) {
        if (err instanceof APIRequestError) {
          if (err.isUnauthorized) {
            router.push(`/auth/login?redirect=/r/${reportId}`);
          } else if (err.isNotFound) {
            setError('Report not found.');
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
          <LoadingOverlay message="Loading your results..." />
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
            <div className="rounded-[20px] bg-[var(--color-danger-muted)] p-8 text-center shadow-warm">
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

  if (!report || !report.analyzed) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Container size="sm">
            <div className="rounded-[20px] bg-[var(--bg-card)] p-8 text-center shadow-warm">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Analysis Not Complete
              </h2>
              <p className="mt-2 text-[var(--text-secondary)]">
                This report hasn&apos;t been analyzed yet.
              </p>
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

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />

      <main className="flex-1 py-12">
        <Container size="md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {report.extractedJD?.companyName
                ? `Your ${report.extractedJD.companyName} Interview Diagnostic`
                : 'Your Interview Diagnostic'}
            </h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              {report.roundType.charAt(0).toUpperCase() + report.roundType.slice(1)} interview
              analysis
              {report.extractedJD?.companyName ? ` for ${report.extractedJD.companyName}` : ''}
            </p>
          </div>

          <div className="space-y-8">
            {/* Score Card */}
            <ScoreCard
              score={report.readinessScore!}
              riskBand={report.riskBand!}
              totalRisks={report.totalRisks}
            />

            {/* Two Column Layout for larger screens */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Top 3 Risks */}
              {report.top3Risks && report.top3Risks.length > 0 && (
                <div className="lg:col-span-2">
                  <RiskList
                    risks={report.top3Risks}
                    title={
                      report.extractedJD?.companyName
                        ? `Top 3 ${report.extractedJD.companyName} Rejection Risks`
                        : 'Top 3 Rejection Risks'
                    }
                    showEvidence={false}
                  />
                </div>
              )}
            </div>

            {/* Paywall */}
            {!report.paidUnlocked && report.totalRisks && (
              <>
                <div className="flex justify-center">
                  <InsightOwlCelebrating size={72} />
                </div>
                <PaywallCTA reportId={reportId} totalRisks={report.totalRisks - 3} />
              </>

            )}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
