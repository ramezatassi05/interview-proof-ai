'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { ToolCallCard } from './ToolCallCard';
import type { ChatMessage, ToolCallView } from './types';

interface MessageBubbleProps {
  message: ChatMessage;
  toolCallById?: Map<string, ToolCallView>;
}

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-secondary)]">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-1 list-disc space-y-0.5 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 list-decimal space-y-0.5 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="break-words">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-1 border-l-2 border-[var(--border-default)] pl-3 text-sm italic leading-relaxed text-[var(--text-muted)]">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const inline = !className;
    if (inline) {
      return (
        <code className="rounded bg-[var(--bg-elevated)] px-1 py-0.5 text-[12px] font-mono text-[var(--text-primary)]">
          {children}
        </code>
      );
    }
    return (
      <code className="block whitespace-pre overflow-x-auto rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] p-2 text-[12px] font-mono text-[var(--text-primary)]">
        {children}
      </code>
    );
  },
  h1: ({ children }) => (
    <h4 className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">{children}</h4>
  ),
  h2: ({ children }) => (
    <h4 className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
      {children}
    </h5>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[var(--text-accent)] underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-2 border-[var(--border-default)]" />,
};

function Markdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  );
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
            return <Markdown key={idx} text={seg.text} />;
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
      {message.text.trim() && <Markdown text={message.text} />}
    </div>
  );
}
