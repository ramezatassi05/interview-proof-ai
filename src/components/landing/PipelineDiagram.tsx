import { Container } from '@/components/layout/Container';

const STEPS = [
  {
    number: '01',
    title: 'Upload',
    description: 'Upload your resume and paste the job description. Takes 30 seconds.',
  },
  {
    number: '02',
    title: 'Diagnose',
    description: 'Get your readiness score, top rejection risks, and evidence mapping.',
  },
  {
    number: '03',
    title: 'Prepare',
    description: 'Get personalized interview questions, coaching tips, and a study plan — all tailored to your resume and the specific role.',
  },
];

export function PipelineDiagram() {
  return (
    <section>
      <Container className="py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl tracking-tight">
            How It Works
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-6 left-full w-full h-px bg-[var(--border-default)] -translate-y-1/2 z-0" />
              )}
              <div className="relative z-10">
                <span className="font-mono text-3xl font-bold text-[var(--accent-primary)]">
                  {step.number}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
