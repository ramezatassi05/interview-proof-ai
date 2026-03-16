import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';
import { BlurFade } from '@/components/ui/blur-fade';

const UNIVERSITIES = [
  'Stanford',
  'MIT',
  'Carnegie Mellon',
  'UC Berkeley',
  'Georgia Tech',
  'University of Waterloo',
];

export function InstitutionalTrust() {
  return (
    <section id="institutional-trust" className="py-20 lg:py-28">
      <Container size="2xl">
        <div className="text-center">
          <SectionBadge label="Community" />
          <h2 className="heading-modern mt-5 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            Trusted by candidates from leading universities
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--text-secondary)]">
            Students and graduates preparing for roles at top tech companies
          </p>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
          {UNIVERSITIES.map((name, i) => (
            <BlurFade key={name} inView delay={i * 0.06}>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-6 py-3 text-sm font-medium text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--border-accent)] hover:text-[var(--text-secondary)]">
                {name}
              </div>
            </BlurFade>
          ))}
        </div>
      </Container>
    </section>
  );
}
