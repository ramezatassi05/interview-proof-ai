import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';

export const metadata: Metadata = {
  title: 'Contact Us - InterviewProof',
  description:
    'Get in touch with the InterviewProof team for support, feedback, or partnership inquiries.',
};

function ContactCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 lg:p-8">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
        {icon}
      </div>
      <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="text-sm leading-relaxed text-[var(--text-secondary)]">{children}</div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)] py-16 lg:py-24">
        <Container size="md">
          <div className="mx-auto max-w-3xl">
            <div className="mb-12 text-center">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                Contact Us
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)]">
                Have a question, feedback, or need help with your account? We&apos;re here to help.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <ContactCard
                icon={
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                }
                title="Email Support"
              >
                <p>
                  Reach us at{' '}
                  <a
                    href="mailto:ramez@interviewproof.ai"
                    className="font-medium text-[var(--accent-primary)] underline hover:no-underline"
                  >
                    ramez@interviewproof.ai
                  </a>
                </p>
                <p className="mt-2 text-[var(--text-muted)]">
                  We typically respond within 24-48 hours during business days.
                </p>
              </ContactCard>

              <ContactCard
                icon={
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                }
                title="Common Questions"
              >
                <p>
                  Check our{' '}
                  <Link
                    href="/#faq"
                    className="font-medium text-[var(--accent-primary)] underline hover:no-underline"
                  >
                    FAQ section
                  </Link>{' '}
                  for answers to the most frequently asked questions about credits, reports, and
                  account management.
                </p>
              </ContactCard>

              <ContactCard
                icon={
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                }
                title="Refunds and Billing"
              >
                <p>
                  We offer a 7-day satisfaction guarantee on all credit purchases. See our{' '}
                  <Link
                    href="/terms#refund-policy"
                    className="font-medium text-[var(--accent-primary)] underline hover:no-underline"
                  >
                    refund policy
                  </Link>{' '}
                  for details, or email us to request a refund.
                </p>
              </ContactCard>

              <ContactCard
                icon={
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
                title="Account and Privacy"
              >
                <p>
                  To request data deletion, export your data, or exercise your{' '}
                  <Link
                    href="/privacy"
                    className="font-medium text-[var(--accent-primary)] underline hover:no-underline"
                  >
                    privacy rights
                  </Link>
                  , email us with your account email and we will process your request within 30
                  days.
                </p>
              </ContactCard>
            </div>

            <div className="mt-12 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 text-center lg:p-8">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Partnerships and Business Inquiries
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Interested in enterprise plans, integrations, or partnerships? Reach out at{' '}
                <a
                  href="mailto:ramez@interviewproof.ai"
                  className="font-medium text-[var(--accent-primary)] underline hover:no-underline"
                >
                  ramez@interviewproof.ai
                </a>{' '}
                with the subject line &quot;Partnership Inquiry&quot; and we will get back to you
                promptly.
              </p>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
