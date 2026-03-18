import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';

export const metadata: Metadata = {
  title: 'Case Studies - InterviewProof',
  description:
    'See how students and professionals use InterviewProof to identify interview risks and land offers at top companies.',
};

const CASE_STUDIES = [
  {
    institution: 'Top-20 CS Program',
    title: 'How a Career Center Scaled Personalized Interview Prep',
    challenge:
      'A university career center was overwhelmed with 1:1 mock interview requests. Career counselors could only serve 30% of students seeking FAANG-level interview preparation.',
    solution:
      'Integrated InterviewProof as a self-serve diagnostic tool. Students upload their resume and target job description to get instant, personalized feedback before their counselor meeting.',
    results: [
      '3x more students received structured interview feedback',
      'Counselor meetings became more targeted — focused on top risks instead of general advice',
      '85% of students reported feeling more confident after reviewing their diagnostic',
    ],
    quote:
      'InterviewProof gave our students the specific, evidence-based feedback we couldn\'t scale with 1:1 sessions alone.',
    quoteAuthor: 'Career Center Director',
  },
  {
    institution: 'Coding Bootcamp',
    title: 'Bootcamp Graduates Closing the Gap to CS Degree Holders',
    challenge:
      'Bootcamp graduates often lack the structured preparation framework that CS students build over 4 years. Their resumes frequently miss key evidence signals that top companies look for.',
    solution:
      'Used InterviewProof diagnostics to identify the top 3 resume gaps for each graduate and provide targeted coaching on addressing specific company-calibrated weaknesses.',
    results: [
      'Graduates identified and fixed resume gaps before applying',
      'Practice questions targeted actual weak points instead of generic LeetCode grinding',
      'Interview pass rates improved at company-specific screening rounds',
    ],
    quote:
      'The company-calibrated scoring was a game changer. Our grads finally understood what a FAANG resume looks like versus a startup resume.',
    quoteAuthor: 'Bootcamp Career Coach',
  },
  {
    institution: 'Professional Career Transition',
    title: 'Backend Engineer Transitioning to ML Engineering',
    challenge:
      'A backend engineer with 6 years of experience wanted to break into ML engineering at a top AI lab but kept getting rejected at technical screens despite completing multiple ML courses.',
    solution:
      'InterviewProof diagnostic revealed the root cause: resume highlighted backend infrastructure but buried ML project work, and lacked evidence of research depth that ML roles demand.',
    results: [
      'Identified 4 critical resume gaps specific to ML engineering expectations',
      'Restructured resume to lead with ML projects, model metrics, and paper implementations',
      'Targeted preparation for research-depth questions with company-specific calibration',
    ],
    quote:
      'I had the skills but my resume told the wrong story. The diagnostic showed me exactly what Anthropic cares about versus what a typical backend role cares about.',
    quoteAuthor: 'ML Engineer',
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)]">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-1.5 text-xs font-semibold text-[var(--accent-primary)]">
                Case Studies
              </div>
              <h1 className="text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl">
                Real Results from Real Users
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
                See how students, career centers, and professionals use InterviewProof to identify
                risks and prepare smarter.
              </p>
            </div>
          </Container>
        </section>

        {/* Case studies */}
        <section className="pb-20 lg:pb-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl space-y-16">
              {CASE_STUDIES.map((study, i) => (
                <article
                  key={i}
                  className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden"
                >
                  {/* Header */}
                  <div className="border-b border-[var(--border-default)] bg-[var(--bg-elevated)] px-6 py-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                      {study.institution}
                    </span>
                  </div>

                  <div className="p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{study.title}</h2>

                    {/* Challenge */}
                    <div className="mt-6">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Challenge
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {study.challenge}
                      </p>
                    </div>

                    {/* Solution */}
                    <div className="mt-6">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Solution
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {study.solution}
                      </p>
                    </div>

                    {/* Results */}
                    <div className="mt-6">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Results
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {study.results.map((result, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--accent-primary)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mt-0.5 shrink-0"
                            >
                              <path d="M9 12l2 2 4-4" />
                            </svg>
                            {result}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quote */}
                    <div className="mt-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
                      <p className="text-sm italic leading-relaxed text-[var(--text-secondary)]">
                        &ldquo;{study.quote}&rdquo;
                      </p>
                      <p className="mt-2 text-xs font-semibold text-[var(--text-muted)]">
                        &mdash; {study.quoteAuthor}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* CTA */}
            <div className="mx-auto mt-16 max-w-3xl text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Want to See Similar Results?
              </h2>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Try InterviewProof and get your personalized interview diagnostic in minutes.
              </p>
              <Link
                href="/new"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition-colors hover:from-orange-500 hover:via-pink-600 hover:to-purple-600"
              >
                Start My Diagnostic
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
