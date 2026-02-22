'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'What is InterviewProof?',
    answer:
      'InterviewProof is an interview intelligence platform that analyzes your resume against a specific job description to diagnose your exact rejection risks, score your readiness, and give you a prioritized plan to fix your biggest gaps before the interview.',
  },
  {
    question: 'How long does a diagnostic take?',
    answer:
      "About 60 seconds. Upload your resume, paste the job description, and you'll get your readiness score, top rejection risks, and a prioritized study plan almost instantly.",
  },
  {
    question: 'How accurate is the analysis?',
    answer:
      'Our scoring engine uses structured rubrics modeled on real hiring criteria across 6 dimensions. It cross-references your resume evidence against the job requirements to surface concrete gaps — not generic advice.',
  },
  {
    question: 'Do I need a credit card for the free preview?',
    answer:
      'No. You can run a diagnostic and see your readiness score, risk band, and top gaps for free. The full diagnostic with detailed breakdowns, recruiter simulation, and practice questions is a one-time $15 unlock per report.',
  },
  {
    question: "What's the difference between the free preview and the full diagnostic?",
    answer:
      'The free preview gives you your overall readiness score and risk band. The full diagnostic unlocks detailed scoring breakdowns, evidence-backed rejection risks, a recruiter simulation, interview questions, a study plan, and practice intelligence tools.',
  },
  {
    question: 'What types of interviews does it support?',
    answer:
      'InterviewProof supports technical, behavioral, case, and finance interview rounds. The analysis adapts its scoring dimensions and rubrics based on the round type and the specific role requirements.',
  },
  {
    question: 'What if I get a low readiness score?',
    answer:
      "That's exactly the point — better to find out now than in the interview. Your diagnostic includes a prioritized action plan showing the highest-impact fixes first, with estimated time to complete each one.",
  },
  {
    question: 'How does InterviewProof compare to mock interviews or coaching?',
    answer:
      'Mock interviews and coaching are valuable but expensive and time-consuming. InterviewProof gives you a data-driven baseline in 60 seconds so you know exactly where to focus. Use it before coaching to make every session count, or on its own for fast, targeted prep.',
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-shrink-0 text-[var(--accent-primary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section>
      <Container className="py-14">
        <div className="flex flex-col items-center text-center">
          <Badge variant="accent">FAQ</Badge>
          <h2 className="mt-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Frequently Asked <span className="text-[var(--accent-primary)]">Questions</span>
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Everything you need to know about interview prep with InterviewProof
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-[20px] bg-[var(--bg-card)] shadow-warm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {faq.question}
                  </span>
                  <ChevronIcon open={isOpen} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
