'use client';

import { useState } from 'react';
import { api, APIRequestError } from '@/lib/api';
import type { AgentSession } from '@/types';

interface CoachChatStubProps {
  reportId: string;
  latestSession: AgentSession | null;
}

interface UiMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

export function CoachChatStub({ reportId, latestSession }: CoachChatStubProps) {
  const [sessionId, setSessionId] = useState<string | null>(latestSession?.id ?? null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);

    const localId = `local-${Date.now()}`;
    setMessages((prev) => [...prev, { id: localId, role: 'user', text }]);
    setDraft('');

    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const created = await api.createAgentSession({
          agentKind: 'orchestrator',
          reportId,
        });
        activeSessionId = created.data.id;
        setSessionId(activeSessionId);
      }

      await api.appendAgentMessage(activeSessionId, {
        role: 'user',
        contentJson: { text },
      });
    } catch (err) {
      const msg =
        err instanceof APIRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to send.';
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== localId));
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
      <div className="px-6 pt-4 pb-2 border-b border-[var(--border-default)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Talk to your coach</h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Send a message to start a session. Your coach will respond once the orchestrator agent
          ships — messages you send now are saved to your session history.
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No messages yet. Try: “Where should I focus this week?”
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white'
                      : 'border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))
          )}
          {messages.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-muted)]">
                Your coach will respond once enabled.
              </div>
            </div>
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
            void send();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder="Ask your coach…"
            disabled={sending}
            className="flex-1 resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
