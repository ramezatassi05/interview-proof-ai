'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { LiveMockInterview } from '@/components/interview/LiveMockInterview';
import { useAuth } from '@/hooks/useAuth';
import { api, APIRequestError } from '@/lib/api';

function LiveInterviewPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [reportId, setReportId] = useState<string | null>(null);
  const [resolving, setResolving] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login?redirect=/interview/live');
      return;
    }

    let cancelled = false;
    (async () => {
      const fromQuery = searchParams?.get('reportId');
      if (fromQuery) {
        if (!cancelled) {
          setReportId(fromQuery);
          setResolving(false);
        }
        return;
      }
      try {
        const res = await api.getLatestReport();
        if (cancelled) return;
        if (res.data?.reportId) {
          setReportId(res.data.reportId);
        } else {
          setError('Run a diagnostic first — the live interview needs a report to ground in.');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof APIRequestError ? err.message : 'Could not load your report');
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, searchParams, router]);

  return (
    <AppLayout showIntelligencePanel={false}>
      <header className="mb-6">
        <h1 className="heading-modern text-2xl font-bold text-[var(--text-primary)]">
          Live mock interview
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Speak your answers. Your interviewer reads questions aloud and scores each turn against
          your diagnostic.
        </p>
      </header>

      {(authLoading || resolving) && (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      )}

      {error && (
        <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-4 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {reportId && <LiveMockInterview reportId={reportId} />}
    </AppLayout>
  );
}

export default function LiveInterviewPage() {
  return (
    <Suspense
      fallback={
        <AppLayout showIntelligencePanel={false}>
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        </AppLayout>
      }
    >
      <LiveInterviewPageInner />
    </Suspense>
  );
}
