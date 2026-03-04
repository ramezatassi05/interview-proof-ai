'use client';

import { useState, useEffect, useRef } from 'react';
import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'I ran InterviewProof before my Google interview and it flagged exactly the gaps I had in system design. I spent the weekend fixing them and got the offer.',
    name: 'Alex K.',
    role: 'Software Engineer at Google',
    initials: 'AK',
  },
  {
    quote:
      'The recruiter simulation was eye-opening. I had no idea my behavioral answers were so generic until I saw them scored. The coaching tips were immediately actionable.',
    name: 'Sarah M.',
    role: 'Product Manager at Stripe',
    initials: 'SM',
  },
  {
    quote:
      "Most prep tools give generic advice. InterviewProof analyzed my actual resume against the JD and told me exactly what to fix. It's like having a career coach on demand.",
    name: 'James T.',
    role: 'Senior Engineer at Meta',
    initials: 'JT',
  },
  {
    quote:
      'I used InterviewProof for 3 different roles and each time the diagnostic was completely different and specific. The predicted questions feature alone was worth it.',
    name: 'Priya R.',
    role: 'Data Scientist at Netflix',
    initials: 'PR',
  },
];

const AUTO_ADVANCE_MS = 5000;

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const isPaused = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused.current) return;
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, []);

  const current = TESTIMONIALS[activeIndex];

  return (
    <section className="py-20 lg:py-28">
      <Container size="2xl">
        <div className="text-center">
          <SectionBadge label="Testimonials" />
          <h2 className="heading-modern mt-5 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            Trusted by candidates at top companies
          </h2>
        </div>

        <div
          className="mx-auto mt-14 max-w-2xl"
          onMouseEnter={() => { isPaused.current = true; }}
          onMouseLeave={() => { isPaused.current = false; }}
        >
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8 text-center">
            <svg className="mx-auto h-8 w-8 text-[var(--accent-primary)]/30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>

            <p className="mt-6 text-base leading-relaxed text-[var(--text-secondary)]">
              &ldquo;{current.quote}&rdquo;
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-sm font-bold text-[var(--accent-primary)]">
                {current.initials}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{current.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{current.role}</p>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="mt-6 flex justify-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? 'w-6 bg-[var(--accent-primary)]'
                    : 'w-2 bg-[var(--text-muted)]/30'
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
