'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { BlurFade } from '@/components/ui/blur-fade';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';
import { OpportunityDetail } from '@/components/opportunities/OpportunityDetail';
import { OpportunityForm } from '@/components/opportunities/OpportunityForm';
import { OPPORTUNITY_STAGE_LABELS } from '@/lib/opportunities';
import type { Opportunity, OpportunityStage } from '@/types';

const VISIBLE_STAGES: readonly OpportunityStage[] = [
  'applied',
  'recruiter_screen',
  'phone_screen',
  'onsite',
  'offer',
  'rejected',
  'withdrawn',
];

export default function OpportunitiesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpp, setDetailOpp] = useState<Opportunity | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login?redirect=/opportunities');
      return;
    }
  }, [user, authLoading, router]);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (!showArchived) params.set('archived', 'false');
      const res = await fetch(`/api/opportunities?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to load (${res.status})`);
      }
      const json = await res.json();
      setOpportunities(json.data as Opportunity[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    if (!user) return;
    fetchOpportunities();
  }, [user, fetchOpportunities]);

  const grouped = useMemo(() => {
    const map: Record<OpportunityStage, Opportunity[]> = {
      applied: [],
      recruiter_screen: [],
      phone_screen: [],
      onsite: [],
      offer: [],
      rejected: [],
      withdrawn: [],
    };
    for (const opp of opportunities) {
      map[opp.stage]?.push(opp);
    }
    return map;
  }, [opportunities]);

  const handleCreated = (opp: Opportunity) => {
    setOpportunities((prev) => [opp, ...prev]);
    setCreateOpen(false);
  };

  const handleUpdated = (opp: Opportunity) => {
    setOpportunities((prev) => prev.map((p) => (p.id === opp.id ? opp : p)));
    setDetailOpp(opp);
  };

  const handleArchived = (id: string) => {
    if (showArchived) {
      // refresh in place
      setOpportunities((prev) => prev.map((p) => (p.id === id ? { ...p, archived: true } : p)));
    } else {
      setOpportunities((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (authLoading || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-sm text-[var(--text-muted)]">
          Loading…
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <BlurFade delay={0.05}>
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
          <div className="px-6 pt-4 pb-3 border-b border-[var(--border-default)] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">Opportunities</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Track every role you&apos;re pursuing — from first application to offer.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="accent-[var(--accent-primary)]"
                />
                Show archived
              </label>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="rounded-md border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
              >
                + New
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading && (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">Loading…</div>
            )}
            {error && (
              <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-4 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            )}
            {!loading && !error && opportunities.length === 0 && (
              <div className="rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] p-8 text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  No opportunities yet
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Add a role you&apos;re interviewing for to start tracking your pipeline.
                </p>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mt-4 rounded-md border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                >
                  Add first opportunity
                </button>
              </div>
            )}
            {!loading && !error && opportunities.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {VISIBLE_STAGES.map((stage) => {
                  const items = grouped[stage];
                  return (
                    <div
                      key={stage}
                      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                          {OPPORTUNITY_STAGE_LABELS[stage]}
                        </p>
                        <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-1.5 py-px text-[10px] font-mono text-[var(--text-muted)]">
                          {items.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {items.length === 0 ? (
                          <p className="text-[11px] text-[var(--text-muted)]">No items</p>
                        ) : (
                          items.map((opp) => (
                            <OpportunityCard
                              key={opp.id}
                              opportunity={opp}
                              onClick={() => setDetailOpp(opp)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </BlurFade>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New opportunity</DialogTitle>
            <DialogDescription>
              Start tracking a role. You can update the stage as things move.
            </DialogDescription>
          </DialogHeader>
          <OpportunityForm onSaved={handleCreated} onCancel={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <OpportunityDetail
        open={detailOpp !== null}
        opportunity={detailOpp}
        onClose={() => setDetailOpp(null)}
        onUpdated={handleUpdated}
        onArchived={handleArchived}
      />
    </AppLayout>
  );
}
