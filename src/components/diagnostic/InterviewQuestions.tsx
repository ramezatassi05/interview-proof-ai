'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import type { LLMAnalysis, QuestionFeedbackResponse, BestAnswerResponse } from '@/types';

const DISPLAY_COUNT = 8;
const STORAGE_PREFIX = 'iq-practice-';
const MIN_POOL_SIZE = 100;

interface InterviewQuestionsProps {
  questions: LLMAnalysis['interviewQuestions'];
  companyName?: string;
  reportId: string;
}

interface PersistedState {
  displayedIndices: number[];
  answers: Record<number, string>;
  feedback: Record<number, QuestionFeedbackResponse>;
  bestAnswers: Record<number, BestAnswerResponse>;
  submittedIndices: number[];
  allQuestions: LLMAnalysis['interviewQuestions'];
}

function loadState(
  reportId: string,
  initialQuestions: LLMAnalysis['interviewQuestions']
): PersistedState {
  if (typeof window === 'undefined') {
    return defaultState(initialQuestions);
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${reportId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      // Merge in any new questions from the server that weren't in localStorage
      if (initialQuestions.length > parsed.allQuestions.length) {
        parsed.allQuestions = initialQuestions;
      }
      return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return defaultState(initialQuestions);
}

function defaultState(questions: LLMAnalysis['interviewQuestions']): PersistedState {
  const indices = Array.from({ length: Math.min(DISPLAY_COUNT, questions.length) }, (_, i) => i);
  return {
    displayedIndices: indices,
    answers: {},
    feedback: {},
    bestAnswers: {},
    submittedIndices: [],
    allQuestions: questions,
  };
}

function saveState(reportId: string, state: PersistedState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${reportId}`, JSON.stringify(state));
  } catch {
    // storage full, ignore
  }
}

export function InterviewQuestions({ questions, companyName, reportId }: InterviewQuestionsProps) {
  const [state, setState] = useState<PersistedState>(() => loadState(reportId, questions));
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [draftAnswers, setDraftAnswers] = useState<Record<number, string>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<Record<number, boolean>>({});
  const [loadingBestAnswer, setLoadingBestAnswer] = useState<Record<number, boolean>>({});
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [loadingBackfill, setLoadingBackfill] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Persist state changes
  useEffect(() => {
    saveState(reportId, state);
  }, [reportId, state]);

  // Auto-expand pool for existing reports with fewer than MIN_POOL_SIZE questions
  useEffect(() => {
    let cancelled = false;
    async function backfill() {
      // Read current count from state ref via setState to avoid stale closure
      let currentQuestions: LLMAnalysis['interviewQuestions'] = [];
      setState((prev) => {
        currentQuestions = prev.allQuestions;
        return prev;
      });

      if (currentQuestions.length >= MIN_POOL_SIZE) return;
      setLoadingBackfill(true);
      try {
        while (currentQuestions.length < MIN_POOL_SIZE && !cancelled) {
          const allQTexts = currentQuestions.map((q) => q.question);
          const res = await api.generateMoreQuestions(reportId, {
            existingQuestions: allQTexts,
          });
          if (cancelled) return;
          const newQuestions = res.data.questions;
          if (newQuestions.length === 0) break; // safety: no questions returned
          setState((prev) => {
            const updated = [...prev.allQuestions, ...newQuestions];
            currentQuestions = updated;
            return { ...prev, allQuestions: updated };
          });
        }
      } catch (err) {
        console.error('Failed to backfill questions:', err);
      } finally {
        if (!cancelled) setLoadingBackfill(false);
      }
    }
    backfill();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  const answeredCount = state.submittedIndices.filter((i) =>
    state.displayedIndices.includes(i)
  ).length;

  const getUnusedIndex = useCallback((): number | null => {
    const usedSet = new Set(state.displayedIndices);
    for (let i = 0; i < state.allQuestions.length; i++) {
      if (!usedSet.has(i)) return i;
    }
    return null;
  }, [state.displayedIndices, state.allQuestions.length]);

  const handleSubmitAnswer = useCallback(
    async (poolIndex: number) => {
      const answer = draftAnswers[poolIndex] || state.answers[poolIndex];
      if (!answer?.trim()) return;

      // Save the answer immediately
      setState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [poolIndex]: answer },
        submittedIndices: prev.submittedIndices.includes(poolIndex)
          ? prev.submittedIndices
          : [...prev.submittedIndices, poolIndex],
      }));
      setEditingIndex(null);

      // Fetch feedback
      const q = state.allQuestions[poolIndex];
      setLoadingFeedback((prev) => ({ ...prev, [poolIndex]: true }));
      try {
        const res = await api.getAnswerFeedback(reportId, {
          questionIndex: poolIndex,
          questionText: q.question,
          userAnswer: answer,
        });
        setState((prev) => ({
          ...prev,
          feedback: { ...prev.feedback, [poolIndex]: res.data },
        }));
      } catch (err) {
        console.error('Failed to get feedback:', err);
      } finally {
        setLoadingFeedback((prev) => ({ ...prev, [poolIndex]: false }));
      }
    },
    [draftAnswers, state.answers, state.allQuestions, reportId]
  );

  const handleRevealBestAnswer = useCallback(
    async (poolIndex: number) => {
      if (state.bestAnswers[poolIndex]) return;
      const q = state.allQuestions[poolIndex];
      setLoadingBestAnswer((prev) => ({ ...prev, [poolIndex]: true }));
      try {
        const res = await api.getBestAnswer(reportId, {
          questionIndex: poolIndex,
          questionText: q.question,
          why: q.why,
        });
        setState((prev) => ({
          ...prev,
          bestAnswers: { ...prev.bestAnswers, [poolIndex]: res.data },
        }));
      } catch (err) {
        console.error('Failed to get best answer:', err);
      } finally {
        setLoadingBestAnswer((prev) => ({ ...prev, [poolIndex]: false }));
      }
    },
    [state.bestAnswers, state.allQuestions, reportId]
  );

  const handleRefreshSingle = useCallback(
    (displayPos: number) => {
      const currentPoolIndex = state.displayedIndices[displayPos];
      // Don't refresh if already answered
      if (state.submittedIndices.includes(currentPoolIndex)) return;

      const newIndex = getUnusedIndex();
      if (newIndex === null) return; // pool exhausted, handled below

      setState((prev) => {
        const newDisplayed = [...prev.displayedIndices];
        newDisplayed[displayPos] = newIndex;
        return { ...prev, displayedIndices: newDisplayed };
      });
    },
    [state.displayedIndices, state.submittedIndices, getUnusedIndex]
  );

  const handleRefreshAll = useCallback(async () => {
    // Collect unused indices
    const usedSet = new Set(state.displayedIndices);
    const unusedIndices: number[] = [];
    for (let i = 0; i < state.allQuestions.length; i++) {
      if (!usedSet.has(i)) unusedIndices.push(i);
    }

    // If not enough unused questions, generate more
    if (unusedIndices.length < DISPLAY_COUNT - answeredCount) {
      setLoadingRefresh(true);
      try {
        const allQTexts = state.allQuestions.map((q) => q.question);
        const res = await api.generateMoreQuestions(reportId, {
          existingQuestions: allQTexts,
        });
        const newQuestions = res.data.questions;
        setState((prev) => {
          const startIdx = prev.allQuestions.length;
          const updatedAll = [...prev.allQuestions, ...newQuestions];
          // Add new indices to unused pool
          for (let i = 0; i < newQuestions.length; i++) {
            unusedIndices.push(startIdx + i);
          }
          return { ...prev, allQuestions: updatedAll };
        });
      } catch (err) {
        console.error('Failed to generate more questions:', err);
      } finally {
        setLoadingRefresh(false);
      }
    }

    // Now swap unanswered displayed questions
    let unusedPtr = 0;
    setState((prev) => {
      const newDisplayed = [...prev.displayedIndices];
      // Recalculate unused since state may have changed
      const currentUsed = new Set(newDisplayed);
      const currentUnused: number[] = [];
      for (let i = 0; i < prev.allQuestions.length; i++) {
        if (!currentUsed.has(i)) currentUnused.push(i);
      }
      unusedPtr = 0;
      for (let pos = 0; pos < newDisplayed.length; pos++) {
        const poolIdx = newDisplayed[pos];
        if (!prev.submittedIndices.includes(poolIdx) && unusedPtr < currentUnused.length) {
          newDisplayed[pos] = currentUnused[unusedPtr++];
        }
      }
      return { ...prev, displayedIndices: newDisplayed };
    });
    setExpandedIndex(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submittedIndices needed to filter answered questions
  }, [state.displayedIndices, state.allQuestions, state.submittedIndices, answeredCount, reportId]);

  const handleImproveAnswer = useCallback((poolIndex: number) => {
    setEditingIndex(poolIndex);
    setDraftAnswers((prev) => ({ ...prev }));
  }, []);

  if (state.allQuestions.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
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
            {companyName ? `${companyName} Practice Questions` : 'Practice Questions'}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 rounded-full bg-[var(--bg-elevated)]">
              <div
                className="h-2 rounded-full bg-[var(--accent-primary)] transition-all"
                style={{
                  width: `${state.displayedIndices.length > 0 ? (answeredCount / state.displayedIndices.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-sm text-[var(--text-muted)]">
              {answeredCount}/{state.displayedIndices.length} answered
            </span>
          </div>

          {/* Refresh All */}
          <button
            onClick={handleRefreshAll}
            disabled={loadingRefresh}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-accent)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${loadingRefresh ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loadingRefresh ? 'Loading...' : 'Refresh All'}
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Practice answering these questions, then get AI feedback on your responses. Pool:{' '}
        {state.allQuestions.length} questions.
        {loadingBackfill && (
          <span className="ml-2 inline-flex items-center gap-1 text-[var(--accent-primary)]">
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading more questions...
          </span>
        )}
      </p>

      {/* Question Cards */}
      <div className="space-y-4">
        {state.displayedIndices.map((poolIndex, displayPos) => {
          const q = state.allQuestions[poolIndex];
          if (!q) return null;

          const isExpanded = expandedIndex === displayPos;
          const isSubmitted = state.submittedIndices.includes(poolIndex);
          const isEditing = editingIndex === poolIndex;
          const feedbackData = state.feedback[poolIndex];
          const bestAnswerData = state.bestAnswers[poolIndex];
          const isFeedbackLoading = loadingFeedback[poolIndex];
          const isBestAnswerLoading = loadingBestAnswer[poolIndex];

          return (
            <div
              key={`${poolIndex}-${displayPos}`}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden transition-all"
            >
              {/* Collapsed header — always visible */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : displayPos)}
                className="flex w-full items-start gap-4 p-5 text-left"
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    isSubmitted
                      ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                      : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                  }`}
                >
                  {isSubmitted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    displayPos + 1
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {q.question}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{q.why}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Refresh single question */}
                  {!isSubmitted && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefreshSingle(displayPos);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          handleRefreshSingle(displayPos);
                        }
                      }}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Swap for a different question"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </span>
                  )}
                  {/* Expand/collapse chevron */}
                  <svg
                    className={`h-5 w-5 text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-[var(--border-default)] p-5 space-y-4">
                  {/* Answer area — show textarea if not submitted or editing */}
                  {(!isSubmitted || isEditing) && (
                    <div className="space-y-3">
                      <textarea
                        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-y"
                        rows={4}
                        placeholder="Type your answer here..."
                        value={
                          draftAnswers[poolIndex] !== undefined
                            ? draftAnswers[poolIndex]
                            : (state.answers[poolIndex] ?? '')
                        }
                        onChange={(e) =>
                          setDraftAnswers((prev) => ({
                            ...prev,
                            [poolIndex]: e.target.value,
                          }))
                        }
                      />
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleSubmitAnswer(poolIndex)}
                          disabled={
                            isFeedbackLoading ||
                            !(draftAnswers[poolIndex] || state.answers[poolIndex])?.trim()
                          }
                          className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                        >
                          {isFeedbackLoading
                            ? 'Analyzing...'
                            : isEditing
                              ? 'Resubmit Answer'
                              : 'Submit Answer'}
                        </button>
                        {!isSubmitted && !bestAnswerData && (
                          <button
                            onClick={() => handleRevealBestAnswer(poolIndex)}
                            disabled={isBestAnswerLoading}
                            className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-accent)] hover:text-[var(--text-primary)] disabled:opacity-50"
                          >
                            {isBestAnswerLoading ? 'Generating...' : 'Reveal Best Answer'}
                          </button>
                        )}
                        {isEditing && (
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submitted answer display (when not editing) */}
                  {isSubmitted && !isEditing && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                            Your Answer
                          </span>
                          <button
                            onClick={() => handleImproveAnswer(poolIndex)}
                            className="text-xs text-[var(--accent-primary)] hover:underline"
                          >
                            Improve Answer
                          </button>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                          {state.answers[poolIndex]}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Feedback section */}
                  {isFeedbackLoading && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Analyzing your answer...
                    </div>
                  )}

                  {feedbackData && !isFeedbackLoading && (
                    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          AI Feedback
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            feedbackData.score >= 80
                              ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                              : feedbackData.score >= 60
                                ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]'
                                : 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]'
                          }`}
                        >
                          {feedbackData.score}/100
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {feedbackData.feedback}
                      </p>
                      {feedbackData.strengths.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-[var(--color-success)]">
                            Strengths
                          </span>
                          <ul className="mt-1 space-y-1">
                            {feedbackData.strengths.map((s, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                              >
                                <span className="mt-0.5 text-[var(--color-success)]">+</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {feedbackData.improvements.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-[var(--color-warning)]">
                            Improvements
                          </span>
                          <ul className="mt-1 space-y-1">
                            {feedbackData.improvements.map((imp, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                              >
                                <span className="mt-0.5 text-[var(--color-warning)]">-</span>
                                {imp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Best answer section */}
                  {isSubmitted && !bestAnswerData && !isBestAnswerLoading && (
                    <button
                      onClick={() => handleRevealBestAnswer(poolIndex)}
                      className="rounded-lg border border-dashed border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-muted)] transition-all hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                    >
                      Reveal Best Answer
                    </button>
                  )}

                  {isBestAnswerLoading && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Generating ideal answer...
                    </div>
                  )}

                  {bestAnswerData && (
                    <div className="rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 p-4 space-y-3">
                      <span className="text-xs font-medium uppercase tracking-wider text-[var(--accent-primary)]">
                        Ideal Answer
                      </span>
                      <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                        {bestAnswerData.bestAnswer}
                      </p>
                      {bestAnswerData.keyPoints.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-[var(--accent-primary)]">
                            Key Points
                          </span>
                          <ul className="mt-1 space-y-1">
                            {bestAnswerData.keyPoints.map((kp, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                              >
                                <span className="mt-0.5 text-[var(--accent-primary)]">*</span>
                                {kp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
