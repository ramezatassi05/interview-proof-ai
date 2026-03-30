'use client';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showBack?: boolean;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  onBack,
  showBack = false,
}: OnboardingProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar with logo + back */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {showBack && onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="192" height="192" rx="36" fill="#4F46E5" />
            <text
              x="96"
              y="96"
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="108"
              fontWeight="800"
              fontFamily="Arial, Helvetica, sans-serif"
              letterSpacing="-0.05em"
            >
              IP
            </text>
          </svg>
          <span className="text-sm font-semibold text-gray-800 tracking-tight">
            InterviewProof
          </span>
        </div>

        {/* Step counter */}
        <span className="text-xs text-gray-400 font-mono tabular-nums">
          {currentStep + 1}/{totalSteps}
        </span>
      </div>
    </div>
  );
}
