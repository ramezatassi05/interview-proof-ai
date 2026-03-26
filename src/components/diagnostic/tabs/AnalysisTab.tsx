'use client';

import type {
  ScoreBreakdown as ScoreBreakdownType,
  HireZoneAnalysis,
  CompetencyHeatmapData,
  RiskItem,
  EvidenceContext,
} from '@/types';
import { BlurFade } from '@/components/ui/blur-fade';
import { ScoreBreakdown } from '@/components/diagnostic/ScoreBreakdown';
import { HireZoneChart } from '@/components/diagnostic/HireZoneChart';
import { CompetencyHeatmap } from '@/components/diagnostic/CompetencyHeatmap';
import { RiskList } from '@/components/results/RiskList';
import { StrengthsAndRisks } from '@/components/results/StrengthsAndRisks';

interface AnalysisTabProps {
  scoreBreakdown?: ScoreBreakdownType;
  hireZoneAnalysis?: HireZoneAnalysis;
  competencyHeatmap?: CompetencyHeatmapData;
  allRisks?: RiskItem[];
  evidenceContext?: EvidenceContext;
  companyName?: string;
}

export function AnalysisTab({
  scoreBreakdown,
  hireZoneAnalysis,
  competencyHeatmap,
  allRisks,
  evidenceContext,
  companyName,
}: AnalysisTabProps) {
  return (
    <div className="space-y-8">
      {/* Red Flags */}
      {allRisks && allRisks.length > 0 && (
        <BlurFade delay={0.05}>
          <section>
            <h2 className="section-label mb-4">
              {companyName ? `${companyName} ` : ''}Red Flags ({allRisks.length})
            </h2>
            <RiskList risks={allRisks} showEvidence />
          </section>
        </BlurFade>
      )}

      {/* Strengths & Risks */}
      {scoreBreakdown && allRisks && (
        <BlurFade delay={0.1}>
          <section>
            <h2 className="section-label mb-4">Strengths & Risks</h2>
            <StrengthsAndRisks
              scoreBreakdown={scoreBreakdown}
              risks={allRisks}
              maxItems={4}
              evidenceContext={evidenceContext}
            />
          </section>
        </BlurFade>
      )}

      {/* Hire Zone */}
      {hireZoneAnalysis && (
        <BlurFade delay={0.15}>
          <section>
            <h2 className="section-label mb-4">Hire Zone</h2>
            <HireZoneChart hireZone={hireZoneAnalysis} companyName={companyName} />
          </section>
        </BlurFade>
      )}

      {/* Competency Map */}
      {competencyHeatmap && (
        <BlurFade delay={0.2}>
          <section>
            <h2 className="section-label mb-4">Competency Map</h2>
            <CompetencyHeatmap heatmap={competencyHeatmap} companyName={companyName} />
          </section>
        </BlurFade>
      )}

      {/* Signal Strength */}
      {scoreBreakdown && (
        <BlurFade delay={0.25}>
          <section>
            <h2 className="section-label mb-4">Signal Strength</h2>
            <ScoreBreakdown
              breakdown={scoreBreakdown}
              companyName={companyName}
              evidenceContext={evidenceContext}
            />
          </section>
        </BlurFade>
      )}
    </div>
  );
}
