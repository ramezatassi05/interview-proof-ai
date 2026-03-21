'use client';

import { useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type RecommendOption = 'yes' | 'no' | 'maybe';

export default function FeedbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reportId = params.reportId as string;
  const token = searchParams.get('token') || '';
  const initialRating = Number(searchParams.get('rating')) || 0;

  const [rating, setRating] = useState(initialRating >= 1 && initialRating <= 5 ? initialRating : 0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [mostUseful, setMostUseful] = useState('');
  const [improvement, setImprovement] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<RecommendOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          token,
          rating,
          mostUseful: mostUseful.trim() || undefined,
          improvement: improvement.trim() || undefined,
          wouldRecommend: wouldRecommend || undefined,
        }),
      });

      if (res.status === 409) {
        setAlreadySubmitted(true);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [rating, reportId, token, mostUseful, improvement, wouldRecommend]);

  const recommendOptions: { value: RecommendOption; label: string }[] = [
    { value: 'yes', label: 'Yes' },
    { value: 'maybe', label: 'Maybe' },
    { value: 'no', label: 'No' },
  ];

  // Thank-you state
  if (submitted) {
    return (
      <FeedbackShell>
        <Card variant="default" padding="lg" className="text-center">
          <div className="text-4xl mb-4">&#10003;</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Thank you for your feedback!
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            Your input helps us make InterviewProof better for everyone.
          </p>
        </Card>
      </FeedbackShell>
    );
  }

  // Already submitted state
  if (alreadySubmitted) {
    return (
      <FeedbackShell>
        <Card variant="default" padding="lg" className="text-center">
          <div className="text-4xl mb-4">&#128172;</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Already received!
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            You&apos;ve already submitted feedback for this report. Thank you!
          </p>
        </Card>
      </FeedbackShell>
    );
  }

  return (
    <FeedbackShell>
      <Card variant="default" padding="lg">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
          Rate your experience
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          How helpful was your InterviewProof report?
        </p>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoveredStar(n)}
              onMouseLeave={() => setHoveredStar(0)}
              className="text-4xl transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded"
              aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
            >
              <span
                style={{
                  color:
                    n <= (hoveredStar || rating) ? '#f59e0b' : 'var(--text-secondary)',
                  opacity: n <= (hoveredStar || rating) ? 1 : 0.4,
                }}
              >
                &#9733;
              </span>
            </button>
          ))}
        </div>

        {/* Optional Questions */}
        <div className="space-y-5">
          <div>
            <label
              htmlFor="most-useful"
              className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
            >
              What was most useful about your report?
              <span className="text-[var(--text-secondary)] font-normal"> (optional)</span>
            </label>
            <textarea
              id="most-useful"
              value={mostUseful}
              onChange={(e) => setMostUseful(e.target.value.slice(0, 500))}
              rows={2}
              maxLength={500}
              placeholder="e.g., The risk breakdown helped me prepare for..."
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="improvement"
              className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
            >
              What could we improve?
              <span className="text-[var(--text-secondary)] font-normal"> (optional)</span>
            </label>
            <textarea
              id="improvement"
              value={improvement}
              onChange={(e) => setImprovement(e.target.value.slice(0, 500))}
              rows={2}
              maxLength={500}
              placeholder="e.g., I wish the study plan had more..."
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
              Would you recommend InterviewProof?
              <span className="text-[var(--text-secondary)] font-normal"> (optional)</span>
            </p>
            <div className="flex gap-2">
              {recommendOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setWouldRecommend(wouldRecommend === opt.value ? null : opt.value)
                  }
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                    wouldRecommend === opt.value
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>
        )}

        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={rating === 0}
            className="w-full"
            size="lg"
          >
            Submit Feedback
          </Button>
        </div>
      </Card>
    </FeedbackShell>
  );
}

function FeedbackShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
          Interview<span className="text-[var(--accent-primary)]">Proof</span>
        </span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
