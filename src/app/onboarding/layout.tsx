import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set Up Your Profile — InterviewProof',
  description: 'Personalize your interview preparation experience.',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {children}
    </div>
  );
}
