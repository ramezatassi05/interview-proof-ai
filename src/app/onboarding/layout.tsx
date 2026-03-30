import type { ReactNode } from 'react';

export const metadata = {
  title: 'Get Started | InterviewProof',
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="light" className="min-h-screen bg-white">
      {children}
    </div>
  );
}
