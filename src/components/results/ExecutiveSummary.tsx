'use client';

import type { RiskBand, ScoreBreakdown, EvidenceContext, PriorEmploymentSignal } from '@/types';
import { RadialScoreIndicator } from '@/components/ui/RadialScoreIndicator';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';

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
  // Fallback: old client-side formula for existing reports without server-side scores
  const getPassProbabilityFallback = () => {
    if (readinessScore >= 80) return Math.min(95, 75 + (readinessScore - 80));
    if (readinessScore >= 60) return 50 + (readinessScore - 60) * 1.25;
    if (readinessScore >= 40) return 25 + (readinessScore - 40) * 1.25;
    return Math.max(5, readinessScore * 0.625);
  };

  // Fallback: old client-side formula for existing reports
  const getTechnicalStrengthFallback = () => {
    if (!scoreBreakdown) return readinessScore;
    return Math.round(
      scoreBreakdown.hardRequirementMatch * 0.5 +
        scoreBreakdown.roundReadiness * 0.3 +
        scoreBreakdown.evidenceDepth * 0.2
    );
  };

  // Generate highlight insight based on score and risk band
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

    // Prepend prior employment note when detected
    const priorNote = priorEmploymentSignal?.detected
      ? priorEmploymentSignal.isInternalTransfer
        ? `Currently employed at ${priorEmploymentSignal.companyName} — internal transfer advantage detected. `
        : `Prior experience at ${priorEmploymentSignal.companyName} detected — returning employee advantage applied. `
      : '';

    if (readinessScore >= 80) {
      if (totalRisks <= 2) {
        const matchedCount = evidenceContext?.matchedMustHaves.length ?? 0;
        const totalCount = matchedCount + (evidenceContext?.unmatchedMustHaves.length ?? 0);
        const evidenceNote =
          evidenceContext && totalCount > 0
            ? `Your experience covers ${matchedCount} of ${totalCount} must-have requirements — focus on practicing delivery.`
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
      {
        key: 'hardRequirementMatch',
        score: breakdown.hardRequirementMatch,
        label: 'requirements match',
      },
      { key: 'evidenceDepth', score: breakdown.evidenceDepth, label: 'evidence depth' },
      { key: 'roundReadiness', score: breakdown.roundReadiness, label: 'round readiness' },
      { key: 'resumeClarity', score: breakdown.resumeClarity, label: 'resume clarity' },
      { key: 'companyProxy', score: breakdown.companyProxy, label: 'company fit' },
    ];
    const weakest = areas.reduce((min, curr) => (curr.score < min.score ? curr : min));
    return weakest.label;
  };

  // Use server-side scores when available, fall back for old reports
  const passProbability = conversionLikelihood ?? Math.round(getPassProbabilityFallback());
  const technicalStrength = technicalFit ?? getTechnicalStrengthFallback();

  return (
    <div className="card-warm shadow-warm rounded-[20px] overflow-hidden">
      {/* Coral highlight strip */}
      <div className="h-1 w-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" />

      <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Executive Summary</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {companyName && jobTitle
              ? `${companyName} — ${jobTitle} · `
              : companyName
                ? `${companyName} `
                : jobTitle
                  ? `${jobTitle} · `
                  : ''}
            {ROUND_LABEL_MAP[roundType] ?? roundType.charAt(0).toUpperCase() + roundType.slice(1)} Readiness Intelligence
          </p>
        </div>
        <Badge variant={riskBandToVariant(riskBand)} className="text-sm px-4 py-1">
          {riskBand} Risk Profile
        </Badge>
      </div>

      {/* Radial Indicators Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <RadialScoreIndicator
          score={readinessScore}
          size="lg"
          label="Readiness Score"
          sublabel="Interview Readiness"
          variant="auto"
          animated
        />
        <RadialScoreIndicator
          score={passProbability}
          size="lg"
          label="Conversion Likelihood"
          sublabel="Interview Success Rate"
          variant="auto"
          animated
        />
        <RadialScoreIndicator
          score={technicalStrength}
          size="lg"
          label="Technical Fit"
          sublabel="Requirements Match"
          variant="auto"
          animated
        />
      </div>

      {/* Highlight Summary Box */}
      <div className="mb-8 rounded-[20px] bg-gradient-to-r from-[var(--color-warning)]/20 via-[var(--color-warning)]/15 to-[var(--color-warning)]/10 p-5 shadow-warm">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-warning)]/20">
            <svg
              className="h-5 w-5 text-[var(--color-warning)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-warning)] mb-1">Key Insight</h3>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              {getHighlightInsight()}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[var(--border-subtle)]">
        <MetricItem
          label="Red Flags"
          value={totalRisks.toString()}
          variant={totalRisks > 5 ? 'danger' : totalRisks > 2 ? 'warning' : 'success'}
        />
        <MetricItem
          label="Requirements"
          value={scoreBreakdown ? `${Math.round(scoreBreakdown.hardRequirementMatch)}%` : '—'}
          variant={
            scoreBreakdown && scoreBreakdown.hardRequirementMatch >= 70 ? 'success' : 'warning'
          }
        />
        <MetricItem
          label="Evidence Depth"
          value={scoreBreakdown ? `${Math.round(scoreBreakdown.evidenceDepth)}%` : '—'}
          variant={scoreBreakdown && scoreBreakdown.evidenceDepth >= 70 ? 'success' : 'warning'}
        />
        <MetricItem
          label="Resume Clarity"
          value={scoreBreakdown ? `${Math.round(scoreBreakdown.resumeClarity)}%` : '—'}
          variant={scoreBreakdown && scoreBreakdown.resumeClarity >= 70 ? 'success' : 'warning'}
        />
      </div>
      </div>
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: string;
  variant: 'success' | 'warning' | 'danger';
}

function MetricItem({ label, value, variant }: MetricItemProps) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold tabular-nums" style={{ color: `var(--color-${variant})` }}>
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
