'use client';

/**
 * Phase E v1 — live voice mock interview using browser-native Web Speech APIs.
 *
 * STT: window.SpeechRecognition / window.webkitSpeechRecognition (Chrome/Edge).
 * TTS: window.speechSynthesis with the user's preferred English voice.
 *
 * Backend: reuses the existing /api/agent/mock-interview endpoint. No new
 * server code, no provider keys, no WebRTC infra. Phase E+1 swaps the
 * browser STT/TTS for LiveKit Agents + Deepgram + ElevenLabs without
 * touching the agent itself.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

interface MockInterviewResponse {
  data: {
    sessionId: string;
    status: 'in_progress' | 'completed';
    currentQuestion: { question: string; questionIndex: number } | null;
    feedbackShort: string | null;
    advanceToNext: boolean | null;
    currentScore: number | null;
    finalReport: unknown | null;
    actionIds: { reportActionId: string | null; recommendDrillIds: string[] } | null;
    questionsRemaining: number;
  };
}

type Phase =
  | 'idle'
  | 'starting'
  | 'asking_question'
  | 'listening'
  | 'transcribed'
  | 'evaluating'
  | 'completed'
  | 'error';

interface TurnRecord {
  question: string;
  answer: string;
  feedback: string | null;
  score: number | null;
}

const FILLER_RE = /\b(um|uh|like|you know|kinda|sort of|basically|literally|right\?)\b/gi;

function countFillers(text: string): number {
  const matches = text.match(FILLER_RE);
  return matches ? matches.length : 0;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: { results: { isFinal: boolean; 0: { transcript: string } }[]; resultIndex: number }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface LiveMockInterviewProps {
  reportId: string;
}

export function LiveMockInterview({ reportId }: LiveMockInterviewProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [questionsRemaining, setQuestionsRemaining] = useState<number>(5);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [turns, setTurns] = useState<TurnRecord[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<number | null>(null);
  const ttsAvailable = useMemo(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    []
  );
  const sttCtor = useMemo(() => getSpeechRecognitionCtor(), []);
  const sttAvailable = sttCtor !== null;

  const fillerCount = useMemo(
    () => countFillers(transcript + ' ' + interimTranscript),
    [transcript, interimTranscript]
  );

  // ── Timer
  useEffect(() => {
    if (phase !== 'listening') {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    setElapsedSeconds(0);
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [phase]);

  // ── Speak helper (TTS)
  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (muted || !ttsAvailable || !text) {
          resolve();
          return;
        }
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1;
        utter.pitch = 1;
        utter.onend = () => resolve();
        utter.onerror = () => resolve();
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
        } catch {
          resolve();
        }
      }),
    [muted, ttsAvailable]
  );

  // ── API call
  const callMockInterview = useCallback(
    async (input: {
      command?: 'start' | 'next' | 'end';
      userMessage?: string;
    }): Promise<MockInterviewResponse | null> => {
      try {
        const res = await fetch('/api/agent/mock-interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId,
            sessionId: sessionId ?? undefined,
            ...input,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as MockInterviewResponse;
        if (!sessionId && json.data.sessionId) setSessionId(json.data.sessionId);
        return json;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Request failed');
        setPhase('error');
        return null;
      }
    },
    [reportId, sessionId]
  );

  // ── Start the interview
  const handleStart = useCallback(async () => {
    setError(null);
    setTurns([]);
    setTranscript('');
    setInterimTranscript('');
    setPhase('starting');
    const res = await callMockInterview({ command: 'start' });
    if (!res) return;

    const q = res.data.currentQuestion?.question ?? null;
    if (!q) {
      setError('No question returned');
      setPhase('error');
      return;
    }
    setCurrentQuestion(q);
    setQuestionsRemaining(res.data.questionsRemaining);
    setPhase('asking_question');
    await speak(q);
    setPhase('listening');
  }, [callMockInterview, speak]);

  // ── STT lifecycle
  useEffect(() => {
    if (phase !== 'listening' || !sttCtor) return;
    const rec = new sttCtor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalText = '';
    rec.onresult = (ev) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalText += (finalText ? ' ' : '') + text.trim();
        } else {
          interim += text;
        }
      }
      setTranscript(finalText);
      setInterimTranscript(interim);
    };
    rec.onerror = (ev) => {
      // 'no-speech' is benign — happens when the user pauses too long.
      if (ev.error !== 'no-speech') {
        setError(`Speech recognition: ${ev.error}`);
      }
    };
    rec.onend = () => {
      setInterimTranscript('');
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.error('[live] start failed', err);
    }
    return () => {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [phase, sttCtor]);

  // ── Submit answer
  const handleSubmitAnswer = useCallback(async () => {
    const finalAnswer = (transcript + ' ' + interimTranscript).trim();
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setInterimTranscript('');
    if (!finalAnswer) {
      setError('No transcript captured. Try again or check microphone permissions.');
      return;
    }
    setPhase('evaluating');
    const res = await callMockInterview({ command: 'next', userMessage: finalAnswer });
    if (!res) return;

    const justAskedQuestion = currentQuestion ?? '';
    setTurns((prev) => [
      ...prev,
      {
        question: justAskedQuestion,
        answer: finalAnswer,
        feedback: res.data.feedbackShort,
        score: res.data.currentScore,
      },
    ]);
    setTranscript('');

    if (res.data.status === 'completed') {
      setPhase('completed');
      await speak('That wraps the interview. Open the Coach tab to see your full report.');
      return;
    }

    const nextQ = res.data.currentQuestion?.question ?? null;
    setQuestionsRemaining(res.data.questionsRemaining);
    if (!nextQ) {
      setPhase('completed');
      return;
    }
    setCurrentQuestion(nextQ);
    setPhase('asking_question');
    await speak(nextQ);
    setPhase('listening');
  }, [callMockInterview, currentQuestion, interimTranscript, speak, transcript]);

  // ── End early
  const handleEnd = useCallback(async () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setPhase('evaluating');
    await callMockInterview({ command: 'end' });
    setPhase('completed');
  }, [callMockInterview]);

  if (!sttAvailable) {
    return (
      <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] p-6 text-sm text-[var(--text-primary)]">
        <p className="font-semibold">Voice mock interview is not supported in this browser.</p>
        <p className="mt-2 text-[var(--text-secondary)]">
          Live voice uses the Web Speech API (Chrome and Edge). Use the async mock interview from
          the Coach tab in other browsers, or try this page in Chrome.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
              {phase === 'idle' && 'Ready'}
              {phase === 'starting' && 'Preparing first question…'}
              {phase === 'asking_question' && 'Interviewer is speaking'}
              {phase === 'listening' && 'Your turn — speak naturally'}
              {phase === 'transcribed' && 'Captured'}
              {phase === 'evaluating' && 'Evaluating your answer…'}
              {phase === 'completed' && 'Interview complete'}
              {phase === 'error' && 'Error'}
            </p>
            {sessionId && (
              <p className="font-mono text-[10px] text-[var(--text-muted)]">
                {questionsRemaining} questions left
              </p>
            )}
          </div>

          {currentQuestion && phase !== 'idle' && (
            <p className="mt-4 text-xl leading-relaxed text-[var(--text-primary)]">
              {currentQuestion}
            </p>
          )}

          {phase === 'idle' && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Press start. The interviewer will read each question aloud; you answer by
                speaking. Five questions, behavioral focus. Pause anytime.
              </p>
              <div className="rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-muted)]">
                <p className="font-mono uppercase tracking-wide text-[var(--text-secondary)]">
                  Phase E v1 — browser-native
                </p>
                <p className="mt-1">
                  Audio capture and transcription run in your browser. No audio leaves your
                  device. Production-grade voice (LiveKit + Deepgram) ships in Phase E+1.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStart}
                className="rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              >
                Start interview
              </button>
            </div>
          )}

          {phase === 'listening' && (
            <div className="mt-6 space-y-3">
              <div className="rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-primary)]">
                {transcript ? (
                  <span>{transcript}</span>
                ) : (
                  <span className="text-[var(--text-muted)]">Start speaking…</span>
                )}
                {interimTranscript && (
                  <span className="text-[var(--text-muted)]"> {interimTranscript}</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                className="rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              >
                Done — evaluate my answer
              </button>
            </div>
          )}

          {phase === 'evaluating' && (
            <p className="mt-4 text-sm text-[var(--text-muted)]">Sending your answer…</p>
          )}

          {phase === 'completed' && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[var(--text-primary)]">
                Interview complete. Drills your coach recommends will appear in the bell.
              </p>
              <Link
                href={`/r/${reportId}/full?tab=coach`}
                className="inline-block rounded-lg border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                See coach report →
              </Link>
            </div>
          )}

          {phase === 'error' && (
            <p className="mt-4 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-3 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}
        </div>

        {turns.length > 0 && (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Past turns</h3>
            <ol className="space-y-3">
              {turns.map((t, i) => (
                <li
                  key={i}
                  className="rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3"
                >
                  <p className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-muted)]">
                    Q{i + 1} {t.score !== null && <>· score {t.score}</>}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">{t.question}</p>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    <strong>You:</strong> {t.answer}
                  </p>
                  {t.feedback && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      <strong>Feedback:</strong> {t.feedback}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
          <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
            Live signals
          </p>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--text-secondary)]">Time speaking</dt>
              <dd className="font-mono text-[var(--text-primary)]">
                {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--text-secondary)]">Filler words</dt>
              <dd className="font-mono text-[var(--text-primary)]">{fillerCount}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--text-secondary)]">Words captured</dt>
              <dd className="font-mono text-[var(--text-primary)]">
                {(transcript + ' ' + interimTranscript).trim().split(/\s+/).filter(Boolean).length}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
          <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
            Settings
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={muted}
              onChange={(e) => {
                setMuted(e.target.checked);
                if (e.target.checked) window.speechSynthesis?.cancel();
              }}
            />
            Mute interviewer voice
          </label>
        </div>

        {phase !== 'idle' && phase !== 'completed' && (
          <button
            type="button"
            onClick={handleEnd}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
          >
            End interview early
          </button>
        )}
      </aside>
    </div>
  );
}
