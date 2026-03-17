'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

const BENEFITS = [
  {
    title: 'Free Lifetime Access',
    description: 'Get unlimited access to InterviewProof diagnostics for your entire career.',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
        />
      </svg>
    ),
  },
  {
    title: 'Referral Commissions',
    description: 'Earn credits and commissions for every student you refer who signs up.',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
        />
      </svg>
    ),
  },
  {
    title: 'Exclusive Community',
    description:
      'Join a network of student ambassadors at top universities with direct access to our team.',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Resume Builder',
    description:
      'Being an InterviewProof Ambassador is a leadership experience you can showcase on your resume.',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
  },
];

export default function AmbassadorsPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    university: '',
    gradYear: '',
    linkedin: '',
    whyInterested: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/ambassadors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
        return;
      }
      setStatus('success');
      setMessage('Application submitted! We\'ll be in touch soon.');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  const inputClass =
    'w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)]">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-1.5 text-xs font-semibold text-[var(--accent-primary)]">
                Ambassador Program
              </div>
              <h1 className="text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl">
                Become an InterviewProof Ambassador
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
                Help your peers prepare smarter for interviews. Get free lifetime access, earn
                commissions, and build your leadership profile.
              </p>
            </div>
          </Container>
        </section>

        {/* Benefits */}
        <section className="bg-[var(--bg-section-alt)] py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-center text-2xl font-bold text-[var(--text-primary)]">
                Ambassador Benefits
              </h2>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {BENEFITS.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                      {benefit.icon}
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Application form */}
        <section className="py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-xl">
              <h2 className="text-center text-2xl font-bold text-[var(--text-primary)]">
                Apply Now
              </h2>
              <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
                We review applications on a rolling basis. Priority given to students at partner
                universities.
              </p>

              {status === 'success' ? (
                <div className="mt-10 rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center">
                  <p className="text-lg font-semibold text-green-500">{message}</p>
                  <Link
                    href="/"
                    className="mt-4 inline-block text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    Back to Home
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-10 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Doe"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@university.edu"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">
                        University *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.university}
                        onChange={(e) => setForm({ ...form, university: e.target.value })}
                        placeholder="MIT"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">
                        Graduation Year *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.gradYear}
                        onChange={(e) => setForm({ ...form, gradYear: e.target.value })}
                        placeholder="2027"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={form.linkedin}
                      onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/janedoe"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">
                      Why are you interested? *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={form.whyInterested}
                      onChange={(e) => setForm({ ...form, whyInterested: e.target.value })}
                      placeholder="Tell us about your involvement in your university's career community and why you'd be a great ambassador..."
                      className={inputClass}
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-sm font-medium text-red-500">{message}</p>
                  )}

                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    rounded
                    disabled={status === 'loading'}
                    className="w-full"
                  >
                    {status === 'loading' ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </form>
              )}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
