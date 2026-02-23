'use client';

import type { ReactNode } from 'react';
import type { RoundType } from '@/types';

interface RoundOption {
  value: RoundType;
  label: string;
  description: string;
  icon: ReactNode;
}

const roundOptions: RoundOption[] = [
  {
    value: 'technical',
    label: 'Technical',
    description: 'Coding, system design, algorithms',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    value: 'behavioral',
    label: 'Behavioral',
    description: 'STAR format, leadership, conflict',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    value: 'case',
    label: 'Case',
    description: 'Problem solving, frameworks, analysis',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    value: 'finance',
    label: 'Finance',
    description: 'Modeling, valuation, market questions',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    value: 'research',
    label: 'Research / ML',
    description: 'Research depth, ML knowledge, paper discussions',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        />
      </svg>
    ),
  },
];

interface RoundSelectorProps {
  value: RoundType | null;
  onChange: (value: RoundType) => void;
  error?: string;
}

export function RoundSelector({ value, onChange, error }: RoundSelectorProps) {
  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">
        Interview Round Type
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {roundOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              rounded-[20px] p-4 text-left transition-all shadow-warm
              ${
                value === option.value
                  ? 'ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'bg-[var(--bg-card)] hover:ring-2 hover:ring-[var(--accent-primary)]/30'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  flex h-10 w-10 items-center justify-center rounded-lg
                  ${
                    value === option.value
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                  }
                `}
              >
                {option.icon}
              </div>
              <div>
                <div
                  className={`font-semibold ${
                    value === option.value
                      ? 'text-[var(--accent-primary)]'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {option.label}
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">{option.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
