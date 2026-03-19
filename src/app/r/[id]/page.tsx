'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, APIRequestError } from '@/lib/api';

import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LoadingOverlay } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { InsightOwlReading } from '@/components/svg/InsightOwlMascot';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const reportId = params.id as string;

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

        // Always redirect to full diagnostic once analyzed
        if (result.data.analyzed) {
          router.push(`/r/${reportId}/full`);
        } else {
          setLoading(false);
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

  // Not yet analyzed
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
