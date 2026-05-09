'use client';

/**
 * useAgentStream — client hook for SSE-streamed chat responses from
 * /api/agent/chat/stream. Owns the optimistic message list, the in-flight
 * "agent typing" placeholder, and the cancellation lifecycle.
 *
 * Returned shape:
 *   - messages:        the conversation transcript (user + agent)
 *   - streamingText:   the currently-streaming agent reply (empty when idle)
 *   - sending:         true while a request is open
 *   - error:           last error message (cleared on next send)
 *   - sessionId:       resolved after first successful start
 *   - send(text):      send a new user message
 *   - cancel():        abort the current stream
 *
 * Designed to be reusable across the Coach tab today and the global copilot
 * dock in Phase C.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, APIRequestError } from '@/lib/api';

export interface ChatUiMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

export interface UseAgentStreamArgs {
  reportId: string;
  initialSessionId?: string | null;
  /** When true, fetches existing messages for `initialSessionId` on mount. */
  hydrateExisting?: boolean;
}

export interface UseAgentStreamResult {
  messages: ChatUiMessage[];
  streamingText: string;
  sending: boolean;
  error: string | null;
  sessionId: string | null;
  send: (text: string) => Promise<void>;
  cancel: () => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function extractMessageText(content: Record<string, unknown> | null | undefined): string {
  if (!content) return '';
  if (typeof content.text === 'string') return content.text;
  // Fallback: orchestrator messages have summary; show that as a non-chat preview.
  if (typeof content.summary === 'string') return content.summary;
  return '';
}

export function useAgentStream(args: UseAgentStreamArgs): UseAgentStreamResult {
  const { reportId, initialSessionId = null, hydrateExisting = true } = args;
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const abortRef = useRef<AbortController | null>(null);

  // Hydrate existing transcript on first mount when a session id is known.
  useEffect(() => {
    if (!initialSessionId || !hydrateExisting) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.listAgentMessages(initialSessionId, {
          limit: 50,
          direction: 'asc',
        });
        if (cancelled) return;
        const ui: ChatUiMessage[] = [];
        for (const m of data) {
          if (m.role !== 'user' && m.role !== 'agent') continue;
          const text = extractMessageText(m.contentJson);
          if (!text) continue;
          ui.push({ id: m.id, role: m.role, text });
        }
        setMessages(ui);
      } catch (err) {
        // Hydration failure is non-fatal — start with empty transcript.
        if (!cancelled) {
          console.error('[useAgentStream] hydrate failed:', err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSessionId, hydrateExisting]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || sending) return;

      setError(null);
      setSending(true);
      setStreamingText('');

      const userMsgId = uid('local-user');
      setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text }]);

      const controller = new AbortController();
      abortRef.current = controller;

      let resolvedSessionId = sessionId;
      try {
        const response = await fetch('/api/agent/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId,
            sessionId: resolvedSessionId ?? undefined,
            userMessage: text,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = `Request failed (${response.status})`;
          try {
            const body = (await response.json()) as { error?: string };
            if (body.error) message = body.error;
          } catch {
            // ignore
          }
          throw new APIRequestError(message, response.status);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let accumulated = '';
        // Stream loop: parse SSE frames separated by blank lines.
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';
          for (const frame of frames) {
            if (!frame.trim()) continue;
            const lines = frame.split('\n');
            let eventName: string | null = null;
            const dataLines: string[] = [];
            for (const line of lines) {
              if (line.startsWith('event: ')) eventName = line.slice(7).trim();
              else if (line.startsWith('data: ')) dataLines.push(line.slice(6));
            }
            const data = dataLines.join('\n').replace(/\\n/g, '\n');

            if (eventName === 'done') {
              // tokens metadata; nothing to render
              continue;
            }
            if (eventName === 'error') {
              throw new Error(data || 'Stream error');
            }
            if (!eventName) {
              if (!resolvedSessionId) {
                try {
                  const meta = JSON.parse(data) as { sessionId?: string };
                  if (meta.sessionId) {
                    resolvedSessionId = meta.sessionId;
                    setSessionId(meta.sessionId);
                    continue;
                  }
                } catch {
                  // not JSON — fall through to render
                }
              }
              accumulated += data;
              setStreamingText(accumulated);
            }
          }
        }

        // Stream closed cleanly — commit the agent message.
        if (accumulated.length > 0) {
          const agentMsgId = uid('local-agent');
          setMessages((prev) => [...prev, { id: agentMsgId, role: 'agent', text: accumulated }]);
        }
        setStreamingText('');
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') {
          // user cancelled — drop the in-flight reply but keep the user msg
          setStreamingText('');
        } else {
          const msg =
            err instanceof APIRequestError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Failed to send.';
          setError(msg);
          // Roll back the user message so they can edit + retry.
          setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
          setStreamingText('');
        }
      } finally {
        setSending(false);
        abortRef.current = null;
      }
    },
    [reportId, sessionId, sending]
  );

  return {
    messages,
    streamingText,
    sending,
    error,
    sessionId,
    send,
    cancel,
  };
}
