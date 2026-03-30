'use client';

interface OnboardingDotNavProps {
  currentStep: number; // 1-based step (1–5)
  totalSteps: number; // number of dot-navigable steps (5)
}

export function OnboardingDotNav({ currentStep, totalSteps }: OnboardingDotNavProps) {
  return (
    <nav
      className="fixed right-4 top-1/2 z-40 -translate-y-1/2 hidden sm:flex"
      aria-label="Onboarding progress"
    >
      <div className="flex flex-col items-center gap-2.5 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 px-1.5 py-3 shadow-sm">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isActive = currentStep === step;
          const isCompleted = currentStep > step;
          return (
            <div
              key={step}
              className="flex items-center justify-center"
              aria-label={`Step ${step} of ${totalSteps}${isActive ? ' (current)' : isCompleted ? ' (completed)' : ''}`}
            >
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: isActive ? 8 : 6,
                  height: isActive ? 8 : 6,
                  backgroundColor: isActive
                    ? '#f97316'
                    : isCompleted
                      ? '#f97316'
                      : '#d1d5db',
                  opacity: isActive ? 1 : isCompleted ? 0.5 : 0.4,
                  boxShadow: isActive ? '0 0 6px rgba(249, 115, 22, 0.4)' : 'none',
                }}
              />
            </div>
          );
        })}
      </div>
    </nav>
  );
}
