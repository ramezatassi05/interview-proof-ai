'use client';

import { useEffect, useRef, useState } from 'react';
import { useAgentStream } from '@/hooks/useAgentStream';
import type { AgentSession } from '@/types';

interface CoachChatStubProps {
  reportId: string;
  latestSession: AgentSession | null;
}

export function CoachChatStub({ reportId, latestSession }: CoachChatStubProps) {
  const { messages, streamingText, sending, error, send, cancel } = useAgentStream({
    reportId,
    initialSessionId: latestSession?.id ?? null,
  });
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingText]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    await send(text);
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
      <div className="px-6 pt-4 pb-2 border-b border-[var(--border-default)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Talk to your coach</h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Ask about your weak areas, your prep plan, or anything you&apos;re stuck on. For
          structured action proposals, hit the orchestrator from the Today panel.
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto">
          {messages.length === 0 && !streamingText ? (
            <p className="text-sm text-[var(--text-muted)]">
              No messages yet. Try: &ldquo;Where should I focus this week?&rdquo;
            </p>
          ) : (
            <>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
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
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]">
                    {streamingText}
                    <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-[var(--text-secondary)] align-middle" />
                  </div>
                </div>
              )}
              {sending && !streamingText && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-muted)]">
                    Coach is thinking…
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="flex items-end gap-2"
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
            placeholder="Ask your coach…"
            disabled={sending}
            className="flex-1 resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 disabled:opacity-60"
          />
          {sending ? (
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
