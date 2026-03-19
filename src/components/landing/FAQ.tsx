'use client';

import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';
import { BlurFade } from '@/components/ui/blur-fade';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

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
    question: 'Is InterviewProof free?',
    answer:
      'Yes. InterviewProof is completely free. Run a diagnostic, see your full readiness score, risk band, detailed scoring breakdowns, rejection risks, recruiter simulation, personalized interview questions with coaching, targeted tips, a study plan, and practice intelligence tools — all at no cost.',
  },
  {
    question: 'What types of interviews does it support?',
    answer:
      'InterviewProof supports technical, behavioral, and research/ML interview rounds. The analysis adapts its scoring dimensions and rubrics based on the round type and the specific role requirements.',
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

export function FAQ() {
  return (
    <section id="faq" className="py-20 lg:py-28 bg-[var(--bg-section-alt)]">
      <Container size="2xl">
        <BlurFade inView>
          <div className="flex flex-col items-center text-center">
            <SectionBadge label="FAQ" />
            <h2 className="heading-modern mt-5 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-base text-[var(--text-secondary)]">
              Everything you need to know about interview prep with InterviewProof
            </p>
          </div>
        </BlurFade>

        <BlurFade inView delay={0.15}>
          <div className="mx-auto mt-12 max-w-2xl">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </BlurFade>
      </Container>
    </section>
  );
}
