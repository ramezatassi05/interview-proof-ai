'use client';

import { useEffect, useState } from 'react';
import { Markdown } from '../../_markdown';

interface ToolCallView {
  id: string;
  skillId: string;
  status: 'running' | 'succeeded' | 'failed' | 'awaiting_approval';
  error?: string;
  linkedActionId?: string | null;
  latencyMs?: number;
}

interface MessageView {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  toolCalls: ToolCallView[];
  createdAtIso?: string;
  truncated?: boolean;
}

interface IdeaStatusPayload {
  status: 'triaging' | 'routed' | 'completed' | 'failed';
}

const STILL_ACTIVE = new Set(['triaging']);

export function TriageTranscript({
  sessionId,
  ideaId,
  initialStatus,
}: {
  sessionId: string;
  ideaId: string;
  initialStatus: 'triaging' | 'routed' | 'completed' | 'failed';
}) {
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const [msgRes, ideaRes] = await Promise.all([
          fetch(`/api/admin/company-agent/sessions/${encodeURIComponent(sessionId)}/messages`, {
            cache: 'no-store',
          }),
          fetch(`/api/ceo/idea/${encodeURIComponent(ideaId)}/status`, { cache: 'no-store' }),
        ]);
        if (cancelled) return;
        if (msgRes.ok) {
          const json = (await msgRes.json()) as { messages?: MessageView[] };
          setMessages(json.messages ?? []);
        }
        if (ideaRes.ok) {
          const json = (await ideaRes.json()) as IdeaStatusPayload;
          setStatus(json.status);
        }
      } catch {
        // swallow — we'll retry on the next tick
      } finally {
        if (cancelled) return;
        setLoading(false);
        if (STILL_ACTIVE.has(status)) {
          timer = setTimeout(tick, 2500);
        }
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // We re-run when status transitions out of 'triaging' so polling stops cleanly.
  }, [sessionId, ideaId, status]);

  if (loading && messages.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
        Loading transcript…
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
        Orchestrator hasn’t started yet — checking again…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {messages.map((m) => (
        <div
          key={m.id}
          className={
            m.role === 'user'
              ? 'border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2'
              : 'border border-[var(--border-default)]/70 bg-[var(--bg-elevated)] px-3 py-2'
          }
        >
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
            {m.role === 'user' ? 'You (CEO)' : 'CEO orchestrator'}
          </p>
          {m.text && (
            <div className="mt-1">
              <Markdown text={m.text} />
            </div>
          )}
          {m.toolCalls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {m.toolCalls.map((tc) => (
                <span
                  key={tc.id}
                  className="border border-[var(--border-default)] bg-[var(--bg-card)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
                  title={tc.error ?? ''}
                >
                  {tc.skillId}
                  <span
                    className={`ml-1 ${
                      tc.status === 'failed'
                        ? 'text-[var(--color-danger)]'
                        : tc.status === 'succeeded'
                          ? 'text-[var(--text-muted)]'
                          : 'text-[var(--accent-primary)]'
                    }`}
                  >
                    · {tc.status}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
      {STILL_ACTIVE.has(status) && (
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span className="h-2 w-2 animate-pulse bg-[var(--accent-primary)]" aria-hidden />
          Triaging…
        </div>
      )}
    </div>
  );
}
