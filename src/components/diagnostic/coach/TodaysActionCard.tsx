'use client';

import type { AgentAction, PracticeProgress, CognitiveRiskMap } from '@/types';

const DIMENSION_LABELS: Record<string, string> = {
  analyticalReasoning: 'Analytical Reasoning',
  communicationClarity: 'Communication Clarity',
  technicalDepth: 'Technical Depth',
  adaptability: 'Adaptability',
  problemStructuring: 'Problem Structuring',
};

interface TodaysActionCardProps {
  pendingActions: AgentAction[];
  practiceProgress: PracticeProgress;
  cognitiveRiskMap?: CognitiveRiskMap;
  onJumpToPractice?: () => void;
}

export function TodaysActionCard({
  pendingActions,
  practiceProgress,
  cognitiveRiskMap,
  onJumpToPractice,
}: TodaysActionCardProps) {
  const pendingCount = pendingActions.length;

  let title: string;
  let body: string;
  let cta: { label: string; onClick?: () => void } | null = null;
  let tone: 'accent' | 'warning' | 'neutral' = 'accent';

  if (pendingCount > 0) {
    tone = 'warning';
    title = `${pendingCount} pending decision${pendingCount === 1 ? '' : 's'} awaiting you`;
    body =
      'Your agents have drafted recommendations that need your review before anything moves forward.';
    cta = { label: 'Review below' };
  } else if (practiceProgress.answersAttempted === 0) {
    tone = 'accent';
    title = 'Run your first practice session';
    body =
      'Start a practice drill so your coach learns where you actually stand. The first few answers unlock recommendations tailored to you.';
    cta = onJumpToPractice ? { label: 'Open Practice', onClick: onJumpToPractice } : null;
  } else if (practiceProgress.weakestRiskIds.length > 0 || cognitiveRiskMap?.lowestDimension) {
    tone = 'accent';
    const weakDim = cognitiveRiskMap?.lowestDimension;
    const weakLabel = weakDim ? (DIMENSION_LABELS[weakDim] ?? weakDim) : 'your weakest area';
    title = `Drill ${weakLabel}`;
    body =
      practiceProgress.scoreTrend === 'improving'
        ? `You're trending up. Keep the momentum on ${weakLabel.toLowerCase()} — your latest attempts there scored lowest.`
        : `Your latest attempts on ${weakLabel.toLowerCase()} scored lowest. A focused drill here will move the needle most.`;
    cta = onJumpToPractice ? { label: 'Open Practice', onClick: onJumpToPractice } : null;
  } else {
    tone = 'neutral';
    title = 'You’re in good shape — keep practicing';
    body = `${practiceProgress.answersAttempted} answer${
      practiceProgress.answersAttempted === 1 ? '' : 's'
    } attempted so far. Run another round to surface fresh recommendations.`;
    cta = onJumpToPractice ? { label: 'Open Practice', onClick: onJumpToPractice } : null;
  }

  const accentBorder =
    tone === 'warning'
      ? 'border-[var(--color-warning)]/40'
      : tone === 'accent'
        ? 'border-[var(--accent-primary)]/40'
        : 'border-[var(--border-default)]';

  const accentBg =
    tone === 'warning'
      ? 'bg-[var(--color-warning-muted)]'
      : tone === 'accent'
        ? 'bg-[var(--bg-elevated)]'
        : 'bg-[var(--bg-card)]';

  return (
    <div className={`${accentBg} ${accentBorder} border rounded-xl overflow-hidden`}>
      <div className="px-6 pt-4 pb-2 border-b border-[var(--border-default)]">
        <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">Today</p>
        <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{body}</p>
        {cta && (
          <button
            type="button"
            onClick={cta.onClick}
            disabled={!cta.onClick}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-60"
          >
            {cta.label}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
