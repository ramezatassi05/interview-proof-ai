'use client';

import type { ScoreBreakdown as ScoreBreakdownType } from '@/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Collapsible } from '@/components/ui/Collapsible';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType;
  companyName?: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; description: string; details: string }> = {
  hardRequirementMatch: {
    label: 'Hard Requirements Match',
    description: 'Must-have skills alignment',
    details:
      'Measures how well your experience matches the mandatory requirements listed in the job description. Includes technical skills, years of experience, and required certifications.',
  },
  evidenceDepth: {
    label: 'Evidence Depth',
    description: 'Proof of experience',
    details:
      'Evaluates the quality and specificity of achievements on your resume. Strong evidence includes quantified results, specific project details, and measurable outcomes.',
  },
  roundReadiness: {
    label: 'Round Readiness',
    description: 'Interview type fit',
    details:
      'Assesses how prepared you are for this specific interview round. Considers the type of questions likely to be asked and whether your experience supports strong answers.',
  },
  resumeClarity: {
    label: 'Resume Clarity',
    description: 'Communication quality',
    details:
      'Rates the clarity, structure, and professionalism of your resume. Clear resumes make it easy for interviewers to quickly understand your qualifications.',
  },
  companyProxy: {
    label: 'Company Fit',
    description: 'Culture alignment',
    details:
      'Estimates how well your background and experience align with the company culture and values. Based on patterns from similar successful candidates.',
  },
};

export function ScoreBreakdown({ breakdown, companyName }: ScoreBreakdownProps) {
  const categories = [
    {
      key: 'hardRequirementMatch',
      score: breakdown.hardRequirementMatch,
      weight: breakdown.weights.hardRequirementMatch,
    },
    {
      key: 'evidenceDepth',
      score: breakdown.evidenceDepth,
      weight: breakdown.weights.evidenceDepth,
    },
    {
      key: 'roundReadiness',
      score: breakdown.roundReadiness,
      weight: breakdown.weights.roundReadiness,
    },
    {
      key: 'resumeClarity',
      score: breakdown.resumeClarity,
      weight: breakdown.weights.resumeClarity,
    },
    {
      key: 'companyProxy',
      score: breakdown.companyProxy,
      weight: breakdown.weights.companyProxy,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-[var(--accent-primary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {companyName ? `${companyName} Signal Strength Analysis` : 'Signal Strength Analysis'}
          </h2>
        </div>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-1 rounded">
          v{breakdown.version}
        </span>
      </div>

      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
        <div className="space-y-1">
          {categories.map(({ key, score, weight }) => {
            const config = CATEGORY_CONFIG[key];
            const roundedScore = Math.round(score);

            return (
              <Collapsible
                key={key}
                header={
                  <div className="flex-1 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {config.label}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded">
                          {Math.round(weight * 100)}% weight
                        </span>
                      </div>
                    </div>
                    <ProgressBar value={roundedScore} max={100} size="md" variant="auto" animated />
                  </div>
                }
                className="border-b border-[var(--border-default)] last:border-b-0"
              >
                <div className="pb-4 pl-1">
                  <p className="text-sm text-[var(--text-secondary)] mb-2">{config.description}</p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {config.details}
                  </p>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}
