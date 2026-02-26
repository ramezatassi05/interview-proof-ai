interface SharePreviewCardProps {
  readinessScore?: number;
  riskBand?: string;
  companyName?: string;
  jobTitle?: string;
  roundType?: string;
}

export function SharePreviewCard({
  readinessScore = 0,
  riskBand = 'Medium',
  companyName,
  jobTitle,
  roundType,
}: SharePreviewCardProps) {
  const scoreColor = readinessScore >= 70 ? 'var(--color-success)' : readinessScore >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div className="w-full max-w-lg rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="font-mono text-xs font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded">IP</span>
            <span className="ml-2 text-xs text-[var(--text-muted)]">InterviewProof</span>
          </div>
          {riskBand && (
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
              {riskBand} Risk
            </span>
          )}
        </div>

        {(companyName || jobTitle) && (
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {companyName}{companyName && jobTitle && ' — '}{jobTitle}
            {roundType && ` · ${roundType}`}
          </p>
        )}

        <div className="flex items-center gap-8">
          <div>
            <span className="font-mono text-5xl font-bold tabular-nums" style={{ color: scoreColor }}>
              {readinessScore}
            </span>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-1">Readiness Score</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-default)] px-6 py-3 bg-[var(--bg-secondary)]">
        <p className="font-mono text-[10px] text-[var(--text-muted)]">
          Analyzed by InterviewProof
        </p>
      </div>
    </div>
  );
}
