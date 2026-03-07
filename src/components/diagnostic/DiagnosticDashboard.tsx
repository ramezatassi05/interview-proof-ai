'use client';

import type {
  RiskBand,
  ScoreBreakdown,
  EvidenceContext,
  PriorEmploymentSignal,
  HireZoneAnalysis,
  PriorityAction,
} from '@/types';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';
import { RadialScoreIndicator } from '@/components/ui/RadialScoreIndicator';
import { MetricCard } from '@/components/ui/MetricCard';
import { BlurFade } from '@/components/ui/blur-fade';
import { BorderBeam } from '@/components/ui/border-beam';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

interface DiagnosticDashboardProps {
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
  hireZoneAnalysis?: HireZoneAnalysis;
  priorityAction?: PriorityAction;
  onTabSwitch?: (tab: string) => void;
}

function getHireZoneLabel(status: string): string {
  switch (status) {
    case 'above':
      return 'Above';
    case 'in_zone':
      return 'In Zone';
    case 'below':
      return 'Below';
    default:
      return 'N/A';
  }
}

function getHireZoneVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'above':
      return 'success';
    case 'in_zone':
      return 'success';
    case 'below':
      return 'danger';
    default:
      return 'default';
  }
}

export function DiagnosticDashboard({
  readinessScore,
  riskBand,
  totalRisks,
  scoreBreakdown,
  conversionLikelihood,
  technicalFit,
  priorEmploymentSignal,
  hireZoneAnalysis,
  priorityAction,
  onTabSwitch,
}: DiagnosticDashboardProps) {
  const getPassProbabilityFallback = () => {
    if (readinessScore >= 80) return Math.min(95, 75 + (readinessScore - 80));
    if (readinessScore >= 60) return 50 + (readinessScore - 60) * 1.25;
    if (readinessScore >= 40) return 25 + (readinessScore - 40) * 1.25;
    return Math.max(5, readinessScore * 0.625);
  };

  const getTechnicalStrengthFallback = () => {
    if (!scoreBreakdown) return readinessScore;
    return Math.round(
      scoreBreakdown.hardRequirementMatch * 0.5 +
        scoreBreakdown.roundReadiness * 0.3 +
        scoreBreakdown.evidenceDepth * 0.2
    );
  };

  const passProbability = conversionLikelihood ?? Math.round(getPassProbabilityFallback());
  const technicalStrength = technicalFit ?? getTechnicalStrengthFallback();

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 sm:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Left: Radial Score */}
        <BlurFade delay={0.05}>
          <div className="flex flex-col items-center gap-3">
            <RadialScoreIndicator
              score={readinessScore}
              size="xl"
              showPercentage={false}
              label="Readiness Score"
            />
            <Badge variant={riskBandToVariant(riskBand)} className="mt-1">
              {riskBand} Risk
            </Badge>
            {priorEmploymentSignal?.detected && (
              <AnimatedShinyText className="text-xs font-medium">
                Prior: {priorEmploymentSignal.companyName}
              </AnimatedShinyText>
            )}
          </div>
        </BlurFade>

        {/* Right: Metrics + Risk snapshot */}
        <div className="flex-1 space-y-5">
          {/* 3 metric cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BlurFade delay={0.1}>
              <MetricCard
                title="Conversion Likelihood"
                value={`${passProbability}%`}
                variant={passProbability >= 60 ? 'success' : passProbability >= 40 ? 'warning' : 'danger'}
                subtitle={passProbability >= 70 ? 'Strong' : passProbability >= 50 ? 'Moderate' : 'Needs Work'}
              />
            </BlurFade>
            <BlurFade delay={0.16}>
              <MetricCard
                title="Technical Fit"
                value={`${technicalStrength}%`}
                variant={
                  technicalStrength >= 70 ? 'success' : technicalStrength >= 40 ? 'warning' : 'danger'
                }
                subtitle={technicalStrength >= 70 ? 'High' : technicalStrength >= 40 ? 'Medium' : 'Low'}
              />
            </BlurFade>
            <BlurFade delay={0.22}>
              <MetricCard
                title="Hire Zone"
                value={hireZoneAnalysis ? getHireZoneLabel(hireZoneAnalysis.status) : 'N/A'}
                variant={hireZoneAnalysis ? getHireZoneVariant(hireZoneAnalysis.status) : 'default'}
                subtitle={
                  hireZoneAnalysis
                    ? `Score: ${hireZoneAnalysis.currentScore} / Zone: ${hireZoneAnalysis.hireZoneMin}-${hireZoneAnalysis.hireZoneMax}`
                    : undefined
                }
              />
            </BlurFade>
          </div>

          {/* Risk snapshot */}
          <BlurFade delay={0.28}>
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">{totalRisks}</span> risk{totalRisks !== 1 ? 's' : ''} identified
              </span>
              {onTabSwitch && (
                <button
                  onClick={() => onTabSwitch('analysis')}
                  className="ml-1 text-[var(--accent-primary)] hover:underline"
                >
                  View in Analysis
                </button>
              )}
            </div>
          </BlurFade>
        </div>
      </div>

      {/* Priority Action CTA */}
      {priorityAction && (
        <BlurFade delay={0.32}>
          <div className="relative mt-6 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4">
            <BorderBeam size={150} duration={12} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {priorityAction.action}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {priorityAction.rationale}
                  </p>
                </div>
              </div>
              {onTabSwitch && (
                <button
                  onClick={() => onTabSwitch('strategy')}
                  className="flex-shrink-0 text-xs font-medium text-[var(--accent-primary)] hover:underline"
                >
                  Go to Strategy
                </button>
              )}
            </div>
          </div>
        </BlurFade>
      )}
    </div>
  );
}
