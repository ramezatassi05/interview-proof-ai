'use client';

import { useState } from 'react';
import type { UserResume } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { BlurFade } from '@/components/ui/blur-fade';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

interface ResumeSummaryProps {
  resume: UserResume;
  onUpdate: () => void;
  onDelete: () => void;
}

export function ResumeSummary({ resume, onUpdate, onDelete }: ResumeSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const parsed = resume.parsedData;

  return (
    <BlurFade delay={0.1}>
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
        {/* Header — always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-5 py-4 hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold text-sm shrink-0">
              {parsed.name?.[0]?.toUpperCase() || 'R'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {parsed.name || 'Your Resume'}
                </span>
                {resume.targetRole && (
                  <AnimatedShinyText className="text-xs font-medium">
                    {resume.targetRole}
                  </AnimatedShinyText>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {resume.skills.length} skills
                {parsed.experience.length > 0 && ` · ${parsed.experience.length} roles`}
                {parsed.yearsOfExperience != null && ` · ${parsed.yearsOfExperience}yr exp`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Actions dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                aria-label="Resume actions"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                </svg>
              </button>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 top-8 z-50 min-w-[140px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] shadow-lg py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActions(false);
                        onUpdate();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      Update Resume
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActions(false);
                        onDelete();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      Delete Resume
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Expand chevron */}
            <svg
              className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-[var(--border-default)] px-5 py-4 space-y-5">
            {/* Skills */}
            {resume.skills.length > 0 && (
              <BlurFade delay={0.05}>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.skills.slice(0, 30).map((skill) => (
                      <Badge key={skill} variant="accent" className="text-xs capitalize">
                        {skill}
                      </Badge>
                    ))}
                    {resume.skills.length > 30 && (
                      <Badge variant="default" className="text-xs">
                        +{resume.skills.length - 30} more
                      </Badge>
                    )}
                  </div>
                </div>
              </BlurFade>
            )}

            {/* Experience */}
            {parsed.experience.length > 0 && (
              <BlurFade delay={0.1}>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Experience
                  </h4>
                  <div className="space-y-2">
                    {parsed.experience.map((exp, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2.5"
                      >
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {exp.title}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {exp.company} · {exp.dates}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </BlurFade>
            )}

            {/* Education */}
            {parsed.education.length > 0 && (
              <BlurFade delay={0.15}>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Education
                  </h4>
                  <div className="space-y-2">
                    {parsed.education.map((edu, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2.5"
                      >
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {edu.degree}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {edu.institution}
                          {edu.graduationDate && ` · ${edu.graduationDate}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </BlurFade>
            )}
          </div>
        )}
      </div>
    </BlurFade>
  );
}
