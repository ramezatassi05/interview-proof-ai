'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingOverlay } from '@/components/ui/Spinner';
import type { RoundType } from '@/types';

interface ReportSummary {
  id: string;
  roundType: RoundType;
  createdAt: string;
  paidUnlocked: boolean;
  companyName: string | null;
  top3StudyPlan: { task: string; timeEstimateMinutes: number }[];
}

interface AccountData {
  reports: ReportSummary[];
}

export default function StudyIntelligencePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login?redirect=/study-intelligence');
      return;
    }

    const fetchAccount = async () => {
      try {
        const res = await fetch('/api/account');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/login?redirect=/study-intelligence');
            return;
          }
          return;
        }
        const result = await res.json();
        setData(result.data);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <AppLayout showIntelligencePanel={false}>
        <div className="flex items-center justify-center py-24">
          <LoadingOverlay message="Loading study plan..." />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout showIntelligencePanel={false}>
        <div className="rounded-lg border border-[var(--color-danger)] border-opacity-30 bg-[var(--color-danger-muted)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--color-danger)]">Error</h2>
          <p className="mt-2 text-[var(--color-danger)]">Failed to load study data</p>
        </div>
      </AppLayout>
    );
  }

  const reportsWithStudy = data.reports.filter((r) => r.top3StudyPlan.length > 0);

  // Consolidated topics across all reports
  const topicMap = new Map<string, { count: number; totalMinutes: number }>();
  for (const report of reportsWithStudy) {
    for (const item of report.top3StudyPlan) {
      const existing = topicMap.get(item.task);
      if (existing) {
        existing.count += 1;
        existing.totalMinutes += item.timeEstimateMinutes;
      } else {
        topicMap.set(item.task, { count: 1, totalMinutes: item.timeEstimateMinutes });
      }
    }
  }
  const consolidatedTopics = Array.from(topicMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <AppLayout showIntelligencePanel={false}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Study Intelligence</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Personalized study topics derived from your interview analyses.
        </p>
      </div>

      {/* Consolidated Topics */}
      {consolidatedTopics.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Study Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consolidatedTopics.map(([topic, info]) => (
                <div
                  key={topic}
                  className="flex items-center justify-between rounded-lg bg-[var(--bg-elevated)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{topic}</span>
                    {info.count > 1 && (
                      <Badge variant="default">{info.count} reports</Badge>
                    )}
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">
                    ~{formatTime(Math.round(info.totalMinutes / info.count))} avg
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Report Study Cards */}
      {reportsWithStudy.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[var(--text-secondary)]">
              No study plans yet. Unlock a full diagnostic to get personalized study recommendations.
            </p>
            <Link href="/new">
              <Button className="mt-4">Start Analysis</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">By Report</h2>
          <div className="space-y-4">
            {reportsWithStudy.map((report) => (
              <Link
                key={report.id}
                href={`/r/${report.id}/full#study`}
              >
                <Card className="transition-colors hover:border-[var(--border-accent)]">
                  <CardContent className="py-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-medium text-[var(--text-primary)]">
                        {report.companyName || 'Unknown Company'}
                      </p>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {report.top3StudyPlan.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-[var(--text-secondary)]">{item.task}</span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {formatTime(item.timeEstimateMinutes)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
