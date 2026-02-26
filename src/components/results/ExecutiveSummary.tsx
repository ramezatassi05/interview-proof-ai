'use client';

import type { RiskBand, ScoreBreakdown, EvidenceContext, PriorEmploymentSignal } from '@/types';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';
import { RadialScoreIndicator } from '@/components/ui/RadialScoreIndicator';

interface ExecutiveSummaryProps {
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

export function ExecutiveSummary({
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
}: ExecutiveSummaryProps) {
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

  const ROUND_LABEL_MAP: Record<string, string> = {
    technical: 'Technical',
    behavioral: 'Behavioral',
    case: 'Case',
    finance: 'Finance',
    research: 'Research / ML',
  };

  const getHighlightInsight = () => {
    const roundLabel = ROUND_LABEL_MAP[roundType] ?? roundType.charAt(0).toUpperCase() + roundType.slice(1);
    const interviewLabel = companyName
      ? `${companyName} ${roundLabel} interview`
      : `${roundLabel} interview`;

    const priorNote = priorEmploymentSignal?.detected
      ? priorEmploymentSignal.isInternalTransfer
        ? `Currently employed at ${priorEmploymentSignal.companyName} \u2014 internal transfer advantage detected. `
        : `Prior experience at ${priorEmploymentSignal.companyName} detected \u2014 returning employee advantage applied. `
      : '';

    if (readinessScore >= 80) {
      if (totalRisks <= 2) {
        const matchedCount = evidenceContext?.matchedMustHaves.length ?? 0;
        const totalCount = matchedCount + (evidenceContext?.unmatchedMustHaves.length ?? 0);
        const evidenceNote =
          evidenceContext && totalCount > 0
            ? `Your experience covers ${matchedCount} of ${totalCount} must-have requirements \u2014 focus on practicing delivery.`
            : `Your experience aligns well with requirements - focus on practicing delivery.`;
        return `${priorNote}Strong candidate profile for ${interviewLabel}. ${evidenceNote}`;
      }
      return `${priorNote}Good readiness score, but address the ${totalRisks} identified risks to maximize your chances in the ${interviewLabel}.`;
    }
    if (readinessScore >= 60) {
      const weakArea = scoreBreakdown ? getWeakestArea(scoreBreakdown) : 'key requirements';
      return `${priorNote}Moderate readiness for ${interviewLabel}. Prioritize strengthening your ${weakArea} before the interview.`;
    }
    if (readinessScore >= 40) {
      return `${priorNote}Your profile needs work for this ${interviewLabel}. Review the study plan below and address high-priority risks first.`;
    }
    return `${priorNote}Significant gaps identified for this ${interviewLabel}. Consider gaining more relevant experience or targeting different roles.`;
  };

  const getWeakestArea = (breakdown: ScoreBreakdown): string => {
    const areas = [
      { score: breakdown.hardRequirementMatch, label: 'requirements match' },
      { score: breakdown.evidenceDepth, label: 'evidence depth' },
      { score: breakdown.roundReadiness, label: 'round readiness' },
      { score: breakdown.resumeClarity, label: 'resume clarity' },
      { score: breakdown.companyProxy, label: 'company fit' },
    ];
    const weakest = areas.reduce((min, curr) => (curr.score < min.score ? curr : min));
    return weakest.label;
  };

  const passProbability = conversionLikelihood ?? Math.round(getPassProbabilityFallback());
  const technicalStrength = technicalFit ?? getTechnicalStrengthFallback();

  const redFlagColor = totalRisks > 5 ? 'var(--color-danger)' : totalRisks > 2 ? 'var(--color-warning)' : 'var(--color-success)';

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">Executive Summary</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {companyName && jobTitle
              ? `${companyName} \u2014 ${jobTitle}`
              : companyName || jobTitle || ''}
            {(companyName || jobTitle) && ' \u00b7 '}
            {ROUND_LABEL_MAP[roundType] ?? roundType.charAt(0).toUpperCase() + roundType.slice(1)} Readiness Intelligence
          </p>
        </div>
        <Badge variant={riskBandToVariant(riskBand)}>
          {riskBand} Risk Profile
        </Badge>
      </div>

      {/* Primary metrics — radial indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-6 py-6 border-t border-[var(--border-default)]">
        <RadialScoreIndicator
          score={readinessScore}
          size="lg"
          showPercentage={false}
          label="Readiness Score"
        />
        <RadialScoreIndicator
          score={passProbability}
          size="md"
          showPercentage={true}
          label="Conversion Likelihood"
        />
        <RadialScoreIndicator
          score={technicalStrength}
          size="md"
          showPercentage={true}
          label="Technical Fit"
        />
        {/* Red Flags — count badge (not a percentage) */}
        <div className="flex flex-col items-center">
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 96,
              height: 96,
              border: `6px solid ${redFlagColor}`,
            }}
          >
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: redFlagColor }}
            >
              {totalRisks}
            </span>
          </div>
          <div className="mt-2 text-center">
            <p className="font-medium text-[var(--text-primary)] text-xs">Red Flags</p>
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <div className="px-6 py-4 border-t border-[var(--border-default)]">
        <div className="border-l-2 border-[var(--accent-primary)] pl-4 py-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Key Insight</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {getHighlightInsight()}
          </p>
        </div>
      </div>

      {/* Secondary metrics — small radials */}
      {scoreBreakdown && (
        <div className="grid grid-cols-3 gap-4 px-6 py-5 border-t border-[var(--border-default)]">
          <RadialScoreIndicator
            score={Math.round(scoreBreakdown.hardRequirementMatch)}
            size="sm"
            showPercentage={true}
            label="Requirements"
          />
          <RadialScoreIndicator
            score={Math.round(scoreBreakdown.evidenceDepth)}
            size="sm"
            showPercentage={true}
            label="Evidence Depth"
          />
          <RadialScoreIndicator
            score={Math.round(scoreBreakdown.resumeClarity)}
            size="sm"
            showPercentage={true}
            label="Resume Clarity"
          />
        </div>
      )}
    </div>
  );
}
