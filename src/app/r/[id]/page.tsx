'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { api, APIRequestError, GetReportResponse } from '@/lib/api';
import { CREDITS_PER_REPORT } from '@/lib/stripe-config';
import { fireConfetti } from '@/components/ui/confetti';
import { toast } from 'sonner';

import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LoadingOverlay } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ScoreCard } from '@/components/results/ScoreCard';
import { RiskList } from '@/components/results/RiskList';
import { PaywallCTA } from '@/components/results/PaywallCTA';
import { PremiumSectionsPreview } from '@/components/results/PremiumSectionsPreview';
import { StickyUnlockBar } from '@/components/results/StickyUnlockBar';
import { InsightOwlReading } from '@/components/svg/InsightOwlMascot';

import { CompetencyHeatmap } from '@/components/diagnostic/CompetencyHeatmap';

type ReportData = GetReportResponse['data'];

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { balance, openPurchaseModal, refreshBalance } = useCredits();

  const reportId = params.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  const paywallRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver: show sticky bar when primary PaywallCTA exits viewport
  useEffect(() => {
    const el = paywallRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [report]);

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

  const handleUnlockClick = useCallback(async () => {
    const hasEnoughCredits = balance >= CREDITS_PER_REPORT;

    if (!hasEnoughCredits) {
      openPurchaseModal();
      return;
    }

    try {
      const result = await api.unlockReport(reportId);
      if (result.data.unlocked || result.data.alreadyUnlocked) {
        refreshBalance();
        fireConfetti();
        toast.success('Report unlocked! Redirecting...');
        router.push(`/r/${reportId}/full`);
      }
    } catch (err) {
      if (err instanceof APIRequestError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to unlock. Please try again.');
      }
    }
  }, [balance, openPurchaseModal, reportId, refreshBalance, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <InsightOwlReading size={48} />
            <LoadingOverlay message="Loading your results..." />
          </div>
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
            <div className="rounded-xl bg-[var(--color-danger-muted)] p-8 text-center">
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
            <div className="rounded-xl bg-[var(--bg-card)] p-8 text-center">
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

  const isPaid = report.paidUnlocked;
  const totalRisks = report.totalRisks ?? 0;
  const remainingRisks = Math.max(totalRisks - 3, 0);

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
              {report.extractedJD?.jobTitle ? ` — ${report.extractedJD.jobTitle}` : ''}
            </p>
          </div>

          <div className="space-y-8">
            {/* Score Card — free */}
            <ScoreCard
              score={report.readinessScore!}
              riskBand={report.riskBand!}
              totalRisks={report.totalRisks}
            />

            {/* Top 3 Risks — free */}
            <div className="grid gap-8 lg:grid-cols-2">
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

            {/* Competency Heatmap Preview — free */}
            {report.diagnosticIntelligence?.competencyHeatmap && (
              <CompetencyHeatmap
                heatmap={report.diagnosticIntelligence.competencyHeatmap}
                companyName={report.extractedJD?.companyName}
                previewMode
                reportId={reportId}
              />
            )}

            {/* Primary Paywall CTA */}
            {!isPaid && (
              <>
                <PaywallCTA
                  ref={paywallRef}
                  reportId={reportId}
                  totalRisks={remainingRisks}
                />

                {/* Blurred premium sections preview */}
                <PremiumSectionsPreview
                  reportId={reportId}
                  companyName={report.extractedJD?.companyName}
                  totalRisks={totalRisks}
                  onUnlockClick={handleUnlockClick}
                />

                {/* Bottom closing CTA */}
                <PaywallCTA
                  reportId={reportId}
                  totalRisks={remainingRisks}
                  variant="bottom"
                />

                {/* Sticky unlock bar */}
                <StickyUnlockBar visible={stickyVisible} reportId={reportId} />
              </>
            )}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
