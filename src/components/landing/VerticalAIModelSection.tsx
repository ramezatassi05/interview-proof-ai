import { Container } from '@/components/layout/Container';
import { InsightOwlMascot } from '@/components/svg/InsightOwlMascot';

const DATA_SOURCES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
        />
      </svg>
    ),
    title: 'Open-Source Prep Repos',
    description:
      'Curated from top GitHub interview prep repositories — real questions, real patterns, real frameworks used by FAANG engineers.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
        />
      </svg>
    ),
    title: 'Hiring Rubrics & Frameworks',
    description:
      '50+ structured hiring rubrics modeled on how real recruiters and hiring managers evaluate candidates at every level.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
        />
      </svg>
    ),
    title: 'Role-Specific Intelligence',
    description:
      'Tailored by role, seniority, and domain. A senior backend engineer gets a different analysis than a product manager.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
        />
      </svg>
    ),
    title: 'Behavioral & STAR Libraries',
    description:
      'Comprehensive behavioral question frameworks and STAR method templates — so you never blank on "tell me about a time..."',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
        />
      </svg>
    ),
    title: 'Proprietary Analysis Engine',
    description:
      'Deterministic scoring engine with weighted dimensions — no LLM hallucination, just reproducible, evidence-based scores.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
    ),
    title: 'Continuously Updated',
    description:
      'New interview data, rubrics, and question patterns are regularly ingested to keep your diagnostic current and accurate.',
  },
];

export function VerticalAIModelSection() {
  return (
    <section
      className="py-20 lg:py-28 bg-[var(--bg-dark-band)]"
      style={
        {
          '--text-primary': 'var(--text-dark-band-primary)',
          '--text-secondary': 'var(--text-dark-band-secondary)',
          '--text-muted': 'var(--text-dark-band-secondary)',
          '--bg-card': 'var(--bg-dark-band-card)',
          '--bg-elevated': 'var(--bg-dark-band-card)',
          '--border-default': 'var(--border-dark-band)',
        } as React.CSSProperties
      }
    >
      <Container size="2xl">
        <div className="flex flex-col items-center text-center">
          {/* Owl mascot */}
          <div className="flex items-center justify-center rounded-full bg-[var(--accent-primary)]/10 p-3">
            <InsightOwlMascot size={48} />
          </div>

          {/* Code-style badge */}
          <span className="mt-5 inline-block rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1 font-mono text-xs text-[var(--text-secondary)]">
            Vertical AI Model
          </span>

          <h2 className="heading-modern mt-5 max-w-3xl text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            Trained on the Best Interview Intelligence Available
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--text-secondary)]">
            Unlike generic AI tools, InterviewProof is a vertical model purpose-built for interview
            readiness — trained on real rubrics, recruiter playbooks, and thousands of interview
            patterns across roles and industries.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DATA_SOURCES.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-7 transition-all duration-200 hover:border-[var(--border-accent)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                {item.icon}
              </div>
              <h3 className="mt-5 text-base font-semibold text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
