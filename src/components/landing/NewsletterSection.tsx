'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';
import { Button } from '@/components/ui/Button';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
        return;
      }
      setStatus('success');
      setMessage('You\'re subscribed! Check your inbox.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <section id="newsletter" className="py-20 lg:py-28 bg-[var(--bg-section-alt)]">
      <Container size="md">
        <div className="mx-auto max-w-xl text-center">
          <SectionBadge label="Newsletter" />
          <h2 className="heading-modern mt-5 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Interview tips, delivered weekly
          </h2>
          <p className="mt-3 text-base text-[var(--text-secondary)]">
            Get actionable interview strategies, industry insights, and product updates. No spam,
            unsubscribe anytime.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex gap-3 sm:flex-row flex-col">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={status === 'loading'}
              className="flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] disabled:opacity-60"
            />
            <Button
              type="submit"
              variant="gradient"
              rounded
              disabled={status === 'loading'}
              className="whitespace-nowrap"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>

          {status === 'success' && (
            <p className="mt-3 text-sm font-medium text-green-500">{message}</p>
          )}
          {status === 'error' && (
            <p className="mt-3 text-sm font-medium text-red-500">{message}</p>
          )}
        </div>
      </Container>
    </section>
  );
}
