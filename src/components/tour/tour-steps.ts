import type { TourStep } from './types';

export const TOUR_STEPS: TourStep[] = [
  // ── Auto sequence (first 2 only) ──
  {
    id: 'readiness-score',
    target: '[data-tour-step="readiness-score"]',
    title: 'Your Readiness Score',
    description:
      'This is your overall interview readiness — a single number showing how prepared you are. Use it as your north star: anything below 60 means there are critical gaps to address before your interview.',
    mascot: 'waving',
    placement: 'right',
    trigger: { type: 'auto', delay: 800 },
  },
  {
    id: 'metric-cards',
    target: '[data-tour-step="metric-cards"]',
    title: 'Key Performance Metrics',
    description:
      'Three metrics that matter most: Conversion Likelihood (your odds of advancing), Technical Fit (how well your skills match), and Hire Zone (where you fall vs. the hiring bar). Focus on the lowest one first.',
    mascot: 'analyzing',
    placement: 'bottom',
    trigger: { type: 'auto' },
  },

  // ── Interaction-driven (shown when user clicks/scrolls to each section) ──
  {
    id: 'risk-snapshot',
    target: '[data-tour-step="risk-snapshot"]',
    title: 'Risk Count',
    description:
      'A quick count of red flags a recruiter might catch. Click "View in Analysis" to see each one ranked by severity — fix the critical ones first for the biggest score improvement.',
    mascot: 'reading',
    placement: 'bottom',
    trigger: { type: 'scroll-into-view' },
  },
  {
    id: 'priority-action',
    target: '[data-tour-step="priority-action"]',
    title: 'Your #1 Priority',
    description:
      'This is the single highest-impact action you can take right now. It\'s ranked by how much it will move your score. Click "Go to Strategy" for a full action plan with resources.',
    mascot: 'professional',
    placement: 'top',
    trigger: { type: 'scroll-into-view' },
  },
  {
    id: 'tab-bar',
    target: '[data-tour-step="tab-bar"]',
    title: 'Explore Your Diagnostic',
    description:
      "Four tabs organize everything: Analysis (what's wrong), Practice (drill questions), Strategy (how to fix it), and Insights (recruiter perspective). Click any tab to dive deeper.",
    mascot: 'thinking',
    placement: 'bottom',
    trigger: { type: 'scroll-into-view' },
  },
  {
    id: 'analysis-red-flags',
    target: '[data-tour-step="analysis-red-flags"]',
    title: 'Red Flags & Evidence',
    description:
      'Every risk ranked by severity. Use the filter to focus on Critical/High flags first. Each flag includes evidence pulled directly from your resume and the job description — this is exactly what a recruiter would flag.',
    mascot: 'reading',
    placement: 'top',
    trigger: { type: 'scroll-into-view' },
  },
  {
    id: 'analysis-signal-strength',
    target: '[data-tour-step="analysis-signal-strength"]',
    title: 'Signal Strength Breakdown',
    description:
      'Five categories scored individually — expand any to see the evidence behind the score. The weight percentage shows how much each category impacts your overall readiness.',
    mascot: 'analyzing',
    placement: 'top',
    trigger: { type: 'scroll-into-view' },
  },
  {
    id: 'practice-questions',
    target: '[data-tour-step="practice-questions"]',
    title: 'Practice With AI Feedback',
    description:
      'Company-specific questions tailored to your role. Click "Practice" on any question, type your answer, and get instant AI feedback with a model best answer. Aim to practice at least 5 before your interview.',
    mascot: 'thinking',
    placement: 'top',
    trigger: { type: 'tab-switch', tab: 'practice' },
  },
  {
    id: 'strategy-actions',
    target: '[data-tour-step="strategy-actions"]',
    title: 'Priority Action Plan',
    description:
      'Actions ranked by impact on your score. Each includes a "Why" rationale and curated resources. Work through them in order — the top 3 usually close 60-70% of your gaps.',
    mascot: 'professional',
    placement: 'top',
    trigger: { type: 'tab-switch', tab: 'strategy' },
  },
  {
    id: 'insights-recruiter',
    target: '[data-tour-step="insights-recruiter"]',
    title: "Recruiter's Perspective",
    description:
      "See yourself through a recruiter's eyes — first impression, screen time estimate, and simulated internal notes. Use this to understand how your profile is perceived before making changes.",
    mascot: 'analyzing',
    placement: 'top',
    trigger: { type: 'tab-switch', tab: 'insights' },
  },
  {
    id: 'report-toolbar',
    target: '[data-tour-step="report-toolbar"]',
    title: 'Share, Export & Re-Analyze',
    description:
      'Share your report with a mentor, download a PDF for offline review, or re-run the analysis after updating your resume. You get 2 runs per report to track improvement.',
    mascot: 'celebrating',
    placement: 'bottom',
    trigger: { type: 'scroll-into-view' },
  },
];

/** Only the first 2 steps auto-advance on page load */
export const HERO_STEP_IDS = ['readiness-score', 'metric-cards'];

/** Steps triggered by tab interactions */
export const TAB_STEP_MAP: Record<string, string> = {
  practice: 'practice-questions',
  strategy: 'strategy-actions',
  insights: 'insights-recruiter',
};
