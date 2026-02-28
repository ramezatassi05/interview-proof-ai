'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface WaitlistFormProps {
  referralCode?: string;
  compact?: boolean;
}

export function WaitlistForm({ referralCode, compact = false }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const formLoadedAt = useRef(0);
  useEffect(() => {
    formLoadedAt.current = Date.now();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');

    try {
      const form = e.target as HTMLFormElement;
      const honeypot = (form.elements.namedItem('company_name') as HTMLInputElement)?.value || '';

      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          honeypot,
          formLoadedAt: formLoadedAt.current,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(data.data?.message || 'Check your email to confirm your spot.');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 px-4 py-3">
        <svg
          className="h-5 w-5 flex-shrink-0 text-[var(--color-success)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-sm text-[var(--text-primary)]">{message}</p>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="flex gap-2">
          {/* Honeypot — hidden from humans */}
          <input
            type="text"
            name="company_name"
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
          />
          <Button type="submit" variant="accent" size="md" loading={status === 'loading'}>
            Join Waitlist
          </Button>
        </div>
        {status === 'error' && (
          <p className="mt-2 text-xs text-[var(--color-danger)]">{message}</p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      {/* Honeypot — hidden from humans */}
      <input
        type="text"
        name="company_name"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
      />
      <label
        htmlFor="waitlist-email"
        className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
      >
        Email address
      </label>
      <input
        id="waitlist-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
      />
      {status === 'error' && (
        <p className="mt-2 text-xs text-[var(--color-danger)]">{message}</p>
      )}
      <Button
        type="submit"
        variant="accent"
        size="lg"
        loading={status === 'loading'}
        className="mt-3 w-full"
      >
        Join the Waitlist
      </Button>
    </form>
  );
}
