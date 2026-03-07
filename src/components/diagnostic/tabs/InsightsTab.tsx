'use client';

import type {
  RecruiterSimulation,
  RiskBand,
  ScoreBreakdown,
  EvidenceContext,
  PriorEmploymentSignal,
} from '@/types';
import { BlurFade } from '@/components/ui/blur-fade';
import { RecruiterView } from '@/components/diagnostic/RecruiterView';
import { ExecutiveSummary } from '@/components/results/ExecutiveSummary';

interface InsightsTabProps {
  recruiterSimulation?: RecruiterSimulation;
  readinessScore: number;
  riskBand: RiskBand;
  totalRisks: number;
  roundType: string;
  scoreBreakdown?: ScoreBreakdown;
  evidenceContext?: EvidenceContext;
  companyName?: string;
  jobTitle?: string;
  conversionLikelihood?: number;
  technicalFit?: number;
  priorEmploymentSignal?: PriorEmploymentSignal;
}

export function InsightsTab({
  recruiterSimulation,
  readinessScore,
  riskBand,
  totalRisks,
  roundType,
  scoreBreakdown,
  evidenceContext,
  companyName,
  jobTitle,
  conversionLikelihood,
  technicalFit,
  priorEmploymentSignal,
}: InsightsTabProps) {
  return (
    <div className="space-y-8">
      {/* Recruiter View */}
      {recruiterSimulation && (
        <BlurFade delay={0.05}>
          <section>
            <h2 className="section-label mb-4">Recruiter View</h2>
            <RecruiterView simulation={recruiterSimulation} companyName={companyName} />
          </section>
        </BlurFade>
      )}

      {/* Executive Summary (Detailed) */}
      <BlurFade delay={0.1}>
        <section>
          <h2 className="section-label mb-4">Executive Summary</h2>
          <ExecutiveSummary
            readinessScore={readinessScore}
            riskBand={riskBand}
            totalRisks={totalRisks}
            roundType={roundType}
            scoreBreakdown={scoreBreakdown}
            evidenceContext={evidenceContext}
            companyName={companyName}
            jobTitle={jobTitle}
            conversionLikelihood={conversionLikelihood}
            technicalFit={technicalFit}
            priorEmploymentSignal={priorEmploymentSignal}
          />
        </section>
      </BlurFade>
    </div>
  );
}
