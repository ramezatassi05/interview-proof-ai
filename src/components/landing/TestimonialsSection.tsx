'use client';

import { useState, useEffect, useRef } from 'react';
import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  outcome: string;
  stars: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'I ran InterviewProof before my Google interview and it flagged exactly the gaps I had in system design. I spent the weekend fixing them and got the offer.',
    name: 'Alex K.',
    role: 'Software Engineer at Google',
    initials: 'AK',
    outcome: 'Score: 62 → 87',
    stars: 5,
  },
  {
    quote:
      'The recruiter simulation was eye-opening. I had no idea my behavioral answers were so generic until I saw them scored. The coaching tips were immediately actionable.',
    name: 'Sarah M.',
    role: 'Product Manager at Stripe',
    initials: 'SM',
    outcome: 'Landed offer in 2 weeks',
    stars: 5,
  },
  {
    quote:
      "Most prep tools give generic advice. InterviewProof analyzed my actual resume against the JD and told me exactly what to fix. It's like having a career coach on demand.",
    name: 'James T.',
    role: 'Senior Engineer at Meta',
    initials: 'JT',
    outcome: '3 offers after 1 month',
    stars: 5,
  },
  {
    quote:
      'I used InterviewProof for 3 different roles and each time the diagnostic was completely different and specific. The predicted questions feature alone was worth it.',
    name: 'Priya R.',
    role: 'Data Scientist at Netflix',
    initials: 'PR',
    outcome: 'Nailed 4 out of 5 predicted questions',
    stars: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className="h-4 w-4 text-amber-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8 text-center">
      <StarRating count={testimonial.stars} />

      <svg
        className="mx-auto mt-4 h-8 w-8 text-[var(--accent-primary)]/30"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
      </svg>

      <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      <div className="mx-auto mt-4 w-fit rounded-full bg-[var(--accent-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent-primary)]">
        {testimonial.outcome}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-sm font-bold text-[var(--accent-primary)]">
          {testimonial.initials}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {testimonial.name}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

const AUTO_ADVANCE_MS = 5000;

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const isPaused = useRef(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (isDesktop) return;
    const interval = setInterval(() => {
      if (isPaused.current) return;
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [isDesktop]);

  return (
    <section id="testimonials" className="py-20 lg:py-28">
      <Container size="2xl">
        <div className="text-center">
          <SectionBadge label="Testimonials" />
          <h2 className="heading-modern mt-5 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            Trusted by candidates at top companies
          </h2>
        </div>

        {/* Desktop: grid layout */}
        <div className="mt-14 hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.slice(0, 3).map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} />
          ))}
          {TESTIMONIALS.length > 3 && (
            <div className="hidden lg:hidden md:block md:col-span-2">
              <div className="mx-auto max-w-md">
                <TestimonialCard testimonial={TESTIMONIALS[3]} />
              </div>
            </div>
          )}
          {TESTIMONIALS.length > 3 && (
            <div className="hidden lg:contents">
              <TestimonialCard testimonial={TESTIMONIALS[3]} />
            </div>
          )}
        </div>

        {/* Mobile: carousel */}
        <div
          className="mx-auto mt-14 max-w-2xl md:hidden"
          onMouseEnter={() => {
            isPaused.current = true;
          }}
          onMouseLeave={() => {
            isPaused.current = false;
          }}
        >
          <TestimonialCard testimonial={TESTIMONIALS[activeIndex]} />

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
