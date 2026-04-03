'use client';

import { OnboardingDialog } from '@/components/ui/onboarding-dialog';
import type { OnboardingSlide } from '@/components/ui/onboarding-dialog';
import { useDashboardWalkthrough } from '@/hooks/useDashboardWalkthrough';
import {
  InsightOwlWaving,
  InsightOwlReading,
  InsightOwlProfessional,
  InsightOwlThinking,
  InsightOwlAnalyzing,
  InsightOwlCelebrating,
  InsightOwlMascot,
} from '@/components/svg/InsightOwlMascot';

const WALKTHROUGH_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Your Interview Diagnostic',
    description:
      "Welcome to your full analysis report! I'll walk you through each section so you know exactly how to use these insights to ace your interview.",
    icon: <InsightOwlWaving size={120} />,
  },
  {
    id: 'hero-dashboard',
    title: 'Your Readiness Score',
    description:
      'The hero dashboard shows your overall readiness score, conversion likelihood, technical fit, and hire zone — a snapshot of where you stand right now.',
    icon: <InsightOwlAnalyzing size={120} />,
  },
  {
    id: 'analysis-tab',
    title: 'Analysis Tab — Red Flags & Strengths',
    description:
      'Start here. See every red flag a recruiter might catch, your strengths vs. risks, competency heatmap, and signal strength breakdown.',
    icon: <InsightOwlReading size={120} />,
  },
  {
    id: 'practice-tab',
    title: 'Practice Tab — Questions & Study Plan',
    description:
      'Company-specific practice questions with AI feedback, plus a personalized study roadmap prioritized by your gap areas.',
    icon: <InsightOwlThinking size={120} />,
  },
  {
    id: 'strategy-tab',
    title: 'Strategy Tab — Coaching & Actions',
    description:
      'Your priority actions ranked by impact, deep coaching insights, round forecasts, and a cognitive risk map of your blind spots.',
    icon: <InsightOwlProfessional size={120} />,
  },
  {
    id: 'insights-tab',
    title: 'Insights Tab — Recruiter View',
    description:
      "See yourself through a recruiter's eyes. The AI simulates how your profile would be evaluated, plus an executive summary of your candidacy.",
    icon: <InsightOwlMascot size={120} />,
  },
  {
    id: 'toolbar',
    title: 'Share, Export & Re-Analyze',
    description:
      'Use the toolbar to share your report, download a PDF, or re-run the analysis after making improvements. You get up to 2 runs per report.',
    icon: <InsightOwlAnalyzing size={120} />,
  },
  {
    id: 'ready',
    title: "You're Ready to Dive In!",
    description:
      'Start with the Analysis tab to understand your gaps, then build a game plan in Strategy. You can replay this tour anytime.',
    icon: <InsightOwlCelebrating size={120} />,
  },
];

interface DiagnosticWalkthroughProps {
  open: boolean;
  onClose: () => void;
}

export function DiagnosticWalkthrough({ open, onClose }: DiagnosticWalkthroughProps) {
  return (
    <OnboardingDialog
      slides={WALKTHROUGH_SLIDES}
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      onComplete={onClose}
      lastButtonText="Start Exploring"
    />
  );
}

export { useDashboardWalkthrough as useDiagnosticWalkthrough };
