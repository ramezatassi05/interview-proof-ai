'use client';

import type {
  AgentAction,
  AgentSession,
  CognitiveRiskMap,
  PracticeProgress,
  PrepPlan,
} from '@/types';
import { BlurFade } from '@/components/ui/blur-fade';
import { TodaysActionCard } from '@/components/diagnostic/coach/TodaysActionCard';
import { WeakestAreasPanel } from '@/components/diagnostic/coach/WeakestAreasPanel';
import { ActivePrepPlanPanel } from '@/components/diagnostic/coach/ActivePrepPlanPanel';
import { PracticeTrendPanel } from '@/components/diagnostic/coach/PracticeTrendPanel';
import { PendingApprovalsList } from '@/components/diagnostic/coach/PendingApprovalsList';
import { CoachChatStub } from '@/components/diagnostic/coach/CoachChatStub';

interface CoachTabProps {
  reportId: string;
  loading: boolean;
  error: string | null;
  pendingActions: AgentAction[];
  practiceProgress: PracticeProgress | null;
  latestSession: AgentSession | null;
  cognitiveRiskMap?: CognitiveRiskMap;
  prepPlan: PrepPlan | null;
  onJumpToPractice?: () => void;
  onRetry?: () => void;
}

const ZERO_PROGRESS: PracticeProgress = {
  answersAttempted: 0,
  avgScore: null,
  scoreTrend: 'flat',
  weakestRiskIds: [],
  lastPracticedAt: null,
};

export function CoachTab({
  reportId,
  loading,
  error,
  pendingActions,
  practiceProgress,
  latestSession,
  cognitiveRiskMap,
  prepPlan,
  onJumpToPractice,
  onRetry,
}: CoachTabProps) {
  if (loading) {
    return <CoachSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-6">
        <p className="text-sm font-medium text-[var(--color-danger)]">
          Couldn&apos;t load coach data: {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-md border border-[var(--color-danger)]/30 bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)]"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const progress = practiceProgress ?? ZERO_PROGRESS;

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <TodaysActionCard
          pendingActions={pendingActions}
          practiceProgress={progress}
          cognitiveRiskMap={cognitiveRiskMap}
          onJumpToPractice={onJumpToPractice}
        />
      </BlurFade>

      <BlurFade delay={0.1}>
        <WeakestAreasPanel cognitiveRiskMap={cognitiveRiskMap} />
      </BlurFade>

      <BlurFade delay={0.15}>
        <ActivePrepPlanPanel prepPlan={prepPlan} />
      </BlurFade>

      <BlurFade delay={0.2}>
        <PracticeTrendPanel practiceProgress={progress} />
      </BlurFade>

      <BlurFade delay={0.25}>
        <PendingApprovalsList pendingActions={pendingActions} />
      </BlurFade>

      <BlurFade delay={0.3}>
        <CoachChatStub reportId={reportId} latestSession={latestSession} />
      </BlurFade>
    </div>
  );
}

function CoachSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]"
        />
      ))}
    </div>
  );
}
