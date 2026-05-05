'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage, ChatSegment, ToolCallView } from './types';

interface MessageListProps {
  messages: ChatMessage[];
  inFlight: {
    id: string;
    segments: ChatSegment[];
    toolCalls: Map<string, ToolCallView>;
    text: string;
  } | null;
  status: 'idle' | 'opening' | 'streaming' | 'error' | 'aborted';
  emptyHint?: string;
}

export function MessageList({ messages, inFlight, status, emptyHint }: MessageListProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new content. Honors user scrolling up: only auto-scrolls
  // when already near the bottom.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 120) {
      el.scrollTop = el.scrollHeight;
    }
  });

  const isEmpty = messages.length === 0 && !inFlight;

  return (
    <div ref={scrollerRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {isEmpty && emptyHint && (
        <div className="m-auto max-w-md text-center">
          <p className="text-sm text-[var(--text-muted)]">{emptyHint}</p>
        </div>
      )}

      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}

      {inFlight && (
        <MessageBubble
          message={{
            id: inFlight.id,
            role: 'assistant',
            text: inFlight.text,
            segments: inFlight.segments,
            toolCalls: Array.from(inFlight.toolCalls.values()),
          }}
          toolCallById={inFlight.toolCalls}
        />
      )}

      {status === 'opening' && !inFlight && (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="h-2 w-2 animate-pulse bg-[var(--accent-primary)]" aria-hidden />
          Connecting…
        </div>
      )}

      {status === 'streaming' &&
        inFlight &&
        inFlight.text === '' &&
        inFlight.toolCalls.size === 0 && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="h-2 w-2 animate-pulse bg-[var(--accent-primary)]" aria-hidden />
            Thinking…
          </div>
        )}
    </div>
  );
}
