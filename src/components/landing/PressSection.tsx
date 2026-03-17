import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';
import { BlurFade } from '@/components/ui/blur-fade';

const METHODOLOGY_BADGES = [
  'Evidence-Based Scoring',
  'Deterministic AI Pipeline',
  'Recruiter-Validated Rubrics',
  'Company-Calibrated Difficulty',
];

const PRESS_MENTIONS = [
  { name: 'TechCrunch', status: 'coming-soon' },
  { name: 'Product Hunt', status: 'coming-soon' },
  { name: 'Hacker News', status: 'coming-soon' },
  { name: 'The Hustle', status: 'coming-soon' },
  { name: 'Ben\'s Bites', status: 'coming-soon' },
];

export function PressSection() {
  return (
    <section id="press" className="py-20 lg:py-28">
      <Container size="2xl">
        <div className="text-center">
          <SectionBadge label="Recognition" />
          <h2 className="heading-modern mt-5 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            Built on a proven methodology
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--text-secondary)]">
            Our diagnostic pipeline is grounded in real hiring rubrics, recruiter playbooks, and
            structured evaluation criteria used at top companies.
          </p>
        </div>

        {/* Methodology badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {METHODOLOGY_BADGES.map((badge, i) => (
            <BlurFade key={badge} inView delay={i * 0.06}>
              <div className="flex items-center gap-2 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 px-4 py-2 text-sm font-medium text-[var(--accent-primary)]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {badge}
              </div>
            </BlurFade>
          ))}
        </div>

        {/* Press mention placeholders */}
        <div className="mt-14">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            As seen in
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {PRESS_MENTIONS.map((mention, i) => (
              <BlurFade key={mention.name} inView delay={0.3 + i * 0.06}>
                <div className="text-lg font-bold tracking-tight text-[var(--text-muted)]/40 transition-colors duration-200 hover:text-[var(--text-muted)]/60">
                  {mention.name}
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
