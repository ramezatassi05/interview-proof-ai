'use client';

import type { CompetencyHeatmapData, GapStatus, CompetencyLevel } from '@/types';
import Link from 'next/link';

interface CompetencyHeatmapProps {
  heatmap: CompetencyHeatmapData;
  companyName?: string;
  previewMode?: boolean;
  reportId?: string;
}

function getGapBadge(status: GapStatus) {
  switch (status) {
    case 'Critical':
      return {
        label: 'Critical Gap',
        className: 'bg-[var(--color-danger-muted)] text-[var(--color-danger)] border border-[var(--color-danger)]/30',
      };
    case 'Warning':
      return {
        label: 'Warning',
        className: 'bg-[var(--color-warning-muted)] text-[var(--color-warning)] border border-[var(--color-warning)]/30',
      };
    case 'Pass':
      return {
        label: 'On Track',
        className: 'bg-[var(--color-success-muted)] text-[var(--color-success)] border border-[var(--color-success)]/30',
      };
  }
}

function getLevelColor(level: CompetencyLevel) {
  switch (level) {
    case 'Expert':
      return 'text-[var(--color-success)]';
    case 'High':
      return 'text-[var(--color-info)]';
    case 'Intermediate':
      return 'text-[var(--color-warning)]';
    case 'Beginner':
      return 'text-[var(--color-danger)]';
  }
}

function ScoreBar({ score, targetScore }: { score: number; targetScore: number }) {
  return (
    <div className="relative h-2 w-full rounded-full bg-[var(--bg-primary)]">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, score)}%`,
          background: score >= targetScore
            ? 'var(--color-success)'
            : score >= targetScore - 8
              ? 'var(--color-warning)'
              : 'var(--color-danger)',
        }}
      />
      <div
        className="absolute top-[-3px] h-[14px] w-[2px] bg-[var(--text-secondary)] opacity-60"
        style={{ left: `${Math.min(100, targetScore)}%` }}
        title={`Target: ${targetScore}`}
      />
    </div>
  );
}

export function CompetencyHeatmap({ heatmap, companyName, previewMode, reportId }: CompetencyHeatmapProps) {
  const displayEntries = previewMode ? heatmap.entries.slice(0, 3) : heatmap.entries;
  const hiddenCount = heatmap.entries.length - 3;

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Competency Heatmap
            <span className="ml-2 text-sm font-normal text-[var(--text-secondary)]">
              ({heatmap.seniorityLabel})
            </span>
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            How your competency levels compare to {companyName ? `${companyName}'s` : 'the'} target bar
          </p>
        </div>
        <div className="flex gap-2">
          {heatmap.criticalGaps > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-[var(--color-danger-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-danger)] border border-[var(--color-danger)]/30">
              {heatmap.criticalGaps} Critical
            </span>
          )}
          {heatmap.warningGaps > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-[var(--color-warning-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-warning)] border border-[var(--color-warning)]/30">
              {heatmap.warningGaps} Warning
            </span>
          )}
          {heatmap.passCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-[var(--color-success-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-success)] border border-[var(--color-success)]/30">
              {heatmap.passCount} On Track
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="pb-3 pr-4 text-left font-medium text-[var(--text-secondary)]">Domain</th>
              <th className="pb-3 px-4 text-left font-medium text-[var(--text-secondary)]">Your Level</th>
              <th className="pb-3 px-4 text-left font-medium text-[var(--text-secondary)]">Target</th>
              <th className="pb-3 pl-4 text-left font-medium text-[var(--text-secondary)]">Gap Status</th>
            </tr>
          </thead>
          <tbody>
            {displayEntries.map((entry, i) => {
              const badge = getGapBadge(entry.gapStatus);
              return (
                <tr
                  key={entry.domain}
                  className={`border-b border-[var(--border-default)]/50 ${
                    i % 2 === 0 ? 'bg-[var(--bg-elevated)]' : ''
                  }`}
                >
                  <td className="py-3 pr-4">
                    <div className="font-medium text-[var(--text-primary)]">{entry.domain}</div>
                    <div className="mt-1.5 max-w-[180px]">
                      <ScoreBar score={entry.rawScore} targetScore={entry.targetScore} />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${getLevelColor(entry.yourLevel)}`}>
                      {entry.yourLevel}
                    </span>
                    <span className="ml-1.5 text-xs text-[var(--text-secondary)]">
                      ({entry.rawScore})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[var(--text-primary)]">{entry.targetBenchmark}</span>
                    <span className="ml-1.5 text-xs text-[var(--text-secondary)]">
                      ({entry.targetScore})
                    </span>
                  </td>
                  <td className="py-3 pl-4">
                    <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* Upsell row in preview mode */}
            {previewMode && hiddenCount > 0 && (
              <tr className="bg-[var(--bg-elevated)]">
                <td colSpan={4} className="py-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <svg className="h-4 w-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Unlock {hiddenCount} additional domains with Full Diagnostic
                    </div>
                    {reportId && (
                      <Link
                        href={`/r/${reportId}/full`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
                      >
                        View Full Report
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
