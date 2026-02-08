'use client';

import type { ArchetypeProfile } from '@/types';

interface ArchetypeCardProps {
  profile: ArchetypeProfile;
  companyName?: string;
}

export function ArchetypeCard({ profile, companyName }: ArchetypeCardProps) {
  const subtitle = companyName
    ? `Personalized tips based on your ${companyName} interview analysis`
    : 'Personalized tips based on your interview analysis';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Coaching Recommendations
          </h3>
          <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
        </div>
      </div>

      {/* Coaching tip cards */}
      <div className="grid gap-3">
        {profile.coachingTips.map((tip, index) => (
          <div
            key={index}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-sm font-semibold text-amber-400">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
