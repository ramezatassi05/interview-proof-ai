'use client';

import { useCallback, useRef, useState } from 'react';
import { AttachmentChip } from './AttachmentChip';
import type { AttachmentMeta } from './types';

interface AttachmentTrayProps {
  attachments: AttachmentMeta[];
  onUploaded?: (uploaded: AttachmentMeta[]) => void;
  onRemove?: (id: string) => void;
  sessionId?: string | null;
  hint?: string;
  disabled?: boolean;
}

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.txt,.md,application/pdf,image/png,image/jpeg,image/webp,text/plain,text/markdown';

export function AttachmentTray({
  attachments,
  onUploaded,
  onRemove,
  sessionId,
  hint,
  disabled,
}: AttachmentTrayProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || !onUploaded || disabled) return;
      setUploading(true);
      setError(null);
      try {
        const fd = new FormData();
        for (const f of files) fd.append('files', f);
        if (sessionId) fd.append('sessionId', sessionId);
        const res = await fetch('/api/admin/company-agent/upload', {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) {
          let msg = `Upload failed (${res.status})`;
          try {
            const json = (await res.json()) as { error?: string };
            if (json.error) msg = json.error;
          } catch {
            // not JSON
          }
          setError(msg);
          return;
        }
        const json = (await res.json()) as { data?: AttachmentMeta[] };
        if (json.data && json.data.length > 0) {
          onUploaded(json.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [onUploaded, sessionId, disabled]
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) void upload(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) void upload(files);
  };

  const showRow = attachments.length > 0 || uploading || error || hint || !!onUploaded;
  if (!showRow) return null;

  return (
    <div
      onDragOver={(e) => {
        if (disabled || !onUploaded) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`flex flex-wrap items-center gap-1.5 border-t px-3 py-1.5 transition-colors ${
        dragOver
          ? 'border-[var(--border-accent)] bg-[var(--accent-muted)]'
          : 'border-[var(--border-default)] bg-[var(--bg-elevated)]'
      }`}
    >
      {onUploaded && (
        <label
          aria-disabled={disabled || uploading}
          className={`relative cursor-pointer border border-[var(--border-default)] bg-[var(--bg-card)] px-2 py-1 text-[11px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--text-primary)] ${
            disabled || uploading ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            onChange={onPick}
            disabled={disabled || uploading}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          Attach
        </label>
      )}
      {attachments.map((att) => (
        <AttachmentChip key={att.id} attachment={att} onRemove={onRemove} />
      ))}
      {uploading && (
        <span className="text-[11px] text-[var(--text-muted)]">Uploading…</span>
      )}
      {!uploading && error && (
        <span className="text-[11px] text-[var(--color-danger)]">{error}</span>
      )}
      {!uploading && !error && attachments.length === 0 && hint && (
        <span className="text-[11px] text-[var(--text-muted)]">{hint}</span>
      )}
      {!uploading && !error && onUploaded && attachments.length === 0 && !hint && (
        <span className="text-[11px] text-[var(--text-muted)]">
          Drag a PDF, image, or text file here.
        </span>
      )}
    </div>
  );
}
