'use client';

import type { AttachmentMeta } from './types';

export function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: AttachmentMeta;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 border border-[var(--border-default)] bg-[var(--bg-card)] px-2 py-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {attachment.kind}
      </span>
      <span
        className="max-w-[140px] truncate text-[11px] text-[var(--text-primary)]"
        title={attachment.filename}
      >
        {attachment.filename}
      </span>
      <span className="tabular-nums text-[10px] text-[var(--text-muted)]">
        {formatSize(attachment.byteSize)}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(attachment.id)}
          className="ml-1 text-[12px] leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label={`Remove ${attachment.filename}`}
        >
          ×
        </button>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
