'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'What is InterviewProof?',
    answer:
      'InterviewProof is an interview intelligence platform that analyzes your resume against a specific job description to diagnose your exact rejection risks, score your readiness, and give you personalized interview questions, coaching, and tips — all tailored to your resume and the role.',
  },
  {
    question: 'How long does a diagnostic take?',
    answer:
      "About 60 seconds. Upload your resume, paste the job description, and you'll get your readiness score, top rejection risks, and a prioritized study plan almost instantly.",
  },
  {
    question: 'How accurate is the analysis?',
    answer:
      'Our scoring engine uses structured rubrics modeled on real hiring criteria across 6 dimensions. It cross-references your resume evidence against the job requirements to surface concrete gaps \u2014 not generic advice.',
  },
  {
    question: 'Do I need a credit card for the free preview?',
    answer:
      'No. You can run a diagnostic and see your readiness score, risk band, and top gaps for free. The full diagnostic with detailed breakdowns, recruiter simulation, and practice questions is a one-time $15 unlock per report.',
  },
  {
    question: "What's the difference between the free preview and the full diagnostic?",
    answer:
      'The free preview gives you your overall readiness score and risk band. The full diagnostic unlocks detailed scoring breakdowns, evidence-backed rejection risks, a recruiter simulation, personalized interview questions with coaching on how to answer them, targeted tips, a study plan, and practice intelligence tools.',
  },
  {
    question: 'What types of interviews does it support?',
    answer:
      'InterviewProof supports technical, behavioral, case, finance, and research/ML interview rounds. The analysis adapts its scoring dimensions and rubrics based on the round type and the specific role requirements.',
  },
  {
    question: 'What if I get a low readiness score?',
    answer:
      "That's exactly the point \u2014 better to find out now than in the interview. Your diagnostic includes a prioritized action plan showing the highest-impact fixes first, with estimated time to complete each one.",
  },
  {
    question: 'How does InterviewProof compare to mock interviews or coaching?',
    answer:
      'Mock interviews and coaching are valuable but expensive and time-consuming. InterviewProof gives you a data-driven baseline in 60 seconds, plus personalized interview questions, AI coaching on how to answer them using your experience, and targeted tips — so you know exactly where to focus and how to improve. Use it before coaching to make every session count, or on its own for fast, targeted prep.',
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
      className={`flex-shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 lg:py-28">
      <Container size="2xl">
        <div className="flex flex-col items-center text-center">
          <SectionBadge label="FAQ" />
          <h2 className="heading-modern mt-5 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-[var(--text-secondary)]">
            Everything you need to know about interview prep with InterviewProof
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] transition-colors duration-150 hover:border-[var(--border-accent)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {faq.question}
                  </span>
                  <ChevronIcon open={isOpen} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5">
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
