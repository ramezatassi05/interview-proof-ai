'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { HeroSection } from '@/components/landing/HeroSection';
// TrustBar removed — replaced by LiveAnalysisFeed
import { HighlightsSection } from '@/components/landing/HighlightsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { ReportPreviewShowcase } from '@/components/landing/ReportPreviewShowcase';
import { VerticalAIModelSection } from '@/components/landing/VerticalAIModelSection';
import { BenefitsRisks } from '@/components/landing/BenefitsRisks';
import { AdvantagesSection } from '@/components/landing/AdvantagesSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQ } from '@/components/landing/FAQ';
import { LiveAnalysisFeed } from '@/components/landing/LiveAnalysisFeed';
import { ScrollProgressBar } from '@/components/landing/ScrollProgressBar';
import { SectionNav } from '@/components/landing/SectionNav';
import { InsightOwlWaving } from '@/components/svg/InsightOwlMascot';
import { ShineBorder } from '@/components/ui/shine-border';
import { WaitlistForm } from '@/components/waitlist/WaitlistForm';

const WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';

function LandingPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref') || undefined;


  const ctaHref = WAITLIST_MODE ? '#' : user ? '/new' : '/auth/login?redirect=/new';

  return (
    <div className="landing-page flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />
      <ScrollProgressBar />
      <SectionNav />

      <main className="flex-1">
        {/* 1. Hero */}
        <HeroSection referralCode={referralCode} />

        {/* 2. Live Analysis Feed — scrolling diagnostics */}
        <LiveAnalysisFeed />

        {/* 3. Highlights */}
        <HighlightsSection />

        {/* 4. How It Works */}
        <HowItWorksSection />

        {/* 5. Product Showcase — animated demo */}
        <ProductShowcase />

        {/* 6. What You're Missing — bento grid */}
        <ReportPreviewShowcase
          ctaHref={ctaHref}
          ctaLabel={WAITLIST_MODE ? 'Join Waitlist' : 'Unlock Full Report'}
        />

        {/* 7. Features */}
        <FeaturesSection />

        {/* 8. Vertical AI Model — data sources */}
        <VerticalAIModelSection />

        {/* 9. Benefits vs Risks + Stats */}
        <BenefitsRisks />

        {/* 10. Why InterviewProof */}
        <AdvantagesSection />

        {/* 11. Security */}
        <SecuritySection />

        {/* 12. Pricing */}
        {!WAITLIST_MODE && <PricingSection />}

        {/* 13. FAQ */}
        <FAQ />

        {/* 13. Footer CTA */}
        <section
          id="footer-cta"
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
          <Container size="2xl" className="text-center">
            {WAITLIST_MODE && (
              <div className="mb-6 flex justify-center">
                <div className="relative flex items-center justify-center rounded-full bg-[var(--bg-elevated)]/60 p-3">
                  <ShineBorder shineColor={['#FB923C', '#F472B6', '#E879F9']} borderWidth={2} duration={10} />
                  <InsightOwlWaving size={72} />
                </div>
              </div>
            )}
            <h2 className="heading-modern text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              {WAITLIST_MODE ? 'Be First to Know' : 'Ready to Find Your Gaps?'}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)]">
              {WAITLIST_MODE
                ? 'Join the waitlist for early access. Top 100 get a lifetime 30% discount. Top 500 get 10 bonus credits.'
                : 'Get a clear, evidence-based diagnostic in minutes — plus personalized questions, coaching, and tips tailored to your resume and the role.'}
            </p>
            <div className="mt-8 flex justify-center">
              {WAITLIST_MODE ? (
                <WaitlistForm referralCode={referralCode} compact />
              ) : (
                <Link href={ctaHref}>
                  <Button variant="gradient" size="lg" rounded>
                    Start My Diagnostic
                  </Button>
                </Link>
              )}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingPageContent />
    </Suspense>
  );
}
