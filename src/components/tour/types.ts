export type TourMascot =
  | 'waving'
  | 'analyzing'
  | 'reading'
  | 'thinking'
  | 'professional'
  | 'celebrating';

export type TourPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right';

export type TourTrigger =
  | { type: 'auto'; delay?: number }
  | { type: 'scroll-into-view' }
  | { type: 'tab-switch'; tab: string }
  | { type: 'click'; target: string };

export interface TourStep {
  id: string;
  target: string; // CSS selector, e.g. [data-tour-step="readiness-score"]
  title: string;
  description: string;
  mascot: TourMascot;
  placement: TourPlacement;
  trigger: TourTrigger;
}

export interface TourState {
  isActive: boolean;
  currentStepId: string | null;
  completedSteps: Set<string>;
  skipped: boolean;
  mode: 'first-time' | 'replay';
}

export type TourAction =
  | { type: 'START'; mode: 'first-time' | 'replay' }
  | { type: 'SHOW_STEP'; stepId: string }
  | { type: 'DISMISS_STEP' }
  | { type: 'SKIP_TOUR' }
  | { type: 'COMPLETE_TOUR' };

export interface TooltipPosition {
  top: number;
  left: number;
  actualPlacement: 'top' | 'bottom' | 'left' | 'right';
  arrowLeft: number;
  arrowTop: number;
}

export interface TourContextValue {
  state: TourState;
  currentStep: TourStep | null;
  totalSteps: number;
  completedCount: number;
  dismissStep: () => void;
  skipTour: () => void;
  replayTour: () => void;
  notifyTabChange: (tabId: string) => void;
}
