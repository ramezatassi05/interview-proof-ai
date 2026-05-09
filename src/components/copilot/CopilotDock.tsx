'use client';

/**
 * Phase C — CopilotDock.
 *
 * Global chat surface mounted in the root layout. Always-on (when logged in),
 * reachable via a floating bottom-right button or ⌘K. Persists across
 * navigation — sessionId is stable for the lifetime of the page.
 *
 * Context resolution:
 *   - On /r/[id]/* routes: uses the route's reportId.
 *   - Otherwise: fetches the user's most recent report once on mount.
 *   - If no report exists yet (new user pre-diagnostic): the dock prompts
 *     them to complete onboarding instead of opening chat.
 *
 * Hidden on:
 *   - Marketing pages (/, /blog, /case-studies, /methodology, etc.)
 *   - Auth pages (/auth/*)
 *   - The diagnostic surface (/r/[id]/full) where CoachChatStub already lives
 *
 * Phase D additions: Outbox link in the dock header.
 * Phase E additions: voice quick-launch button.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api, APIRequestError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useAgentStream } from '@/hooks/useAgentStream';

const HIDDEN_PATH_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/auth(\/|$)/,
  /^\/blog(\/|$)/,
  /^\/case-studies(\/|$)/,
  /^\/methodology(\/|$)/,
  /^\/contact(\/|$)/,
  /^\/privacy(\/|$)/,
  /^\/terms(\/|$)/,
  /^\/risk-simulation(\/|$)/,
  /^\/study-intelligence(\/|$)/,
  /^\/interview-prep(\/|$)/,
  /^\/interview-questions(\/|$)/,
  /^\/onboarding(\/|$)/,
  /^\/interview\/live(\/|$)/,
  /^\/r\/[^/]+\/full(\/|$)/,
  /^\/s\/[^/]+/,
  /^\/waitlist/,
  /^\/admin\/command-center/,
];

function pathReportId(pathname: string): string | null {
  const m = pathname.match(/^\/r\/([0-9a-f-]{36})/i);
  return m ? m[1] : null;
}

function pathIsHidden(pathname: string): boolean {
  return HIDDEN_PATH_PATTERNS.some((re) => re.test(pathname));
}

export function CopilotDock() {
  const { user, loading } = useAuth();
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const [resolvedReportId, setResolvedReportId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const routeReportId = useMemo(() => pathReportId(pathname), [pathname]);
  const reportId = routeReportId ?? resolvedReportId;

  // Resolve the user's latest report once when needed.
  useEffect(() => {
    if (!user || routeReportId || resolvedReportId || resolving) return;
    let cancelled = false;
    setResolving(true);
    (async () => {
      try {
        const res = await api.getLatestReport();
        if (cancelled) return;
        if (res.data?.reportId) setResolvedReportId(res.data.reportId);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof APIRequestError ? err.message : 'Could not load your report.';
        setResolveError(msg);
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, routeReportId, resolvedReportId, resolving]);

  // ⌘K / Ctrl+K toggles open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (loading) return null;
  if (!user) return null;
  if (pathIsHidden(pathname)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close copilot' : 'Open copilot (⌘K)'}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-lg shadow-[var(--accent-primary)]/30 transition-transform hover:scale-110"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {open && (
        <CopilotPanel
          reportId={reportId}
          loadingReport={resolving && !routeReportId}
          resolveError={resolveError}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

interface CopilotPanelProps {
  reportId: string | null;
  loadingReport: boolean;
  resolveError: string | null;
  onClose: () => void;
}

function CopilotPanel({ reportId, loadingReport, resolveError, onClose }: CopilotPanelProps) {
  return (
    <div
      role="dialog"
      aria-label="Career copilot"
      className="fixed bottom-24 right-6 z-40 flex h-[32rem] w-[22rem] flex-col overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl"
    >
      <header className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Career Copilot</p>
          <p className="text-[11px] text-[var(--text-muted)]">⌘K to toggle · Esc to close</p>
        </div>
        <div className="flex items-center gap-2">
          {reportId && (
            <Link
              href={`/interview/live?reportId=${reportId}`}
              className="rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              onClick={onClose}
            >
              🎙 Live
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>
      {loadingReport ? (
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-muted)]">
          Loading your context…
        </div>
      ) : resolveError ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-[var(--color-danger)]">
          {resolveError}
        </div>
      ) : !reportId ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Your copilot needs a diagnostic to ground answers in.
          </p>
          <Link
            href="/new"
            className="rounded-md bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            Start a new analysis
          </Link>
        </div>
      ) : (
        <CopilotChat reportId={reportId} />
      )}
    </div>
  );
}

function CopilotChat({ reportId }: { reportId: string }) {
  const { messages, streamingText, sending, error, send, cancel } = useAgentStream({
    reportId,
  });
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingText]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    await send(text);
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !streamingText && !sending && (
          <div className="rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-muted)]">
            Ask anything about your prep. Try: <em>What should I focus on this week?</em>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white'
                  : 'border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] whitespace-pre-wrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]">
              {streamingText}
              <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-[var(--text-secondary)] align-middle" />
            </div>
          </div>
        )}
        {sending && !streamingText && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-muted)]">
              Thinking…
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="border-t border-[var(--border-default)] bg-[var(--color-danger-muted)] px-4 py-2 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="flex items-end gap-2 border-t border-[var(--border-default)] p-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          rows={2}
          placeholder="Ask anything…"
          disabled={sending}
          className="flex-1 resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)] focus:outline-none disabled:opacity-60"
        />
        {sending ? (
          <button
            type="button"
            onClick={cancel}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] px-3 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        )}
      </form>
    </>
  );
}
