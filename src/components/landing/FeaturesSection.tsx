import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';
import { BlurFade } from '@/components/ui/blur-fade';
import { MagicCard } from '@/components/ui/magic-card';

const PRIMARY_FEATURES = [
  {
    title: 'Hire Zone Scoring',
    description:
      'Get a deterministic readiness score computed across 6 weighted dimensions — hard match, evidence depth, round readiness, clarity, company fit, and more.',
    preview: (
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-16 w-16 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--track-bg)" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-warning)" strokeWidth="6" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="71" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-[var(--text-primary)]">73</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 rounded-full bg-[var(--color-success)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Tech: 82</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-14 rounded-full bg-[var(--color-warning)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Evidence: 65</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-[var(--color-warning)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Readiness: 71</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Recruiter Simulation',
    description:
      'See your profile through a recruiter\'s eyes. Our AI simulates how a hiring manager would evaluate your fit — including red flags they\'d flag.',
    preview: (
      <div className="mt-4 space-y-2">
        {['Generic leadership example', 'No CI/CD pipeline experience'].map((risk) => (
          <div key={risk} className="flex items-center gap-2.5 rounded-lg bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/10 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />
            <span className="text-xs text-[var(--text-secondary)]">{risk}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const SECONDARY_FEATURES = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
    title: 'Predicted Questions',
    description: 'AI-generated questions you\'re likely to face, with probability scores.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
    title: 'Interview Coaching',
    description: 'AI coaching on how to answer using YOUR actual experience and resume.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    title: 'Personalized Study Plan',
    description: 'Prioritized action items with time estimates — highest-impact fixes first.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    title: 'Cognitive Risk Map',
    description: 'Spider chart showing your strengths and weaknesses across interview dimensions.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-[var(--bg-section-alt)]">
      <Container size="2xl">
        <div className="text-center">
          <SectionBadge label="Features" />
          <h2 className="heading-modern mt-5 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            Everything you need to ace your interview
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--text-secondary)]">
            From diagnostics to practice — a complete interview preparation platform.
          </p>
        </div>

        {/* Primary features — 2 large cards */}
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {PRIMARY_FEATURES.map((feature, i) => (
            <BlurFade key={feature.title} inView delay={i * 0.1}>
              <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-7 transition-all duration-200 hover:border-[var(--border-accent)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {feature.description}
                </p>
                {feature.preview}
              </MagicCard>
            </BlurFade>
          ))}
        </div>

        {/* Secondary features — 4 smaller cards */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SECONDARY_FEATURES.map((feature, i) => (
            <BlurFade key={feature.title} inView delay={0.2 + i * 0.08}>
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 transition-all duration-200 hover:border-[var(--border-accent)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {feature.description}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-[var(--text-muted)]">
          Built on 50+ interview rubrics from leading hiring frameworks
        </p>
      </Container>
    </section>
  );
}
