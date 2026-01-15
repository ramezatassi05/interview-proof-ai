'use client';

import type { RoundType } from '@/types';

interface RoundOption {
  value: RoundType;
  label: string;
  description: string;
}

const roundOptions: RoundOption[] = [
  {
    value: 'technical',
    label: 'Technical',
    description: 'Coding, system design, algorithms',
  },
  {
    value: 'behavioral',
    label: 'Behavioral',
    description: 'STAR format, leadership, conflict',
  },
  {
    value: 'case',
    label: 'Case',
    description: 'Problem solving, frameworks, analysis',
  },
  {
    value: 'finance',
    label: 'Finance',
    description: 'Modeling, valuation, market questions',
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
      <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Interview Round Type
      </label>
      <div className="grid grid-cols-2 gap-3">
        {roundOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              rounded-lg border p-4 text-left transition-all
              ${
                value === option.value
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                  : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500'
              }
            `}
          >
            <div
              className={`font-medium ${
                value === option.value
                  ? 'text-white dark:text-zinc-900'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {option.label}
            </div>
            <div
              className={`mt-1 text-xs ${
                value === option.value
                  ? 'text-zinc-300 dark:text-zinc-600'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {option.description}
            </div>
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
