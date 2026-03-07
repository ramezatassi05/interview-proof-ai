'use client';

import { Button } from '@/components/ui/Button';

interface ReportToolbarProps {
  companyName?: string;
  jobTitle?: string;
  roundType: string;
  reportId: string;
  canRerun: boolean;
  rerunning: boolean;
  onShare: () => void;
  onRerun: () => void;
  isSticky?: boolean;
}

export function ReportToolbar({
  companyName,
  jobTitle,
  roundType,
  reportId,
  canRerun,
  rerunning,
  onShare,
  onRerun,
  isSticky = false,
}: ReportToolbarProps) {
  const roundLabel = roundType.charAt(0).toUpperCase() + roundType.slice(1);

  return (
    <div
      className={`
        flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between
        rounded-xl border border-[var(--border-default)] px-4 py-3 sm:px-5
        transition-all duration-200
        ${
          isSticky
            ? 'glass shadow-lg'
            : 'bg-[var(--bg-card)]'
        }
      `}
    >
      {/* Report context */}
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        {companyName && (
          <>
            <span className="font-semibold text-[var(--text-primary)]">{companyName}</span>
            <span className="text-[var(--text-muted)]">&middot;</span>
          </>
        )}
        {jobTitle && (
          <>
            <span className="text-[var(--text-secondary)]">{jobTitle}</span>
            <span className="text-[var(--text-muted)]">&middot;</span>
          </>
        )}
        <span className="text-[var(--text-muted)]">{roundLabel} Round</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onShare}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-accent)]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share
        </button>
        <a
          href={`/api/report/${reportId}/pdf`}
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-accent)]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          PDF
        </a>
        {canRerun && (
          <Button variant="secondary" size="sm" onClick={onRerun} disabled={rerunning}>
            {rerunning ? 'Rerunning...' : 'Rerun'}
          </Button>
        )}
      </div>
    </div>
  );
}
