'use client';

import { PdfUpload } from '@/components/ui/PdfUpload';

interface StepResumeUploadProps {
  resumeText: string;
  onResumeTextChange: (text: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}

export function StepResumeUpload({
  resumeText,
  onResumeTextChange,
  onContinue,
  onSkip,
}: StepResumeUploadProps) {
  const canContinue = resumeText.length >= 50;

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="heading-modern text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
        Upload Your Resume
      </h2>
      <p className="text-[var(--text-secondary)] mb-8 text-center">
        This powers all your diagnostics &mdash; upload once, use everywhere.
      </p>

      <div className="w-full max-w-md space-y-6">
        <PdfUpload onTextExtracted={onResumeTextChange} />

        {canContinue && (
          <p className="text-xs text-green-600 text-center">
            Resume parsed successfully
          </p>
        )}

        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="group relative w-full rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 p-[2px] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <span className="flex items-center justify-center rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-black/90">
            Continue
          </span>
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
