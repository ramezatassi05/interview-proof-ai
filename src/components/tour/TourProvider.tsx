'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { TOUR_STEPS, HERO_STEP_IDS, TAB_STEP_MAP } from './tour-steps';
import { TourTooltip } from './TourTooltip';
import { TourSpotlight } from './TourSpotlight';
import type { TourState, TourAction, TourContextValue } from './types';

// ─── Reducer ───
const initialState: TourState = {
  isActive: false,
  currentStepId: null,
  completedSteps: new Set(),
  skipped: false,
  mode: 'first-time',
};

function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        isActive: true,
        mode: action.mode,
      };
    case 'SHOW_STEP':
      return {
        ...state,
        currentStepId: action.stepId,
      };
    case 'DISMISS_STEP': {
      const completed = new Set(state.completedSteps);
      if (state.currentStepId) completed.add(state.currentStepId);
      return {
        ...state,
        currentStepId: null,
        completedSteps: completed,
      };
    }
    case 'SKIP_TOUR':
      return {
        ...state,
        isActive: false,
        currentStepId: null,
        skipped: true,
      };
    case 'COMPLETE_TOUR':
      return {
        ...state,
        isActive: false,
        currentStepId: null,
      };
    default:
      return state;
  }
}

// ─── Context ───
const TourContext = createContext<TourContextValue | null>(null);

export function useTourContext(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTourContext must be used within a TourProvider');
  }
  return ctx;
}

// ─── Provider ───
interface TourProviderProps {
  children: React.ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [state, dispatch] = useReducer(tourReducer, initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  });

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const initiallyVisibleRef = useRef<Set<string>>(new Set());

  // ─── Get current step object ───
  const currentStep = useMemo(
    () => TOUR_STEPS.find((s) => s.id === state.currentStepId) ?? null,
    [state.currentStepId]
  );

  const currentStepIndex = useMemo(
    () => (state.currentStepId ? TOUR_STEPS.findIndex((s) => s.id === state.currentStepId) : -1),
    [state.currentStepId]
  );

  // ─── Find next auto step in hero sequence ───
  const findNextAutoStep = useCallback((): string | null => {
    const s = stateRef.current;
    const currentIdx = s.currentStepId ? HERO_STEP_IDS.indexOf(s.currentStepId) : -1;

    for (let i = currentIdx + 1; i < HERO_STEP_IDS.length; i++) {
      const stepId = HERO_STEP_IDS[i];
      if (!s.completedSteps.has(stepId)) return stepId;
    }

    return null;
  }, []);

  // ─── Wait for element to appear (lazy tabs) ───
  const waitForElement = useCallback(
    (selector: string, timeout = 2000): Promise<Element | null> => {
      return new Promise((resolve) => {
        const el = document.querySelector(selector);
        if (el) {
          resolve(el);
          return;
        }

        let elapsed = 0;
        const interval = setInterval(() => {
          elapsed += 100;
          const found = document.querySelector(selector);
          if (found) {
            clearInterval(interval);
            resolve(found);
          } else if (elapsed >= timeout) {
            clearInterval(interval);
            resolve(null);
          }
        }, 100);
      });
    },
    []
  );

  // ─── Show a step with optional delay ───
  const showStep = useCallback(
    async (stepId: string, delay = 0) => {
      const step = TOUR_STEPS.find((s) => s.id === stepId);
      if (!step) return;

      if (delay > 0) {
        await new Promise((r) => {
          advanceTimerRef.current = setTimeout(r, delay);
        });
      }

      // Bail if tour was skipped/ended while waiting
      if (!stateRef.current.isActive) return;

      // Don't interrupt an active tooltip — let user dismiss it first
      if (stateRef.current.currentStepId) return;

      // Wait for element to exist
      const el = await waitForElement(step.target);
      if (!el || !stateRef.current.isActive) return;

      dispatch({ type: 'SHOW_STEP', stepId });
    },
    [waitForElement]
  );

  // ─── Dismiss current step and advance (only within hero sequence) ───
  const dismissStep = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentStepId || !s.isActive) return;

    dispatch({ type: 'DISMISS_STEP' });

    // Only auto-advance within the hero sequence (first 2 steps)
    const nextAutoId = findNextAutoStep();
    if (nextAutoId) {
      showStep(nextAutoId, 400);
    } else {
      // Hero sequence complete — snapshot which scroll-step elements are already visible
      // so the observer doesn't immediately fire for them
      const visible = new Set<string>();
      const scrollSteps = TOUR_STEPS.filter((st) => st.trigger.type === 'scroll-into-view');
      for (const step of scrollSteps) {
        const el = document.querySelector(step.target);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            visible.add(step.id);
          }
        }
      }
      initiallyVisibleRef.current = visible;
    }
  }, [findNextAutoStep, showStep]);

  // ─── Skip tour ───
  const skipTour = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    initiallyVisibleRef.current = new Set();
    dispatch({ type: 'SKIP_TOUR' });
  }, []);

  // ─── Replay tour ───
  const replayTour = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    initiallyVisibleRef.current = new Set();
    dispatch({ type: 'START', mode: 'replay' });
  }, []);

  // ─── Notify tab change (called from parent page) ───
  const notifyTabChange = useCallback(
    (tabId: string) => {
      const s = stateRef.current;
      if (!s.isActive || s.currentStepId) return;

      const stepId = TAB_STEP_MAP[tabId];
      if (!stepId || s.completedSteps.has(stepId)) return;

      // Delay to let tab content render
      showStep(stepId, 600);
    },
    [showStep]
  );

  // ─── Auto-start on every page load ───
  useEffect(() => {
    dispatch({ type: 'START', mode: 'first-time' });
  }, []);

  // ─── Kick off first hero step when tour starts ───
  useEffect(() => {
    if (!state.isActive || state.currentStepId) return;
    if (state.completedSteps.size > 0) return; // don't re-trigger after dismiss

    const firstStep = HERO_STEP_IDS[0];
    if (state.completedSteps.has(firstStep)) return;

    const step = TOUR_STEPS.find((s) => s.id === firstStep);
    const delay = step?.trigger.type === 'auto' ? (step.trigger.delay ?? 400) : 400;
    showStep(firstStep, delay);
  }, [state.isActive, state.currentStepId, state.completedSteps, showStep]);

  // ─── IntersectionObserver for scroll-into-view steps ───
  useEffect(() => {
    if (!state.isActive) {
      observerRef.current?.disconnect();
      return;
    }

    const scrollSteps = TOUR_STEPS.filter((s) => s.trigger.type === 'scroll-into-view');

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const stepId = (entry.target as HTMLElement).dataset.tourStep;

          // Track when initially-visible elements exit viewport
          if (!entry.isIntersecting) {
            if (stepId && initiallyVisibleRef.current.has(stepId)) {
              initiallyVisibleRef.current.delete(stepId);
            }
            continue;
          }

          const s = stateRef.current;
          if (!s.isActive || s.currentStepId) continue;
          // Don't fire scroll steps until hero sequence is done
          if (HERO_STEP_IDS.some((id) => !s.completedSteps.has(id))) continue;
          if (!stepId) continue;

          const matchedStep = scrollSteps.find((st) => st.id === stepId);
          if (matchedStep && !s.completedSteps.has(matchedStep.id)) {
            // Skip elements that were already visible when hero sequence completed
            if (initiallyVisibleRef.current.has(matchedStep.id)) {
              continue; // Don't unobserve — keep watching for exit event
            }
            showStep(matchedStep.id, 300);
            observerRef.current?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.3 }
    );

    // Observe all scroll-triggered targets that exist in the DOM
    for (const step of scrollSteps) {
      const el = document.querySelector(step.target);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [state.isActive, state.completedSteps, showStep]);

  // ─── Re-observe new elements when tabs change (lazy-loaded content) ───
  useEffect(() => {
    if (!state.isActive || !observerRef.current) return;

    const scrollSteps = TOUR_STEPS.filter(
      (s) => s.trigger.type === 'scroll-into-view' && !state.completedSteps.has(s.id)
    );

    // Check for any newly-appeared elements to observe
    const timer = setTimeout(() => {
      for (const step of scrollSteps) {
        const el = document.querySelector(step.target);
        if (el) observerRef.current?.observe(el);
      }
    }, 700); // wait for tab content to render

    return () => clearTimeout(timer);
  }, [state.isActive, state.completedSteps]);

  // ─── Context value ───
  const contextValue = useMemo<TourContextValue>(
    () => ({
      state,
      currentStep,
      totalSteps: TOUR_STEPS.length,
      completedCount: state.completedSteps.size,
      dismissStep,
      skipTour,
      replayTour,
      notifyTabChange,
    }),
    [state, currentStep, dismissStep, skipTour, replayTour, notifyTabChange]
  );

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      <TourSpotlight targetSelector={currentStep?.target ?? null} />
      <TourTooltip
        step={currentStep}
        stepIndex={currentStepIndex}
        totalSteps={TOUR_STEPS.length}
        onDismiss={dismissStep}
        onSkip={skipTour}
      />
    </TourContext.Provider>
  );
}
