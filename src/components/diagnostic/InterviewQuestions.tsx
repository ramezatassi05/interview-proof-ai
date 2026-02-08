import type { LLMAnalysis } from '@/types';

interface InterviewQuestionsProps {
  questions: LLMAnalysis['interviewQuestions'];
  companyName?: string;
}

export function InterviewQuestions({ questions, companyName }: InterviewQuestionsProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-[var(--accent-primary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {companyName
            ? `${companyName} Interview Questions to Expect`
            : 'Interview Questions to Expect'}
          <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
            ({questions.length})
          </span>
        </h2>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div
            key={index}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 card-hover"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{q.question}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{q.why}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
