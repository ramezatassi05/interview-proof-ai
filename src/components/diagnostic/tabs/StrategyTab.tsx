'use client';

import type {
  PriorityAction,
  ArchetypeProfile,
  InterviewRoundForecasts,
  TrajectoryProjection,
  EvidenceContext,
  PersonalizedCoaching,
  CompanyDifficultyContext,
  CognitiveRiskMap,
} from '@/types';
import { BlurFade } from '@/components/ui/blur-fade';
import { PriorityActions } from '@/components/diagnostic/PriorityActions';
import { CoachingHub } from '@/components/diagnostic/CoachingHub';
import { CognitiveRadar } from '@/components/diagnostic/CognitiveRadar';

interface StrategyTabProps {
  priorityActions?: PriorityAction[];
  archetypeProfile?: ArchetypeProfile;
  roundForecasts?: InterviewRoundForecasts;
  trajectoryProjection?: TrajectoryProjection;
  evidenceContext?: EvidenceContext;
  personalizedCoaching?: PersonalizedCoaching;
  companyDifficulty?: CompanyDifficultyContext;
  cognitiveRiskMap?: CognitiveRiskMap;
  userRoundType?: string;
  companyName?: string;
}

export function StrategyTab({
  priorityActions,
  archetypeProfile,
  roundForecasts,
  trajectoryProjection,
  evidenceContext,
  personalizedCoaching,
  companyDifficulty,
  cognitiveRiskMap,
  userRoundType,
  companyName,
}: StrategyTabProps) {
  return (
    <div className="space-y-8">
      {/* Priority Actions */}
      {priorityActions && priorityActions.length > 0 && (
        <BlurFade delay={0.05}>
          <section>
            <h2 className="section-label mb-4">Priority Actions</h2>
            <PriorityActions actions={priorityActions} companyName={companyName} />
          </section>
        </BlurFade>
      )}

      {/* Coaching Hub */}
      {archetypeProfile && (
        <BlurFade delay={0.1}>
          <section>
            <h2 className="section-label mb-4">Coaching Hub</h2>
            <CoachingHub
              archetypeProfile={archetypeProfile}
              roundForecasts={roundForecasts}
              trajectoryProjection={trajectoryProjection}
              evidenceContext={evidenceContext}
              personalizedCoaching={personalizedCoaching}
              companyDifficulty={companyDifficulty}
              userRoundType={userRoundType}
              companyName={companyName}
            />
          </section>
        </BlurFade>
      )}

      {/* Cognitive Map */}
      {cognitiveRiskMap && (
        <BlurFade delay={0.15}>
          <section>
            <h2 className="section-label mb-4">Cognitive Risk Map</h2>
            <CognitiveRadar riskMap={cognitiveRiskMap} companyName={companyName} />
          </section>
        </BlurFade>
      )}
    </div>
  );
}
