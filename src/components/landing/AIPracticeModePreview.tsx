'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RadialScoreIndicator } from '@/components/ui/RadialScoreIndicator';
import { ShineBorder } from '@/components/ui/shine-border';

/* ─── Demo Data ─── */

const DEMO_QUESTIONS = [
  {
    question: 'Design a rate limiter for an API gateway',
    difficulty: 'Hard' as const,
    area: 'System Design',
    likelihood: 92,
    score: 72,
    answer:
      'I would use a token bucket algorithm with Redis for distributed rate limiting. Each API key gets a bucket with a configurable refill rate. On each request, we check if tokens are available, decrement atomically, and return 429 if exhausted. For the gateway layer, I\u2019d add sliding window counters per endpoint to handle burst traffic gracefully.',
    strengths: [
      'Correctly identified distributed caching need',
      'Mentioned specific algorithm (token bucket)',
    ],
    improvements: [
      'Missing discussion of edge cases (clock skew)',
      'Could quantify expected throughput numbers',
    ],
    bestAnswer:
      'I\u2019d implement a sliding window rate limiter using Redis sorted sets. Each request adds a timestamped entry; we count entries within the window to decide. This handles distributed systems via Redis atomicity, avoids the boundary problem of fixed windows, and I\u2019d add a circuit breaker pattern for downstream protection. At my previous role, a similar approach handled 50K req/s with <2ms overhead.',
  },
  {
    question: 'Describe a time you pushed back on a technical decision',
    difficulty: 'Medium' as const,
    area: 'Behavioral',
    likelihood: 88,
    score: 81,
    answer:
      'Our team lead wanted to rewrite our monolith to microservices mid-sprint. I gathered data showing we\u2019d miss our Q3 deadline by 6 weeks. I proposed a strangler fig pattern instead \u2014 extract one service per sprint. We shipped on time and had 3 services extracted by Q4.',
    strengths: [
      'Strong STAR structure with clear outcome',
      'Used data to support the pushback',
    ],
    improvements: [
      'Add the business impact in revenue/users',
      'Mention how it affected team dynamics',
    ],
    bestAnswer:
      'When our team lead proposed a full microservices rewrite mid-sprint, I ran a quick analysis: 6-week delay, $180K in opportunity cost, and 2 engineers blocked. I presented the strangler fig pattern as an alternative \u2014 extract one bounded context per sprint while keeping the monolith running. Result: shipped on time, extracted 3 services by Q4, and reduced deploy times from 45min to 8min. The key was framing it as \u201cyes, and\u201d rather than \u201cno.\u201d',
  },
  {
    question: 'Walk me through your indexing strategy in PostgreSQL',
    difficulty: 'Medium' as const,
    area: 'Technical',
    likelihood: 85,
    score: 65,
    answer:
      'I start with analyzing slow queries using EXPLAIN ANALYZE. I create B-tree indexes on frequently filtered columns and composite indexes for multi-column WHERE clauses. For text search, I use GIN indexes with tsvector. I also monitor index usage and drop unused indexes to reduce write overhead.',
    strengths: [
      'Good mention of EXPLAIN ANALYZE workflow',
      'Covered multiple index types appropriately',
    ],
    improvements: [
      'No mention of partial indexes for large tables',
      'Missing discussion of index maintenance costs',
      'Should reference specific performance gains',
    ],
    bestAnswer:
      'My indexing strategy follows a data-driven approach. First, I identify slow queries via pg_stat_statements and EXPLAIN ANALYZE. I prioritize: B-tree for equality/range, GIN for JSONB/full-text, and partial indexes for hot paths (e.g., WHERE status = \u2018active\u2019 on a 10M row table reduced scan time from 800ms to 3ms). I use composite indexes ordered by selectivity and always benchmark write amplification.',
  },
];

type Phase = 'question' | 'typing' | 'feedback' | 'bestAnswer';

const PHASE_DURATIONS: Record<Phase, number> = {
  question: 2500,
  typing: 4000,
  feedback: 6000,
  bestAnswer: 4000,
};

/* ─── Component ─── */

export function AIPracticeModePreview() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [typedText, setTypedText] = useState('');
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [visibleStrengths, setVisibleStrengths] = useState(0);
  const [visibleImprovements, setVisibleImprovements] = useState(0);
  const [bestAnswerVisible, setBestAnswerVisible] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const staggerTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const currentQ = DEMO_QUESTIONS[questionIndex];

  // Check for reduced motion preference
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // IntersectionObserver — pause when off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Clear all active timers
  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typingRef.current) clearInterval(typingRef.current);
    staggerTimers.current.forEach(clearTimeout);
    staggerTimers.current = [];
  }, []);

  // Reset state for next question
  const resetForQuestion = useCallback(
    (nextIndex: number) => {
      clearAllTimers();
      setTypedText('');
      setFeedbackVisible(false);
      setVisibleStrengths(0);
      setVisibleImprovements(0);
      setBestAnswerVisible(false);
      setQuestionIndex(nextIndex);
      setPhase('question');
    },
    [clearAllTimers]
  );

  // Phase state machine
  useEffect(() => {
    if (!isInView || reducedMotion) return;

    clearAllTimers();

    if (phase === 'question') {
      timerRef.current = setTimeout(() => setPhase('typing'), PHASE_DURATIONS.question);
    } else if (phase === 'typing') {
      const answer = currentQ.answer;
      let charIndex = 0;
      const charsPerTick = Math.ceil(answer.length / (PHASE_DURATIONS.typing / 30));

      typingRef.current = setInterval(() => {
        charIndex += charsPerTick;
        if (charIndex >= answer.length) {
          setTypedText(answer);
          if (typingRef.current) clearInterval(typingRef.current);
          timerRef.current = setTimeout(() => setPhase('feedback'), 300);
        } else {
          setTypedText(answer.slice(0, charIndex));
        }
      }, 30);
    } else if (phase === 'feedback') {
      setFeedbackVisible(true);

      const strengthCount = currentQ.strengths.length;
      const improvementCount = currentQ.improvements.length;
      const totalItems = strengthCount + improvementCount;
      const staggerDelay = Math.min(600, (PHASE_DURATIONS.feedback - 2000) / totalItems);

      for (let i = 0; i < strengthCount; i++) {
        const t = setTimeout(() => setVisibleStrengths(i + 1), 800 + i * staggerDelay);
        staggerTimers.current.push(t);
      }
      for (let i = 0; i < improvementCount; i++) {
        const t = setTimeout(
          () => setVisibleImprovements(i + 1),
          800 + (strengthCount + i) * staggerDelay
        );
        staggerTimers.current.push(t);
      }

      timerRef.current = setTimeout(() => setPhase('bestAnswer'), PHASE_DURATIONS.feedback);
    } else if (phase === 'bestAnswer') {
      setBestAnswerVisible(true);
      timerRef.current = setTimeout(() => {
        const nextIndex = (questionIndex + 1) % DEMO_QUESTIONS.length;
        resetForQuestion(nextIndex);
      }, PHASE_DURATIONS.bestAnswer);
    }

    return clearAllTimers;
  }, [phase, isInView, reducedMotion, questionIndex, currentQ, resetForQuestion, clearAllTimers]);

  const difficultyBorder =
    currentQ.difficulty === 'Hard' ? 'var(--color-danger)' : 'var(--color-warning)';

  // Reduced motion: show static final state for Q1
  if (reducedMotion) {
    const q = DEMO_QUESTIONS[0];
    return (
      <div ref={containerRef} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div
              className="rounded-lg bg-[var(--bg-elevated)] p-4"
              style={{ borderLeft: `2px solid var(--color-danger)` }}
            >
              <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">
                &ldquo;{q.question}&rdquo;
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <Badge variant="high">Hard</Badge>
                <span className="rounded bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] font-mono uppercase text-[var(--text-muted)]">
                  {q.area}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] p-4">
              <span className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)] block mb-2">
                Your Answer
              </span>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{q.answer}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
              <div className="flex items-center gap-3 mb-3">
                <RadialScoreIndicator size="sm" score={q.score} variant="auto" animated={false} />
                <div>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Answer Score
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block">out of 100</span>
                </div>
              </div>
              <div className="mb-2.5">
                <span className="text-[10px] font-medium text-[var(--color-success)] uppercase tracking-wide block mb-1.5">
                  Strengths
                </span>
                {q.strengths.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)] mb-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mt-1 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
              <div>
                <span className="text-[10px] font-medium text-[var(--color-warning)] uppercase tracking-wide block mb-1.5">
                  Improvements
                </span>
                {q.improvements.map((imp, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)] mb-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] mt-1 flex-shrink-0" />
                    {imp}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent-primary)]">
          AI Practice Mode
        </span>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            Q{questionIndex + 1}/{DEMO_QUESTIONS.length}
          </span>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: question + answer */}
        <div className="space-y-3">
          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`q-${questionIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="rounded-lg bg-[var(--bg-elevated)] p-4"
              style={{ borderLeft: `2px solid ${difficultyBorder}` }}
            >
              <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">
                &ldquo;{currentQ.question}&rdquo;
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <Badge variant={currentQ.difficulty === 'Hard' ? 'high' : 'medium'}>
                  {currentQ.difficulty}
                </Badge>
                <span className="rounded bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] font-mono uppercase text-[var(--text-muted)]">
                  {currentQ.area}
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar
                  value={currentQ.likelihood}
                  size="sm"
                  variant="accent"
                  showValue={false}
                  animated={false}
                />
                <span className="text-[10px] font-mono text-[var(--color-info)] mt-0.5 block">
                  {currentQ.likelihood}% likely to be asked
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Answer area */}
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] p-4 min-h-[140px]">
            <span className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)] block mb-2">
              Your Answer
            </span>
            {phase === 'question' && (
              <p className="text-sm text-[var(--text-muted)] italic">Waiting for answer...</p>
            )}
            {(phase === 'typing' || phase === 'feedback' || phase === 'bestAnswer') && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {typedText}
                {phase === 'typing' && (
                  <span className="inline-block w-0.5 h-4 bg-[var(--accent-primary)] ml-0.5 align-middle animate-blink-cursor" />
                )}
              </p>
            )}
          </div>
        </div>

        {/* Right: feedback + best answer */}
        <div className="space-y-3">
          {/* Placeholder states */}
          {phase === 'question' && (
            <div className="rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-primary)] p-4 min-h-[140px] flex items-center justify-center">
              <span className="text-xs text-[var(--text-muted)] italic">
                AI feedback appears here...
              </span>
            </div>
          )}
          {phase === 'typing' && (
            <div className="rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-primary)] p-4 min-h-[140px] flex items-center justify-center">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <span className="text-xs text-[var(--text-muted)]">Analyzing answer...</span>
              </div>
            </div>
          )}

          {/* Feedback panel */}
          <AnimatePresence>
            {(phase === 'feedback' || phase === 'bestAnswer') && feedbackVisible && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.4 }}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4"
              >
                {/* Score */}
                <div className="flex items-center gap-3 mb-3">
                  <RadialScoreIndicator
                    size="sm"
                    score={currentQ.score}
                    variant="auto"
                    animated={phase === 'feedback'}
                  />
                  <div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      Answer Score
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block">out of 100</span>
                  </div>
                </div>

                {/* Strengths */}
                <div className="mb-2.5">
                  <span className="text-[10px] font-medium text-[var(--color-success)] uppercase tracking-wide block mb-1.5">
                    Strengths
                  </span>
                  <div className="space-y-1.5">
                    {currentQ.strengths.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{
                          opacity: i < visibleStrengths ? 1 : 0,
                          x: i < visibleStrengths ? 0 : 8,
                        }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mt-1 flex-shrink-0" />
                        {s}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div>
                  <span className="text-[10px] font-medium text-[var(--color-warning)] uppercase tracking-wide block mb-1.5">
                    Improvements
                  </span>
                  <div className="space-y-1.5">
                    {currentQ.improvements.map((imp, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{
                          opacity: i < visibleImprovements ? 1 : 0,
                          x: i < visibleImprovements ? 0 : 8,
                        }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] mt-1 flex-shrink-0" />
                        {imp}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Best answer panel */}
          <AnimatePresence>
            {phase === 'bestAnswer' && bestAnswerVisible && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success-muted)] p-4 overflow-hidden"
              >
                <ShineBorder
                  shineColor={['var(--color-success)', 'var(--accent-primary)']}
                  duration={8}
                />
                <span className="text-[10px] font-semibold text-[var(--color-success)] uppercase tracking-wide block mb-2">
                  Best Answer
                </span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-4">
                  {currentQ.bestAnswer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
