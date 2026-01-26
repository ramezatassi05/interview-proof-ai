'use client';

import type { ScoreBreakdown, RiskItem } from '@/types';

interface StrengthsAndRisksProps {
  scoreBreakdown?: ScoreBreakdown;
  risks: RiskItem[];
  maxItems?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  hardRequirementMatch: 'Strong requirements match',
  evidenceDepth: 'Deep evidence of experience',
  roundReadiness: 'Well-prepared for this round',
  resumeClarity: 'Clear, well-structured resume',
  companyProxy: 'Good company culture fit',
};

export function StrengthsAndRisks({ scoreBreakdown, risks, maxItems = 4 }: StrengthsAndRisksProps) {
  // Derive strengths from score breakdown - categories with score >= 70
  const strengths: string[] = [];
  if (scoreBreakdown) {
    if (scoreBreakdown.hardRequirementMatch >= 70)
      strengths.push(CATEGORY_LABELS.hardRequirementMatch);
    if (scoreBreakdown.evidenceDepth >= 70) strengths.push(CATEGORY_LABELS.evidenceDepth);
    if (scoreBreakdown.roundReadiness >= 70) strengths.push(CATEGORY_LABELS.roundReadiness);
    if (scoreBreakdown.resumeClarity >= 70) strengths.push(CATEGORY_LABELS.resumeClarity);
    if (scoreBreakdown.companyProxy >= 70) strengths.push(CATEGORY_LABELS.companyProxy);
  }

  // Get top risks
  const topRisks = risks.slice(0, maxItems);

  // Don't render if no strengths and no risks
  if (strengths.length === 0 && topRisks.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Strengths Column */}
      <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success-muted)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-success)]/20">
            <svg
              className="h-4 w-4 text-[var(--color-success)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[var(--color-success)]">Key Strengths</h3>
        </div>
        {strengths.length > 0 ? (
          <ul className="space-y-2.5">
            {strengths.slice(0, maxItems).map((strength, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-[var(--color-success)] mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4"
                  />
                </svg>
                <span className="text-sm text-[var(--text-primary)]">{strength}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--text-muted)] italic">
            No strong areas identified yet. Focus on improving your scores to see strengths here.
          </p>
        )}
      </div>

      {/* Risks Column */}
      <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-danger)]/20">
            <svg
              className="h-4 w-4 text-[var(--color-danger)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[var(--color-danger)]">Areas of Concern</h3>
        </div>
        {topRisks.length > 0 ? (
          <ul className="space-y-2.5">
            {topRisks.map((risk, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-[var(--color-danger)] mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="text-sm text-[var(--text-primary)]">{risk.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--text-muted)] italic">
            No significant concerns identified. Great job!
          </p>
        )}
      </div>
    </div>
  );
}
