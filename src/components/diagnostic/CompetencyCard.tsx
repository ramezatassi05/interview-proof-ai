'use client';

import type { CompetencyHeatmapEntry } from '@/types';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface CompetencyCardProps {
  entry: CompetencyHeatmapEntry;
}

function getGapBorderClass(gapStatus: string): string {
  switch (gapStatus) {
    case 'Critical':
      return 'border-l-[var(--color-danger)]';
    case 'Warning':
      return 'border-l-[var(--color-warning)]';
    case 'Pass':
      return 'border-l-[var(--color-success)]';
    default:
      return 'border-l-[var(--border-default)]';
  }
}

function getGapIcon(gapPoints: number): string {
  if (gapPoints > 15) return '\u25BC\u25BC'; // double down arrow
  if (gapPoints > 0) return '\u25BC'; // down arrow
  if (gapPoints === 0) return '\u2501'; // horizontal line
  return '\u25B2'; // up arrow (above target)
}

function getGapColor(gapPoints: number): string {
  if (gapPoints > 15) return 'text-[var(--color-danger)]';
  if (gapPoints > 0) return 'text-[var(--color-warning)]';
  return 'text-[var(--color-success)]';
}

export function CompetencyCard({ entry }: CompetencyCardProps) {
  return (
    <div
      className={`
        rounded-xl border border-[var(--border-default)] border-l-3 bg-[var(--bg-elevated)] p-4
        ${getGapBorderClass(entry.gapStatus)}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{entry.domain}</h4>
        <span
          className={`text-xs font-mono font-medium ${getGapColor(entry.gapPoints)}`}
        >
          Gap: {entry.gapPoints > 0 ? `-${entry.gapPoints}` : entry.gapPoints === 0 ? '0' : `+${Math.abs(entry.gapPoints)}`} {getGapIcon(entry.gapPoints)}
        </span>
      </div>

      {/* Your level */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--text-muted)]">Your Level</span>
            <span className="font-medium text-[var(--text-secondary)]">
              {entry.yourLevel} ({entry.rawScore})
            </span>
          </div>
          <ProgressBar value={entry.rawScore} max={100} size="sm" showValue={false} />
        </div>

        {/* Target */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--text-muted)]">Target</span>
            <span className="font-medium text-[var(--text-secondary)]">
              {entry.targetBenchmark} ({entry.targetScore})
            </span>
          </div>
          <ProgressBar value={entry.targetScore} max={100} size="sm" variant="accent" showValue={false} />
        </div>
      </div>
    </div>
  );
}
