'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

export const MARKDOWN_COMPONENTS: Components = {
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

export function Markdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
