'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { splitTextWithHighlight } from '@/lib/highlight';
import type {
  LLMAnalysis,
  QuestionFeedbackResponse,
  BestAnswerResponse,
  SavedAnswer,
} from '@/types';

const DISPLAY_COUNT = 8;
const STORAGE_PREFIX = 'iq-practice-';

// ── Utility helpers ──────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function buildSavedAnswer(
  poolIndex: number,
  allQuestions: LLMAnalysis['interviewQuestions'],
  answers: Record<number, string>,
  feedback: Record<number, QuestionFeedbackResponse>,
  bestAnswers: Record<number, BestAnswerResponse>
): SavedAnswer {
  return {
    poolIndex,
    question: allQuestions[poolIndex],
    answer: answers[poolIndex],
    feedback: feedback[poolIndex],
    bestAnswer: bestAnswers[poolIndex],
    savedAt: new Date().toISOString(),
  };
}

// ── Types & persistence ──────────────────────────────────────

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
  savedAnswers: SavedAnswer[];
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
      // Migration guard for savedAnswers
      if (!parsed.savedAnswers) parsed.savedAnswers = [];
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
    savedAnswers: [],
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

// ── Highlight types & component ──────────────────────────────

interface ActiveHighlight {
  type: 'strength' | 'improvement';
  index: number;
}

function HighlightedAnswer({
  answer,
  feedback,
  activeHighlight,
}: {
  answer: string;
  feedback?: QuestionFeedbackResponse;
  activeHighlight: ActiveHighlight | null;
}) {
  if (!activeHighlight || !feedback) {
    return <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{answer}</p>;
  }

  const { type, index } = activeHighlight;
  const quotes = type === 'strength' ? feedback.strengthQuotes : feedback.improvementQuotes;
  const quote = quotes?.[index] ?? '';

  if (!quote) {
    return <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{answer}</p>;
  }

  const segments = splitTextWithHighlight(answer, quote);
  const bgClass =
    type === 'strength'
      ? 'bg-[var(--color-success)]/20 rounded-sm'
      : 'bg-[var(--color-warning)]/20 rounded-sm';

  return (
    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark key={i} className={`${bgClass} text-inherit`}>
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  );
}

// ── Saved Answers View ───────────────────────────────────────

function SavedAnswersView({
  savedAnswers,
  onDelete,
}: {
  savedAnswers: SavedAnswer[];
  onDelete: (index: number) => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [savedHighlight, setSavedHighlight] = useState<{
    savedIdx: number;
    highlight: ActiveHighlight;
  } | null>(null);
  const [copiedSavedIdx, setCopiedSavedIdx] = useState<number | null>(null);

  const handleCopySaved = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSavedIdx(idx);
      setTimeout(() => setCopiedSavedIdx(null), 1500);
    });
  }, []);

  if (savedAnswers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="h-12 w-12 text-[var(--text-muted)] mb-4 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
        <p className="text-sm text-[var(--text-muted)]">No saved answers yet.</p>
        <p className="mt-1 text-xs text-[var(--text-muted)] opacity-70">
          When you refresh an answered question, it will be archived here.
        </p>
      </div>
    );
  }

  // Most recent first
  const sorted = [...savedAnswers].reverse();

  return (
    <div className="space-y-3">
      {sorted.map((sa, reverseIdx) => {
        const realIdx = savedAnswers.length - 1 - reverseIdx;
        const isExpanded = expandedIdx === realIdx;
        const score = sa.feedback?.score;
        const scoreBg =
          score !== undefined
            ? score >= 80
              ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
              : score >= 60
                ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]'
                : 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]'
            : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]';

        return (
          <div
            key={`saved-${realIdx}`}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden"
          >
            <button
              onClick={() => {
                setExpandedIdx(isExpanded ? null : realIdx);
                setSavedHighlight(null);
              }}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              {/* Score badge */}
              <span
                className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBg}`}
              >
                {score !== undefined ? `${score}` : '—'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {sa.question.question}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Saved {formatRelativeTime(sa.savedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Copy question */}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopySaved(sa.question.question, realIdx);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      handleCopySaved(sa.question.question, realIdx);
                    }
                  }}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="Copy question"
                >
                  {copiedSavedIdx === realIdx ? (
                    <svg
                      className="h-4 w-4 text-[var(--color-success)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </span>
                {/* Delete */}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(realIdx);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      onDelete(realIdx);
                    }
                  }}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors"
                  title="Delete saved answer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </span>
                {/* Chevron */}
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

            {isExpanded && (
              <div className="border-t border-[var(--border-default)] p-4 space-y-4">
                {/* Answer */}
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Your Answer
                  </span>
                  <div className="mt-2">
                    <HighlightedAnswer
                      answer={sa.answer}
                      feedback={sa.feedback}
                      activeHighlight={
                        savedHighlight?.savedIdx === realIdx ? savedHighlight.highlight : null
                      }
                    />
                  </div>
                </div>

                {/* Feedback */}
                {sa.feedback && (
                  <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        AI Feedback
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBg}`}
                      >
                        {sa.feedback.score}/100
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{sa.feedback.feedback}</p>
                    {sa.feedback.strengths.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-[var(--color-success)]">
                          Strengths
                        </span>
                        <ul className="mt-1 space-y-1">
                          {sa.feedback.strengths.map((s, i) => (
                            <li
                              key={i}
                              className={`flex items-start gap-2 text-sm text-[var(--text-secondary)] rounded-md px-1.5 py-0.5 -mx-1.5 transition-colors cursor-pointer ${
                                savedHighlight?.savedIdx === realIdx &&
                                savedHighlight.highlight.type === 'strength' &&
                                savedHighlight.highlight.index === i
                                  ? 'bg-[var(--color-success)]/10'
                                  : 'hover:bg-[var(--color-success)]/5'
                              }`}
                              onMouseEnter={() =>
                                setSavedHighlight({
                                  savedIdx: realIdx,
                                  highlight: { type: 'strength', index: i },
                                })
                              }
                              onMouseLeave={() => setSavedHighlight(null)}
                              onClick={() =>
                                setSavedHighlight((prev) =>
                                  prev?.savedIdx === realIdx &&
                                  prev.highlight.type === 'strength' &&
                                  prev.highlight.index === i
                                    ? null
                                    : {
                                        savedIdx: realIdx,
                                        highlight: { type: 'strength', index: i },
                                      }
                                )
                              }
                            >
                              <span className="mt-0.5 text-[var(--color-success)]">+</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {sa.feedback.improvements.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-[var(--color-warning)]">
                          Improvements
                        </span>
                        <ul className="mt-1 space-y-1">
                          {sa.feedback.improvements.map((imp, i) => (
                            <li
                              key={i}
                              className={`flex items-start gap-2 text-sm text-[var(--text-secondary)] rounded-md px-1.5 py-0.5 -mx-1.5 transition-colors cursor-pointer ${
                                savedHighlight?.savedIdx === realIdx &&
                                savedHighlight.highlight.type === 'improvement' &&
                                savedHighlight.highlight.index === i
                                  ? 'bg-[var(--color-warning)]/10'
                                  : 'hover:bg-[var(--color-warning)]/5'
                              }`}
                              onMouseEnter={() =>
                                setSavedHighlight({
                                  savedIdx: realIdx,
                                  highlight: { type: 'improvement', index: i },
                                })
                              }
                              onMouseLeave={() => setSavedHighlight(null)}
                              onClick={() =>
                                setSavedHighlight((prev) =>
                                  prev?.savedIdx === realIdx &&
                                  prev.highlight.type === 'improvement' &&
                                  prev.highlight.index === i
                                    ? null
                                    : {
                                        savedIdx: realIdx,
                                        highlight: { type: 'improvement', index: i },
                                      }
                                )
                              }
                            >
                              <span className="mt-0.5 text-[var(--color-warning)]">-</span>
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {sa.feedback.tips && sa.feedback.tips.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-[var(--accent-primary)]">
                          Tips for Next Time
                        </span>
                        <ul className="mt-1 space-y-1">
                          {sa.feedback.tips.map((tip, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-[var(--text-secondary)] px-1.5 py-0.5 -mx-1.5"
                            >
                              <span className="mt-0.5 text-[var(--accent-primary)]">
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                  />
                                </svg>
                              </span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Best answer */}
                {sa.bestAnswer && (
                  <div className="rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 p-4 space-y-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--accent-primary)]">
                      Ideal Answer
                    </span>
                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                      {sa.bestAnswer.bestAnswer}
                    </p>
                    {sa.bestAnswer.keyPoints.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-[var(--accent-primary)]">
                          Key Points
                        </span>
                        <ul className="mt-1 space-y-1">
                          {sa.bestAnswer.keyPoints.map((kp, i) => (
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
  );
}

// ── Main component ───────────────────────────────────────────

export function InterviewQuestions({ questions, companyName, reportId }: InterviewQuestionsProps) {
  const [state, setState] = useState<PersistedState>(() => loadState(reportId, questions));
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [draftAnswers, setDraftAnswers] = useState<Record<number, string>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<Record<number, boolean>>({});
  const [loadingBestAnswer, setLoadingBestAnswer] = useState<Record<number, boolean>>({});
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'practice' | 'saved'>('practice');
  const [activeHighlight, setActiveHighlight] = useState<ActiveHighlight | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyQuestion = useCallback((text: string, poolIndex: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(poolIndex);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  }, []);

  // Persist state changes
  useEffect(() => {
    saveState(reportId, state);
  }, [reportId, state]);

  const answeredCount = state.submittedIndices.filter((i) =>
    state.displayedIndices.includes(i)
  ).length;

  // FIX: Random selection instead of sequential scan
  const getUnusedIndex = useCallback((): number | null => {
    const usedSet = new Set(state.displayedIndices);
    const unused: number[] = [];
    for (let i = 0; i < state.allQuestions.length; i++) {
      if (!usedSet.has(i)) unused.push(i);
    }
    if (unused.length === 0) return null;
    return pickRandom(unused);
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

  // FIX: Allow refreshing answered questions (auto-archive) + random replacement
  const handleRefreshSingle = useCallback(
    (displayPos: number) => {
      const currentPoolIndex = state.displayedIndices[displayPos];
      const newIndex = getUnusedIndex();
      if (newIndex === null) return; // pool exhausted

      setState((prev) => {
        const newState = { ...prev };

        // If the question was answered, archive it to savedAnswers
        if (prev.submittedIndices.includes(currentPoolIndex)) {
          const saved = buildSavedAnswer(
            currentPoolIndex,
            prev.allQuestions,
            prev.answers,
            prev.feedback,
            prev.bestAnswers
          );
          newState.savedAnswers = [...prev.savedAnswers, saved];
          newState.submittedIndices = prev.submittedIndices.filter((i) => i !== currentPoolIndex);
        }

        const newDisplayed = [...prev.displayedIndices];
        newDisplayed[displayPos] = newIndex;
        newState.displayedIndices = newDisplayed;
        return newState;
      });
    },
    [state.displayedIndices, getUnusedIndex]
  );

  // FIX: Shuffle unused indices + archive all answered + replace ALL displayed
  const handleRefreshAll = useCallback(async () => {
    // Collect unused indices
    const usedSet = new Set(state.displayedIndices);
    const unusedIndices: number[] = [];
    for (let i = 0; i < state.allQuestions.length; i++) {
      if (!usedSet.has(i)) unusedIndices.push(i);
    }

    // If not enough unused questions, generate more
    if (unusedIndices.length < DISPLAY_COUNT) {
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

    // Shuffle unused indices and replace ALL displayed questions
    setState((prev) => {
      // Recalculate unused since state may have changed
      const currentUsed = new Set(prev.displayedIndices);
      const currentUnused: number[] = [];
      for (let i = 0; i < prev.allQuestions.length; i++) {
        if (!currentUsed.has(i)) currentUnused.push(i);
      }
      const shuffled = shuffleArray(currentUnused);

      // Archive all answered questions
      const newSaved = [...prev.savedAnswers];
      for (const poolIdx of prev.displayedIndices) {
        if (prev.submittedIndices.includes(poolIdx)) {
          newSaved.push(
            buildSavedAnswer(
              poolIdx,
              prev.allQuestions,
              prev.answers,
              prev.feedback,
              prev.bestAnswers
            )
          );
        }
      }

      // Replace all displayed questions
      const newDisplayed = [...prev.displayedIndices];
      let ptr = 0;
      for (let pos = 0; pos < newDisplayed.length; pos++) {
        if (ptr < shuffled.length) {
          newDisplayed[pos] = shuffled[ptr++];
        }
      }

      // Clean up submittedIndices for archived questions
      const archivedSet = new Set(
        prev.displayedIndices.filter((i) => prev.submittedIndices.includes(i))
      );
      const newSubmitted = prev.submittedIndices.filter((i) => !archivedSet.has(i));

      return {
        ...prev,
        displayedIndices: newDisplayed,
        submittedIndices: newSubmitted,
        savedAnswers: newSaved,
      };
    });
    setExpandedIndex(null);
  }, [state.displayedIndices, state.allQuestions, reportId]);

  const handleImproveAnswer = useCallback((poolIndex: number) => {
    setEditingIndex(poolIndex);
    setDraftAnswers((prev) => ({ ...prev }));
  }, []);

  const handleDeleteSavedAnswer = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      savedAnswers: prev.savedAnswers.filter((_, i) => i !== index),
    }));
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

          {/* Refresh All — only show in practice view */}
          {activeView === 'practice' && (
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
          )}
        </div>
      </div>

      {/* Sub-nav toggle */}
      <div className="mb-4 flex items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1 w-fit">
        <button
          onClick={() => setActiveView('practice')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeView === 'practice'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Practice
        </button>
        <button
          onClick={() => setActiveView('saved')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5 ${
            activeView === 'saved'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Saved Answers
          {state.savedAnswers.length > 0 && (
            <span className="rounded-full bg-[var(--accent-primary)]/20 px-1.5 py-0.5 text-xs font-semibold text-[var(--accent-primary)]">
              {state.savedAnswers.length}
            </span>
          )}
        </button>
      </div>

      {/* Saved Answers view */}
      {activeView === 'saved' && (
        <SavedAnswersView savedAnswers={state.savedAnswers} onDelete={handleDeleteSavedAnswer} />
      )}

      {/* Practice view */}
      {activeView === 'practice' && (
        <>
          <p className="mb-4 text-sm text-[var(--text-muted)]">
            Practice answering these questions, then get AI feedback on your responses. Pool:{' '}
            {state.allQuestions.length} questions.
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
                    onClick={() => {
                      setExpandedIndex(isExpanded ? null : displayPos);
                      setActiveHighlight(null);
                    }}
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
                      {/* Copy question */}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyQuestion(q.question, poolIndex);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            handleCopyQuestion(q.question, poolIndex);
                          }
                        }}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Copy question"
                      >
                        {copiedIndex === poolIndex ? (
                          <svg
                            className="h-4 w-4 text-[var(--color-success)]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </span>
                      {/* Refresh single question — always visible */}
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
                        title={
                          isSubmitted ? 'Archive & swap question' : 'Swap for a different question'
                        }
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
                            <HighlightedAnswer
                              answer={state.answers[poolIndex]}
                              feedback={feedbackData}
                              activeHighlight={activeHighlight}
                            />
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
                                    className={`flex items-start gap-2 text-sm text-[var(--text-secondary)] rounded-md px-1.5 py-0.5 -mx-1.5 transition-colors cursor-pointer ${
                                      activeHighlight?.type === 'strength' &&
                                      activeHighlight.index === i
                                        ? 'bg-[var(--color-success)]/10'
                                        : 'hover:bg-[var(--color-success)]/5'
                                    }`}
                                    onMouseEnter={() =>
                                      setActiveHighlight({ type: 'strength', index: i })
                                    }
                                    onMouseLeave={() => setActiveHighlight(null)}
                                    onClick={() =>
                                      setActiveHighlight((prev) =>
                                        prev?.type === 'strength' && prev.index === i
                                          ? null
                                          : { type: 'strength', index: i }
                                      )
                                    }
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
                                    className={`flex items-start gap-2 text-sm text-[var(--text-secondary)] rounded-md px-1.5 py-0.5 -mx-1.5 transition-colors cursor-pointer ${
                                      activeHighlight?.type === 'improvement' &&
                                      activeHighlight.index === i
                                        ? 'bg-[var(--color-warning)]/10'
                                        : 'hover:bg-[var(--color-warning)]/5'
                                    }`}
                                    onMouseEnter={() =>
                                      setActiveHighlight({ type: 'improvement', index: i })
                                    }
                                    onMouseLeave={() => setActiveHighlight(null)}
                                    onClick={() =>
                                      setActiveHighlight((prev) =>
                                        prev?.type === 'improvement' && prev.index === i
                                          ? null
                                          : { type: 'improvement', index: i }
                                      )
                                    }
                                  >
                                    <span className="mt-0.5 text-[var(--color-warning)]">-</span>
                                    {imp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {feedbackData.tips && feedbackData.tips.length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-[var(--accent-primary)]">
                                Tips for Next Time
                              </span>
                              <ul className="mt-1 space-y-1">
                                {feedbackData.tips.map((tip, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-sm text-[var(--text-secondary)] px-1.5 py-0.5 -mx-1.5"
                                  >
                                    <span className="mt-0.5 text-[var(--accent-primary)]">
                                      <svg
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                        />
                                      </svg>
                                    </span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Try Again button */}
                          {!isEditing && (
                            <button
                              onClick={() => handleImproveAnswer(poolIndex)}
                              className="flex items-center gap-1.5 rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 px-4 py-2 text-sm font-medium text-[var(--accent-primary)] transition-all hover:bg-[var(--accent-primary)]/10"
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
                              Try Again
                            </button>
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
        </>
      )}
    </div>
  );
}
