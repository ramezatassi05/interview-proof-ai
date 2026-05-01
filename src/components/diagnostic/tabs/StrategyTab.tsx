'use client';

import type { PriorityAction, CognitiveRiskMap } from '@/types';
import { BlurFade } from '@/components/ui/blur-fade';
import { PriorityActions } from '@/components/diagnostic/PriorityActions';
import { CognitiveRadar } from '@/components/diagnostic/CognitiveRadar';

interface StrategyTabProps {
  priorityActions?: PriorityAction[];
  cognitiveRiskMap?: CognitiveRiskMap;
  companyName?: string;
}

export function StrategyTab({ priorityActions, cognitiveRiskMap, companyName }: StrategyTabProps) {
  return (
    <div className="space-y-8">
      {/* Priority Actions */}
      {priorityActions && priorityActions.length > 0 && (
        <BlurFade delay={0.05}>
          <section data-tour-step="strategy-actions">
            <h2 className="section-label mb-4">Priority Actions</h2>
            <PriorityActions actions={priorityActions} companyName={companyName} />
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
