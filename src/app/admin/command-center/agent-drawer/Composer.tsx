'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface ComposerProps {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  onAbort?: () => void;
  busy: boolean;
  placeholder?: string;
  attachmentSlot?: React.ReactNode;
}

export function Composer({
  value,
  onChange,
  onSend,
  onAbort,
  busy,
  placeholder,
  attachmentSlot,
}: ComposerProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = '0px';
    const next = Math.min(el.scrollHeight, 240);
    el.style.height = `${next}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!busy) onSend();
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2">
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="min-h-[44px] w-full resize-none border border-[var(--border-default)] bg-[var(--bg-primary)] p-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--border-accent)]"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {attachmentSlot}
          <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
            {value.length} chars
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            <kbd className="border border-[var(--border-default)] bg-[var(--bg-primary)] px-1 py-0.5 font-mono text-[10px]">
              ⌘↵
            </kbd>{' '}
            send
          </span>
        </div>
        <div className="flex items-center gap-2">
          {busy && onAbort && (
            <Button variant="ghost" size="sm" onClick={onAbort}>
              Stop
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            disabled={busy || !value.trim()}
            loading={busy}
            onClick={onSend}
          >
            {busy ? 'Streaming' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
