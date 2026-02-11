'use client';

import type { ReactNode } from 'react';
import type { InterviewTimeline, ExperienceLevel, FocusArea, PrepPreferences } from '@/types';
import { Textarea } from '@/components/ui/Textarea';

// Timeline options
interface TimelineOption {
  value: InterviewTimeline;
  label: string;
  description: string;
  days: number;
}

const timelineOptions: TimelineOption[] = [
  { value: '1day', label: 'Tomorrow', description: 'Crunch time', days: 1 },
  { value: '3days', label: '3 Days', description: 'Quick prep', days: 3 },
  { value: '1week', label: '1 Week', description: 'Standard prep', days: 7 },
  { value: '2weeks', label: '2 Weeks', description: 'Thorough prep', days: 14 },
  { value: '4weeks_plus', label: '4+ Weeks', description: 'Full preparation', days: 28 },
];

// Employment type for the two-step experience selector
type EmploymentType = 'intern' | 'fulltime';

interface FullTimeSubOption {
  value: ExperienceLevel;
  label: string;
  description: string;
}

const fullTimeSubOptions: FullTimeSubOption[] = [
  { value: 'entry', label: 'Entry', description: '0-2 years' },
  { value: 'mid', label: 'Mid', description: '2-5 years' },
];

// Focus area options
interface FocusAreaOption {
  value: FocusArea;
  label: string;
  description: string;
  icon: ReactNode;
}

const focusAreaOptions: FocusAreaOption[] = [
  {
    value: 'technical_depth',
    label: 'Technical Depth',
    description: 'Algorithms, data structures, coding',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
  {
    value: 'behavioral_stories',
    label: 'Behavioral Stories',
    description: 'STAR format, leadership examples',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    value: 'system_design',
    label: 'System Design',
    description: 'Architecture, scalability, trade-offs',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    value: 'communication',
    label: 'Communication',
    description: 'Clarity, articulation, presence',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
        />
      </svg>
    ),
  },
  {
    value: 'domain_knowledge',
    label: 'Domain Knowledge',
    description: 'Industry-specific expertise',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
];

interface PrepPreferencesFormProps {
  value: PrepPreferences | null;
  onChange: (preferences: PrepPreferences) => void;
  error?: string;
}

export function PrepPreferencesForm({ value, onChange, error }: PrepPreferencesFormProps) {
  const handleTimelineChange = (timeline: InterviewTimeline) => {
    onChange({
      timeline,
      dailyHours: value?.dailyHours ?? 2,
      experienceLevel: value?.experienceLevel ?? 'entry',
      focusAreas: value?.focusAreas ?? [],
      additionalContext: value?.additionalContext,
    });
  };

  const handleHoursChange = (dailyHours: number) => {
    if (!value) return;
    onChange({ ...value, dailyHours });
  };

  // Derive the current employment type from the stored experience level
  const currentEmploymentType: EmploymentType | null = value
    ? value.experienceLevel === 'intern'
      ? 'intern'
      : 'fulltime'
    : null;

  const handleEmploymentTypeChange = (type: EmploymentType) => {
    if (!value) return;
    if (type === 'intern') {
      onChange({ ...value, experienceLevel: 'intern' });
    } else {
      // Default full-time sub-selection to entry
      onChange({ ...value, experienceLevel: 'entry' });
    }
  };

  const handleFullTimeSubChange = (experienceLevel: ExperienceLevel) => {
    if (!value) return;
    onChange({ ...value, experienceLevel });
  };

  const handleFocusAreaToggle = (area: FocusArea) => {
    if (!value) return;
    const currentAreas = value.focusAreas;
    let newAreas: FocusArea[];

    if (currentAreas.includes(area)) {
      newAreas = currentAreas.filter((a) => a !== area);
    } else if (currentAreas.length < 3) {
      newAreas = [...currentAreas, area];
    } else {
      return; // Max 3 areas
    }

    onChange({ ...value, focusAreas: newAreas });
  };

  const handleContextChange = (additionalContext: string) => {
    if (!value) return;
    onChange({ ...value, additionalContext: additionalContext || undefined });
  };

  return (
    <div className="space-y-8">
      {/* Timeline Selector */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">
          When is your interview?
        </label>
        <div className="grid grid-cols-5 gap-2">
          {timelineOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTimelineChange(option.value)}
              className={`
                rounded-xl border-2 p-3 text-center transition-all
                ${
                  value?.timeline === option.value
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                    : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--border-accent)]'
                }
              `}
            >
              <div
                className={`text-sm font-semibold ${
                  value?.timeline === option.value
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-primary)]'
                }`}
              >
                {option.label}
              </div>
              <div className="mt-0.5 text-xs text-[var(--text-muted)]">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Hours Slider */}
      {value && (
        <div>
          <label className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">
            Hours available per day:{' '}
            <span className="text-[var(--accent-primary)] font-bold">{value.dailyHours}h</span>
          </label>
          <div className="px-2">
            <input
              type="range"
              min="0.5"
              max="6"
              step="0.5"
              value={value.dailyHours}
              onChange={(e) => handleHoursChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-[var(--track-bg)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
            />
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
              <span>30 min</span>
              <span>6 hours</span>
            </div>
          </div>
        </div>
      )}

      {/* Employment Type */}
      {value && (
        <div>
          <label className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">
            I&apos;m looking for
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleEmploymentTypeChange('intern')}
              className={`
                rounded-xl border-2 p-4 text-center transition-all
                ${
                  currentEmploymentType === 'intern'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                    : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--border-accent)]'
                }
              `}
            >
              <div
                className={`text-sm font-semibold ${
                  currentEmploymentType === 'intern'
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-primary)]'
                }`}
              >
                Intern
              </div>
              <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                Student seeking an internship
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleEmploymentTypeChange('fulltime')}
              className={`
                rounded-xl border-2 p-4 text-center transition-all
                ${
                  currentEmploymentType === 'fulltime'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                    : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--border-accent)]'
                }
              `}
            >
              <div
                className={`text-sm font-semibold ${
                  currentEmploymentType === 'fulltime'
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-primary)]'
                }`}
              >
                Full-Time
              </div>
              <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                Looking for a full-time offer
              </div>
            </button>
          </div>

          {/* Full-Time sub-options */}
          {currentEmploymentType === 'fulltime' && (
            <div className="mt-3">
              <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
                Experience level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {fullTimeSubOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFullTimeSubChange(option.value)}
                    className={`
                      rounded-lg border-2 p-2.5 text-center transition-all
                      ${
                        value.experienceLevel === option.value
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                          : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--border-accent)]'
                      }
                    `}
                  >
                    <div
                      className={`text-sm font-medium ${
                        value.experienceLevel === option.value
                          ? 'text-[var(--accent-primary)]'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {option.label}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Focus Areas */}
      {value && (
        <div>
          <label className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">
            Focus Areas <span className="text-[var(--text-muted)]">(select up to 3)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {focusAreaOptions.map((option) => {
              const isSelected = value.focusAreas.includes(option.value);
              const isDisabled = !isSelected && value.focusAreas.length >= 3;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFocusAreaToggle(option.value)}
                  disabled={isDisabled}
                  className={`
                    rounded-xl border-2 p-3 text-left transition-all
                    ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                        : isDisabled
                          ? 'border-[var(--border-default)] bg-[var(--bg-elevated)] opacity-50 cursor-not-allowed'
                          : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--border-accent)]'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`
                        flex h-6 w-6 items-center justify-center rounded-md
                        ${
                          isSelected
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                        }
                      `}
                    >
                      {option.icon}
                    </div>
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {option.label}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">{option.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Context */}
      {value && (
        <div>
          <label className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">
            Additional Context <span className="text-[var(--text-muted)]">(optional)</span>
          </label>
          <Textarea
            value={value.additionalContext || ''}
            onChange={(e) => handleContextChange(e.target.value)}
            placeholder="Any specific concerns, areas you know you struggle with, or context about the role..."
            rows={3}
          />
        </div>
      )}

      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
