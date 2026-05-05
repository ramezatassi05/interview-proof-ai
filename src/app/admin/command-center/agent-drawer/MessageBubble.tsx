'use client';

import { ToolCallCard } from './ToolCallCard';
import type { ChatMessage, ToolCallView } from './types';

interface MessageBubbleProps {
  message: ChatMessage;
  toolCallById?: Map<string, ToolCallView>;
}

export function MessageBubble({ message, toolCallById }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-primary)]">
            {message.text}
          </p>
        </div>
      </div>
    );
  }

  const calls = toolCallById ?? new Map(message.toolCalls.map((c) => [c.id, c]));

  if (message.segments && message.segments.length > 0) {
    return (
      <div className="flex flex-col gap-1">
        {message.segments.map((seg, idx) => {
          if (seg.kind === 'text') {
            if (!seg.text.trim()) return null;
            return (
              <p
                key={idx}
                className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-secondary)]"
              >
                {seg.text}
              </p>
            );
          }
          const call = calls.get(seg.toolCallId);
          if (!call) return null;
          return <ToolCallCard key={`${seg.toolCallId}-${idx}`} call={call} />;
        })}
        {message.truncated && (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
            Stream truncated
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {message.toolCalls.map((c) => (
        <ToolCallCard key={c.id} call={c} />
      ))}
      {message.text.trim() && (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-secondary)]">
          {message.text}
        </p>
      )}
    </div>
  );
}
