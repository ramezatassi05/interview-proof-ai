'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, hint, showCount = false, maxLength, className = '', id, value, ...props },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          className={`
            w-full rounded-xl border bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]' : 'border-[var(--border-default)]'}
            ${className}
          `}
          {...props}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
            {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
          </div>
          {showCount && (
            <p className="text-xs text-[var(--text-muted)]">
              {charCount}
              {maxLength && ` / ${maxLength}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
