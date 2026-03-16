import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';

export const metadata: Metadata = {
  title: 'Privacy Policy - InterviewProof',
  description:
    'How InterviewProof collects, uses, and protects your personal data. GDPR and CCPA compliant.',
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 mb-4 text-xl font-bold text-[var(--text-primary)]">{children}</h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-6 mb-2 text-base font-semibold text-[var(--text-primary)]">{children}</h3>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)] py-16 lg:py-24">
        <Container size="md">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Last updated: March 15, 2026
            </p>

            <div className="mt-8 space-y-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              <p>
                InterviewProof AI (&quot;InterviewProof,&quot; &quot;we,&quot; &quot;us,&quot; or
                &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you use
                our web application at interviewproof.ai (the &quot;Service&quot;).
              </p>

              <SectionHeading>1. Information We Collect</SectionHeading>

              <SubHeading>Account Information</SubHeading>
              <p>
                When you create an account, we collect your email address and authentication
                credentials. If you sign in via Google or GitHub OAuth, we receive your name, email
                address, and profile picture from those providers.
              </p>

              <SubHeading>Uploaded Content</SubHeading>
              <p>
                To provide our diagnostic service, you upload your resume and job description text.
                This content is processed to generate your interview readiness report and is stored
                securely in our database.
              </p>

              <SubHeading>Payment Information</SubHeading>
              <p>
                Payment processing is handled entirely by{' '}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-primary)] underline hover:no-underline"
                >
                  Stripe
                </a>
                . We do not store your credit card number, CVV, or full billing details on our
                servers. We receive a transaction ID and confirmation of payment from Stripe.
              </p>

              <SubHeading>Usage Data</SubHeading>
              <p>
                We collect anonymized usage data including pages visited, features used, and general
                interaction patterns to improve the Service. We use Vercel Analytics for this
                purpose, which does not use cookies and does not track personally identifiable
                information.
              </p>

              <SectionHeading>2. How We Use Your Information</SectionHeading>
              <ul className="ml-5 list-disc space-y-2">
                <li>
                  <strong>Providing the Service:</strong> Your resume and job description are
                  processed by our AI analysis pipeline to generate interview diagnostics, risk
                  assessments, and personalized recommendations.
                </li>
                <li>
                  <strong>AI Processing:</strong> We use OpenAI and Anthropic (Claude) APIs to
                  analyze your uploaded content. Your data is sent to these providers solely for
                  the purpose of generating your report. Neither OpenAI nor Anthropic retains your
                  data for training purposes under our enterprise agreements.
                </li>
                <li>
                  <strong>Account Management:</strong> To authenticate you, manage your credits
                  balance, and provide access to your reports.
                </li>
                <li>
                  <strong>Communication:</strong> To send transactional emails related to your
                  account (e.g., magic link sign-in, purchase confirmations).
                </li>
                <li>
                  <strong>Improvement:</strong> To analyze aggregate, anonymized usage patterns to
                  improve our scoring algorithms and user experience.
                </li>
              </ul>

              <SectionHeading>3. Data Storage and Security</SectionHeading>
              <p>
                Your data is stored in a{' '}
                <a
                  href="https://supabase.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-primary)] underline hover:no-underline"
                >
                  Supabase
                </a>
                -hosted PostgreSQL database with Row Level Security (RLS) enabled, ensuring that
                users can only access their own data. All data is encrypted at rest and in transit
                using TLS 1.2+.
              </p>
              <p className="mt-3">
                We implement industry-standard security measures including:
              </p>
              <ul className="ml-5 mt-2 list-disc space-y-2">
                <li>Row Level Security policies on all database tables</li>
                <li>Encrypted connections (HTTPS/TLS) for all data in transit</li>
                <li>Secure, httpOnly session cookies</li>
                <li>Environment variable isolation for API keys and secrets</li>
                <li>Regular dependency audits and security updates</li>
              </ul>

              <SectionHeading>4. Third-Party Services</SectionHeading>
              <p>We share data with the following third-party services only as necessary:</p>
              <ul className="ml-5 mt-2 list-disc space-y-2">
                <li>
                  <strong>Supabase:</strong> Database hosting, authentication, and storage.
                </li>
                <li>
                  <strong>Stripe:</strong> Payment processing and subscription management.
                </li>
                <li>
                  <strong>OpenAI:</strong> Resume/JD extraction, practice question generation, and
                  embedding computation.
                </li>
                <li>
                  <strong>Anthropic (Claude):</strong> Primary analysis engine for generating
                  diagnostic reports.
                </li>
                <li>
                  <strong>Vercel:</strong> Application hosting and anonymized analytics.
                </li>
              </ul>

              <SectionHeading>5. Data Retention</SectionHeading>
              <p>
                We retain your account data and reports for as long as your account is active. You
                may request deletion of your account and all associated data at any time by
                contacting us at{' '}
                <a
                  href="mailto:ramez@interviewproof.ai"
                  className="text-[var(--accent-primary)] underline hover:no-underline"
                >
                  ramez@interviewproof.ai
                </a>
                . Upon account deletion, we will remove your personal data within 30 days, except
                where retention is required by law.
              </p>

              <SectionHeading>6. Cookies</SectionHeading>
              <p>
                InterviewProof uses minimal cookies strictly necessary for the Service to function:
              </p>
              <ul className="ml-5 mt-2 list-disc space-y-2">
                <li>
                  <strong>Authentication cookies:</strong> Secure session cookies managed by
                  Supabase Auth to keep you signed in.
                </li>
                <li>
                  <strong>Theme preference:</strong> A localStorage entry (not a cookie) to
                  remember your dark/light mode selection.
                </li>
              </ul>
              <p className="mt-3">
                We do not use advertising cookies, tracking pixels, or third-party analytics
                cookies.
              </p>

              <SectionHeading>7. Your Rights (GDPR / CCPA / PIPEDA)</SectionHeading>
              <p>
                Depending on your jurisdiction, you may have the following rights regarding your
                personal data:
              </p>

              <SubHeading>Under GDPR (European Economic Area)</SubHeading>
              <ul className="ml-5 list-disc space-y-2">
                <li>
                  <strong>Right of Access:</strong> Request a copy of the personal data we hold
                  about you.
                </li>
                <li>
                  <strong>Right to Rectification:</strong> Request correction of inaccurate data.
                </li>
                <li>
                  <strong>Right to Erasure:</strong> Request deletion of your personal data.
                </li>
                <li>
                  <strong>Right to Data Portability:</strong> Receive your data in a structured,
                  machine-readable format.
                </li>
                <li>
                  <strong>Right to Object:</strong> Object to processing of your data for certain
                  purposes.
                </li>
              </ul>

              <SubHeading>Under CCPA (California)</SubHeading>
              <ul className="ml-5 list-disc space-y-2">
                <li>
                  <strong>Right to Know:</strong> Request disclosure of the categories and specific
                  pieces of personal information collected.
                </li>
                <li>
                  <strong>Right to Delete:</strong> Request deletion of personal information.
                </li>
                <li>
                  <strong>Right to Opt-Out:</strong> We do not sell your personal information.
                </li>
                <li>
                  <strong>Right to Non-Discrimination:</strong> You will not be discriminated
                  against for exercising your privacy rights.
                </li>
              </ul>

              <SubHeading>Under PIPEDA (Canada)</SubHeading>
              <ul className="ml-5 list-disc space-y-2">
                <li>
                  <strong>Right of Access:</strong> Request access to the personal information we
                  hold about you.
                </li>
                <li>
                  <strong>Right to Correction:</strong> Request correction of inaccurate or
                  incomplete personal information.
                </li>
                <li>
                  <strong>Right to Withdraw Consent:</strong> Withdraw your consent for the
                  collection, use, or disclosure of your personal information, subject to legal or
                  contractual restrictions.
                </li>
                <li>
                  <strong>Right to Complain:</strong> File a complaint with the Office of the
                  Privacy Commissioner of Canada if you believe your privacy rights have been
                  violated.
                </li>
              </ul>

              <p className="mt-4">
                To exercise any of these rights, contact us at{' '}
                <a
                  href="mailto:ramez@interviewproof.ai"
                  className="text-[var(--accent-primary)] underline hover:no-underline"
                >
                  ramez@interviewproof.ai
                </a>
                . We will respond within 30 days.
              </p>

              <SectionHeading>8. Children&apos;s Privacy</SectionHeading>
              <p>
                The Service is not intended for individuals under the age of 16. We do not
                knowingly collect personal data from children. If you believe a child has provided
                us with personal data, please contact us and we will promptly delete it.
              </p>

              <SectionHeading>9. Changes to This Policy</SectionHeading>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of
                material changes by posting the updated policy on this page and updating the
                &quot;Last updated&quot; date. Your continued use of the Service after any changes
                constitutes acceptance of the revised policy.
              </p>

              <SectionHeading>10. Contact Us</SectionHeading>
              <p>
                If you have questions or concerns about this Privacy Policy or our data practices,
                please contact us:
              </p>
              <ul className="ml-5 mt-2 list-disc space-y-2">
                <li>
                  Email:{' '}
                  <a
                    href="mailto:ramez@interviewproof.ai"
                    className="text-[var(--accent-primary)] underline hover:no-underline"
                  >
                    ramez@interviewproof.ai
                  </a>
                </li>
                <li>
                  Contact page:{' '}
                  <Link
                    href="/contact"
                    className="text-[var(--accent-primary)] underline hover:no-underline"
                  >
                    interviewproof.ai/contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
