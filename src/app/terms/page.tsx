import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';

export const metadata: Metadata = {
  title: 'Terms of Service - InterviewProof',
  description:
    'Terms and conditions governing use of the InterviewProof interview diagnostic service.',
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 mb-4 text-xl font-bold text-[var(--text-primary)]">{children}</h2>
  );
}

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)] py-16 lg:py-24">
        <Container size="md">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Last updated: March 15, 2026
            </p>

            <div className="mt-8 space-y-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              <p>
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of the
                InterviewProof web application at interviewproof.ai (the &quot;Service&quot;),
                operated by InterviewProof AI (&quot;InterviewProof,&quot; &quot;we,&quot;
                &quot;us,&quot; or &quot;our&quot;). By creating an account or using the Service,
                you agree to be bound by these Terms. If you do not agree, do not use the Service.
              </p>

              <SectionHeading>1. Account Registration</SectionHeading>
              <p>
                To use certain features of the Service, you must create an account using a valid
                email address or through Google/GitHub OAuth. You are responsible for:
              </p>
              <ul className="ml-5 mt-2 list-disc space-y-2">
                <li>Providing accurate and complete registration information</li>
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="mt-3">
                You must be at least 16 years old to create an account and use the Service.
              </p>

              <SectionHeading>2. Credits System and Payments</SectionHeading>
              <p>
                InterviewProof uses a credits-based system. Credits are required to unlock full
                diagnostic reports.
              </p>
              <ul className="ml-5 mt-2 list-disc space-y-2">
                <li>
                  <strong>Purchasing credits:</strong> Credits are available for purchase in bundles
                  through our secure Stripe checkout. All prices are displayed in USD and are
                  inclusive of applicable taxes unless stated otherwise.
                </li>
                <li>
                  <strong>Credit expiration:</strong> Purchased credits do not expire.
                </li>
                <li>
                  <strong>Bonus credits:</strong> We may grant bonus credits for certain actions
                  (e.g., uploading your first resume, referring friends). Bonus credit programs may
                  be modified or discontinued at any time.
                </li>
                <li>
                  <strong>Non-transferable:</strong> Credits are tied to your account and cannot be
                  transferred, sold, or exchanged for cash.
                </li>
                <li>
                  <strong>Report unlocking:</strong> Each full diagnostic report costs 5 credits to
                  unlock. Once unlocked, a report remains accessible indefinitely.
                </li>
              </ul>

              <SectionHeading>3. AI-Generated Content Disclaimer</SectionHeading>
              <p>
                The Service uses artificial intelligence (including OpenAI and Anthropic Claude
                models) to analyze your resume and job description and generate diagnostic reports.
                You acknowledge and agree that:
              </p>
              <ul className="ml-5 mt-2 list-disc space-y-2">
                <li>
                  AI-generated analysis, scores, recommendations, and practice questions are
                  provided for informational and educational purposes only.
                </li>
                <li>
                  AI output may contain inaccuracies, incomplete assessments, or generalized
                  guidance that may not apply to your specific situation.
                </li>
                <li>
                  InterviewProof does not guarantee any specific interview outcome, job offer, or
                  career result based on the use of our reports.
                </li>
                <li>
                  The diagnostic scores are computed deterministically by our scoring engine based
                  on AI-extracted data. While we strive for accuracy, scores should be treated as
                  directional guidance, not absolute assessments.
                </li>
                <li>
                  You should use our reports as one of many resources in your interview preparation
                  and exercise your own judgment.
                </li>
              </ul>

              <SectionHeading>4. Acceptable Use</SectionHeading>
              <p>You agree not to:</p>
              <ul className="ml-5 mt-2 list-disc space-y-2">
                <li>
                  Use the Service for any unlawful purpose or in violation of any applicable laws
                </li>
                <li>Upload content that is false, misleading, defamatory, or infringing</li>
                <li>
                  Attempt to reverse-engineer, decompile, or extract our scoring algorithms or AI
                  prompts
                </li>
                <li>
                  Use automated tools (bots, scrapers) to access or interact with the Service
                  without our written consent
                </li>
                <li>
                  Resell, redistribute, or commercially exploit reports generated by the Service
                </li>
                <li>
                  Impersonate another person or entity, or misrepresent your affiliation
                </li>
                <li>
                  Attempt to circumvent the credits system or payment requirements
                </li>
              </ul>

              <SectionHeading>5. Intellectual Property</SectionHeading>
              <p>
                <strong>Our IP:</strong> The Service, including its design, scoring algorithms, AI
                prompts, code, logos, and branding, is owned by InterviewProof AI and protected by
                intellectual property laws. You may not copy, modify, distribute, or create
                derivative works without our written permission.
              </p>
              <p className="mt-3">
                <strong>Your Content:</strong> You retain ownership of the resume and job
                description content you upload. By uploading content, you grant us a limited,
                non-exclusive license to process it solely for the purpose of providing the
                Service. We do not claim ownership of your uploaded materials.
              </p>
              <p className="mt-3">
                <strong>Report Content:</strong> The diagnostic reports generated by the Service
                are licensed to you for personal, non-commercial use. You may share reports using
                our built-in sharing feature but may not sell or redistribute them commercially.
              </p>

              <SectionHeading>6. Refund Policy</SectionHeading>
              <p>
                We offer a <strong>7-day satisfaction guarantee</strong> on credit purchases. If
                you are not satisfied with the Service, you may request a full refund within 7 days
                of your purchase, provided:
              </p>
              <ul className="ml-5 mt-2 list-disc space-y-2">
                <li>The request is made within 7 calendar days of the purchase date</li>
                <li>
                  You have unlocked no more than 1 report using the purchased credits
                </li>
                <li>
                  You contact us at{' '}
                  <a
                    href="mailto:ramez@interviewproof.ai"
                    className="text-[var(--accent-primary)] underline hover:no-underline"
                  >
                    ramez@interviewproof.ai
                  </a>{' '}
                  with your purchase details
                </li>
              </ul>
              <p className="mt-3">
                Refunds are processed back to the original payment method within 5-10 business
                days. Bonus credits granted alongside a refunded purchase will be deducted from
                your balance.
              </p>

              <SectionHeading>7. Limitation of Liability</SectionHeading>
              <p>
                To the maximum extent permitted by applicable law, InterviewProof AI shall not be
                liable for any indirect, incidental, special, consequential, or punitive damages,
                including but not limited to:
              </p>
              <ul className="ml-5 mt-2 list-disc space-y-2">
                <li>Loss of profits, revenue, or anticipated savings</li>
                <li>Loss of data or business interruption</li>
                <li>
                  Damages arising from reliance on AI-generated content or recommendations
                </li>
                <li>
                  Failure to obtain a job offer, interview, or any specific career outcome
                </li>
              </ul>
              <p className="mt-3">
                Our total aggregate liability for any claims arising from or related to the Service
                shall not exceed the amount you paid to InterviewProof in the 12 months preceding
                the claim.
              </p>

              <SectionHeading>8. Disclaimer of Warranties</SectionHeading>
              <p>
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without
                warranties of any kind, whether express, implied, or statutory. We disclaim all
                warranties, including but not limited to implied warranties of merchantability,
                fitness for a particular purpose, accuracy, and non-infringement.
              </p>
              <p className="mt-3">
                We do not warrant that the Service will be uninterrupted, error-free, or secure, or
                that any defects will be corrected.
              </p>

              <SectionHeading>9. Termination</SectionHeading>
              <p>
                We may suspend or terminate your access to the Service at any time, with or without
                cause, including for violation of these Terms. Upon termination:
              </p>
              <ul className="ml-5 mt-2 list-disc space-y-2">
                <li>Your right to use the Service will immediately cease</li>
                <li>
                  Unused credits may be forfeited, except where a refund is required by law
                </li>
                <li>
                  We may delete your account data in accordance with our{' '}
                  <Link
                    href="/privacy"
                    className="text-[var(--accent-primary)] underline hover:no-underline"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
              <p className="mt-3">
                You may delete your account at any time by contacting{' '}
                <a
                  href="mailto:ramez@interviewproof.ai"
                  className="text-[var(--accent-primary)] underline hover:no-underline"
                >
                  ramez@interviewproof.ai
                </a>
                .
              </p>

              <SectionHeading>10. Governing Law</SectionHeading>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of
                Canada and the Province of Ontario, without regard to conflict of law provisions.
                Any disputes arising from these Terms or the Service shall be resolved in the
                courts of the Province of Ontario, Canada.
              </p>

              <SectionHeading>11. Changes to These Terms</SectionHeading>
              <p>
                We may update these Terms from time to time. We will notify you of material changes
                by posting the updated Terms on this page and updating the &quot;Last
                updated&quot; date. Your continued use of the Service after changes are posted
                constitutes acceptance of the revised Terms.
              </p>

              <SectionHeading>12. Contact Us</SectionHeading>
              <p>
                If you have questions about these Terms, please contact us:
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
