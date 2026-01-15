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
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
            w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900
            placeholder:text-zinc-400
            focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1
            disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500
            dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 dark:border-zinc-700'}
            ${className}
          `}
          {...props}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {hint && !error && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
          {showCount && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
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
