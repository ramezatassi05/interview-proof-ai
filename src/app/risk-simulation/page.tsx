'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';
import { LoadingOverlay } from '@/components/ui/Spinner';
import type { RiskBand, RoundType } from '@/types';

interface ReportSummary {
  id: string;
  roundType: RoundType;
  createdAt: string;
  paidUnlocked: boolean;
  readinessScore: number | null;
  riskBand: RiskBand | null;
  companyName: string | null;
  top3Risks: { title: string; severity: string }[];
}

interface AccountData {
  reports: ReportSummary[];
}

export default function RiskSimulationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login?redirect=/risk-simulation');
      return;
    }

    const fetchAccount = async () => {
      try {
        const res = await fetch('/api/account');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/login?redirect=/risk-simulation');
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
          <LoadingOverlay message="Loading risks..." />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout showIntelligencePanel={false}>
        <div className="rounded-lg border border-[var(--color-danger)] border-opacity-30 bg-[var(--color-danger-muted)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--color-danger)]">Error</h2>
          <p className="mt-2 text-[var(--color-danger)]">Failed to load risk data</p>
        </div>
      </AppLayout>
    );
  }

  const reportsWithRisks = data.reports.filter((r) => r.top3Risks.length > 0);

  // Band distribution
  const bandCounts = data.reports.reduce(
    (acc, r) => {
      if (r.riskBand) acc[r.riskBand] = (acc[r.riskBand] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <AppLayout showIntelligencePanel={false}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Risk Simulation</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Top interview risks identified across all your reports.
        </p>
      </div>

      {/* Band Distribution */}
      {Object.keys(bandCounts).length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Risk Band Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {(['Low', 'Medium', 'High'] as RiskBand[]).map((band) => (
                <div key={band} className="flex items-center gap-2">
                  <Badge variant={riskBandToVariant(band)}>{band}</Badge>
                  <span className="text-lg font-bold text-[var(--text-primary)]">
                    {bandCounts[band] || 0}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    report{(bandCounts[band] || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Risk Cards */}
      {reportsWithRisks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[var(--text-secondary)]">
              No risk data yet. Upload your resume and job description to identify risks.
            </p>
            <Link href="/new">
              <Button className="mt-4">Start Analysis</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reportsWithRisks.map((report) => (
            <Link
              key={report.id}
              href={`/r/${report.id}/full#risks`}
            >
              <Card className="transition-colors hover:border-[var(--border-accent)]">
                <CardContent className="py-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-[var(--text-primary)]">
                        {report.companyName || 'Unknown Company'}
                      </p>
                      {report.riskBand && (
                        <Badge variant={riskBandToVariant(report.riskBand)}>
                          {report.riskBand}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {report.top3Risks.map((risk, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            risk.severity === 'high'
                              ? 'bg-[var(--color-danger)]'
                              : risk.severity === 'medium'
                                ? 'bg-[var(--color-warning)]'
                                : 'bg-[var(--color-success)]'
                          }`}
                        />
                        <span className="text-sm text-[var(--text-secondary)]">{risk.title}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
