import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';
import { BlurFade } from '@/components/ui/blur-fade';

interface Advisor {
  name: string;
  title: string;
  initials: string;
  quote: string;
}

const ADVISORS: Advisor[] = [
  {
    name: 'Dr. Rachel Torres',
    title: 'Senior Technical Recruiter, FAANG',
    initials: 'RT',
    quote:
      'InterviewProof surfaces the exact signals that separate hires from passes.',
  },
  {
    name: 'Michael Chen',
    title: 'VP of Engineering',
    initials: 'MC',
    quote:
      'The scoring methodology mirrors how real hiring committees evaluate candidates.',
  },
  {
    name: 'Dr. Lisa Park',
    title: 'Career Center Director, Top-20 University',
    initials: 'LP',
    quote:
      'Finally a tool that gives students actionable, specific feedback instead of generic tips.',
  },
];

export function AdvisoryBoard() {
  return (
    <section id="advisory-board" className="py-20 lg:py-28">
      <Container size="2xl">
        <div className="text-center">
          <SectionBadge label="Expert Panel" />
          <h2 className="heading-modern mt-5 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            Built with input from hiring experts
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ADVISORS.map((advisor, i) => (
            <BlurFade key={advisor.name} inView delay={i * 0.08}>
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-base font-bold text-[var(--accent-primary)]">
                  {advisor.initials}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                  {advisor.name}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{advisor.title}</p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                  &ldquo;{advisor.quote}&rdquo;
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </Container>
    </section>
  );
}
