'use client';

import { useEffect, useState } from 'react';
import { BlurFade } from '@/components/ui/blur-fade';
import { Spinner } from '@/components/ui/Spinner';
import type { ProfileSummary } from '@/types';

interface StepProfileSummaryProps {
  summary: ProfileSummary | null;
  onSummaryGenerated: (summary: ProfileSummary) => void;
}

export function StepProfileSummary({ summary, onSummaryGenerated }: StepProfileSummaryProps) {
  const [loading, setLoading] = useState(!summary);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProfileSummary | null>(summary);

  useEffect(() => {
    if (data) return;

    async function generateSummary() {
      try {
        const res = await fetch('/api/profile/summary', { method: 'POST' });
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Failed to generate summary');
          return;
        }

        setData(json.data);
        onSummaryGenerated(json.data);
      } catch {
        setError('Failed to generate summary. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    generateSummary();
  }, [data, onSummaryGenerated]);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-12">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">Generating your profile summary...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center py-12">
        <p className="text-sm text-[var(--color-danger)]">{error || 'Something went wrong.'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <BlurFade delay={0}>
        <h1 className="mb-2 text-center font-serif text-3xl font-bold text-[var(--text-primary)]">
          Your Personal Summary
        </h1>
      </BlurFade>

      <BlurFade delay={0.1}>
        <p className="mb-8 text-center text-[var(--text-secondary)]">
          Based on your profile, here&apos;s your potential with InterviewProof.
        </p>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="grid w-full max-w-lg gap-4">
          {/* Readiness + Potential cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Current Readiness
              </p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {data.readinessEstimate}%
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--track-bg)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-1000 ease-out"
                  style={{ width: `${data.readinessEstimate}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-success)]">
                Projected Potential
              </p>
              <p className="text-3xl font-bold text-[var(--color-success)]">
                {data.projectedPotential}%
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                With focused prep using InterviewProof
              </p>
            </div>
          </div>

          {/* Summary text */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{data.summaryText}</p>
          </div>

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-success)]">
                Your Strengths
              </p>
              <ul className="space-y-2">
                {data.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                Recommended Focus Areas
              </p>
              <ul className="space-y-2">
                {data.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </BlurFade>
    </div>
  );
}
