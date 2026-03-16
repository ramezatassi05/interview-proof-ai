import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';

export const metadata: Metadata = {
  title: 'About - InterviewProof',
  description:
    'Learn about InterviewProof, our mission, and the founder behind the evidence-based interview diagnostic platform.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)]">
        {/* Hero / Mission Statement */}
        <section className="py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-1.5 text-xs font-semibold text-[var(--accent-primary)]">
                Our Mission
              </div>
              <h1 className="text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl">
                Interview prep should be{' '}
                <span className="text-[var(--accent-primary)]">evidence-based</span>, not
                guesswork.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
                InterviewProof exists to close the gap between how people prepare for interviews and
                what actually gets them hired. We believe every candidate deserves to know exactly
                where they stand before walking into a room.
              </p>
            </div>
          </Container>
        </section>

        {/* Founder Story */}
        <section className="bg-[var(--bg-section-alt)] py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                The Founder
              </h2>
              <div className="mt-8 space-y-6 text-base leading-relaxed text-[var(--text-secondary)]">
                <p>
                  Hi, I&apos;m{' '}
                  <span className="font-semibold text-[var(--text-primary)]">Ramez Atassi</span>.
                  I&apos;m a software engineer who has spent years on both sides of the interview
                  table -- as a candidate navigating the frustrating opacity of hiring processes, and
                  as someone who understands how technology can surface patterns humans miss.
                </p>
                <p>
                  I built InterviewProof because I experienced firsthand the frustration of unclear
                  interview feedback. You spend weeks preparing, walk into the interview feeling
                  ready, get rejected, and receive a vague one-liner like &quot;we decided to move
                  forward with other candidates.&quot; No specifics. No actionable takeaways.
                  Nothing that helps you do better next time.
                </p>
                <p>
                  The worst part? The gaps that cost you the offer were often things you could have
                  fixed in a weekend -- if only someone had pointed them out before the interview,
                  not after.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Why I Built This */}
        <section className="py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                Why I Built This
              </h2>
              <div className="mt-8 space-y-6 text-base leading-relaxed text-[var(--text-secondary)]">
                <p>
                  Generic interview prep tools tell you to &quot;practice your STAR method&quot; and
                  &quot;research the company.&quot; That&apos;s table stakes. What they don&apos;t
                  tell you is which specific skills the role demands that your resume fails to
                  demonstrate, which questions will expose your weakest areas, or how a recruiter at
                  that specific company tier will actually evaluate your profile.
                </p>
                <p>
                  InterviewProof bridges that gap. Instead of generic advice, it analyzes your
                  resume against the actual job description, cross-references real hiring rubrics and
                  recruiter playbooks, and identifies the exact rejection risks you need to address.
                  The scoring is deterministic -- calculated by code, not hallucinated by an AI. The
                  analysis is evidence-backed, citing specific gaps between what you claim and what
                  the role requires.
                </p>
                <p>
                  The result is a diagnostic that tells you what will actually sink you, ranked by
                  severity, with a clear path to fix each issue before your interview.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Solo Founder Transparency */}
        <section className="bg-[var(--bg-section-alt)] py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                Transparency
              </h2>
              <div className="mt-8 space-y-6 text-base leading-relaxed text-[var(--text-secondary)]">
                <p>
                  InterviewProof is a solo-founder product. I design it, build it, and support it.
                  That means every feature ships because it solves a real problem, not because a
                  committee approved it. It also means I&apos;m directly accountable for the
                  quality of every diagnostic you receive.
                </p>
                <p>
                  I believe in building in the open. The methodology is transparent -- you can read
                  exactly how the scoring works on our{' '}
                  <Link
                    href="/methodology"
                    className="font-medium text-[var(--accent-primary)] underline underline-offset-2 hover:text-[var(--accent-secondary)]"
                  >
                    methodology page
                  </Link>
                  . The AI analyzes; the code scores. No black boxes, no mystery algorithms.
                </p>
                <p>
                  If you have feedback, questions, or ideas, I read every message. This product gets
                  better because of the people who use it.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                Ready to find your gaps?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
                Upload your resume and a job description. In minutes, you&apos;ll know exactly what
                could cost you the offer -- and how to fix it.
              </p>
              <div className="mt-8">
                <Link
                  href="/new"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-pink-500/25 transition-colors hover:from-orange-500 hover:via-pink-600 hover:to-purple-600"
                >
                  Start My Diagnostic
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
