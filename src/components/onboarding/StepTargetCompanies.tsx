'use client';

import { useState, useCallback } from 'react';
import { BlurFade } from '@/components/ui/blur-fade';
import type { TargetCompany } from '@/types';

interface StepTargetCompaniesProps {
  companies: TargetCompany[];
  onChange: (companies: TargetCompany[]) => void;
}

export function StepTargetCompanies({ companies, onChange }: StepTargetCompaniesProps) {
  const [inputValue, setInputValue] = useState('');

  const addCompany = useCallback(() => {
    const name = inputValue.trim();
    if (!name || companies.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setInputValue('');
      return;
    }
    onChange([...companies, { name }]);
    setInputValue('');
  }, [inputValue, companies, onChange]);

  const removeCompany = useCallback(
    (index: number) => {
      onChange(companies.filter((_, i) => i !== index));
    },
    [companies, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCompany();
      }
    },
    [addCompany]
  );

  return (
    <div className="flex flex-col items-center">
      <BlurFade delay={0}>
        <h1 className="mb-2 text-center font-serif text-3xl font-bold text-[var(--text-primary)]">
          Target Companies
        </h1>
      </BlurFade>

      <BlurFade delay={0.1}>
        <p className="mb-10 text-center text-[var(--text-secondary)]">
          Which companies are you interviewing at or targeting?
        </p>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="w-full max-w-md">
          <div className="flex gap-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a company name and press Enter"
              className="flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
            <button
              onClick={addCompany}
              disabled={!inputValue.trim()}
              className="rounded-xl bg-[var(--accent-primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-secondary)] disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {companies.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {companies.map((company, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
                >
                  {company.name}
                  <button
                    onClick={() => removeCompany(index)}
                    className="ml-0.5 rounded-full p-0.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--color-danger)]"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
            {companies.length === 0
              ? 'You can add multiple companies or skip this step'
              : `${companies.length} company${companies.length === 1 ? '' : 'ies'} added`}
          </p>
        </div>
      </BlurFade>
    </div>
  );
}
