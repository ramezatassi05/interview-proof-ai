'use client';

import type { ReactNode } from 'react';
import type { ArchetypeProfile, InterviewArchetypeType } from '@/types';

interface ArchetypeCardProps {
  profile: ArchetypeProfile;
}

// Color mappings for archetypes
const ARCHETYPE_COLORS: Record<
  InterviewArchetypeType,
  { bg: string; text: string; border: string }
> = {
  technical_potential_low_polish: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  strong_theoretical_weak_execution: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  resume_strong_system_weak: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  balanced_but_unproven: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
  high_ceiling_low_volume_practice: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
};

// Icons for archetypes
const ARCHETYPE_ICONS: Record<InterviewArchetypeType, ReactNode> = {
  technical_potential_low_polish: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  ),
  strong_theoretical_weak_execution: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  resume_strong_system_weak: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  balanced_but_unproven: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
      />
    </svg>
  ),
  high_ceiling_low_volume_practice: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  ),
};

export function ArchetypeCard({ profile }: ArchetypeCardProps) {
  const colors = ARCHETYPE_COLORS[profile.archetype];
  const icon = ARCHETYPE_ICONS[profile.archetype];
  const confidencePercent = Math.round(profile.confidence * 100);

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
      {/* Header with badge */}
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} ${colors.text}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${colors.bg} ${colors.text} ${colors.border} border`}
            >
              {profile.label}
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              {confidencePercent}% confidence
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
            Your Interview Profile
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 text-[var(--text-secondary)] leading-relaxed">{profile.description}</p>

      {/* Coaching Tips */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-[var(--text-primary)] uppercase tracking-wide">
          Coaching Recommendations
        </h4>
        <ul className="mt-3 space-y-2">
          {profile.coachingTips.map((tip, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
              <span
                className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
              >
                {index + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Version tag */}
      <div className="mt-6 pt-4 border-t border-[var(--border-default)]">
        <span className="text-xs text-[var(--text-muted)]">
          Classification version {profile.version}
        </span>
      </div>
    </div>
  );
}
