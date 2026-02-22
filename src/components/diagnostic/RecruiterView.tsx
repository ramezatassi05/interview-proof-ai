'use client';

import type { ReactNode } from 'react';
import type { RecruiterSimulation, FirstImpression } from '@/types';

interface RecruiterViewProps {
  simulation: RecruiterSimulation;
  companyName?: string;
}

function getImpressionConfig(impression: FirstImpression): {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: ReactNode;
} {
  switch (impression) {
    case 'proceed':
      return {
        label: 'Likely to Proceed',
        color: 'text-[var(--color-success)]',
        bg: 'bg-[var(--color-success-muted)]',
        border: 'border-[var(--color-success)]/30',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      };
    case 'maybe':
      return {
        label: 'On the Fence',
        color: 'text-[var(--color-warning)]',
        bg: 'bg-[var(--color-warning-muted)]',
        border: 'border-[var(--color-warning)]/30',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      };
    case 'reject':
      return {
        label: 'Risk of Rejection',
        color: 'text-[var(--color-danger)]',
        bg: 'bg-[var(--color-danger-muted)]',
        border: 'border-[var(--color-danger)]/30',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      };
  }
}

function formatScreenTime(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${minutes}m ${remainingSeconds}s`;
}

function getScreenTimeLabel(seconds: number): { label: string; color: string } {
  if (seconds < 30) return { label: 'Very Quick Scan', color: 'text-[var(--color-danger)]' };
  if (seconds < 45) return { label: 'Standard Review', color: 'text-[var(--color-warning)]' };
  if (seconds < 90) return { label: 'Engaged Review', color: 'text-[var(--color-success)]' };
  return { label: 'Deep Review', color: 'text-[var(--color-info)]' };
}

export function RecruiterView({ simulation, companyName }: RecruiterViewProps) {
  const impressionConfig = getImpressionConfig(simulation.firstImpression);
  const screenTimeInfo = getScreenTimeLabel(simulation.estimatedScreenTimeSeconds);

  return (
    <div className="card-warm shadow-warm rounded-[20px] overflow-hidden">
      {/* Warm gradient header */}
      <div className="bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-secondary)]/5 px-6 pt-4 pb-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] section-header-warm">
          {companyName ? `${companyName} Recruiter First Impression` : 'Recruiter First Impression'}
        </h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Simulated recruiter perspective on initial resume scan
        </p>
      </div>

      <div className="p-6">

      {/* First Impression Badge */}
      <div
        className={`rounded-lg border ${impressionConfig.border} ${impressionConfig.bg} p-4 mb-6`}
      >
        <div className="flex items-center gap-3">
          <span className={impressionConfig.color}>{impressionConfig.icon}</span>
          <div>
            <span className={`text-lg font-semibold ${impressionConfig.color}`}>
              {impressionConfig.label}
            </span>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{simulation.recruiterNotes}</p>
          </div>
        </div>
      </div>

      {/* Screen Time */}
      <div className="rounded-[16px] bg-[var(--bg-elevated)] p-4 mb-6" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-[var(--text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-[var(--text-secondary)]">Estimated Screen Time</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-[var(--accent-primary)]">
              {formatScreenTime(simulation.estimatedScreenTimeSeconds)}
            </span>
            <span className={`block text-xs ${screenTimeInfo.color}`}>{screenTimeInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Two columns: Red Flags and Hidden Strengths */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Red Flags */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-danger)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Immediate Red Flags
          </h4>
          {simulation.immediateRedFlags.length > 0 ? (
            <ul className="space-y-2">
              {simulation.immediateRedFlags.map((flag, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 rounded-[16px] border border-[var(--color-danger)]/20 bg-[var(--color-danger-muted)] p-3 text-sm card-warm-hover"
                >
                  <span className="text-[var(--color-danger)] mt-0.5">-</span>
                  <span className="text-[var(--text-secondary)]">{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">
              No immediate red flags identified
            </p>
          )}
        </div>

        {/* Hidden Strengths */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-success)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            Hidden Strengths
          </h4>
          {simulation.hiddenStrengths.length > 0 ? (
            <ul className="space-y-2">
              {simulation.hiddenStrengths.map((strength, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 rounded-[16px] border border-[var(--color-success)]/20 bg-[var(--color-success-muted)] p-3 text-sm card-warm-hover"
                >
                  <span className="text-[var(--color-success)] mt-0.5">+</span>
                  <span className="text-[var(--text-secondary)]">{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">
              No hidden strengths identified
            </p>
          )}
        </div>
      </div>

      {/* Version tag */}
      <div className="mt-6 pt-4 border-t border-[var(--border-default)]">
        <span className="text-xs text-[var(--text-muted)]">
          Simulation version {simulation.version}
        </span>
      </div>
      </div>
    </div>
  );
}
