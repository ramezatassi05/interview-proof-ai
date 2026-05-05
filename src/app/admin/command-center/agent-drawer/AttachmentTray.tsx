'use client';

import { AttachmentChip } from './AttachmentChip';
import type { AttachmentMeta } from './types';

interface AttachmentTrayProps {
  attachments: AttachmentMeta[];
  onRemove?: (id: string) => void;
  uploading?: boolean;
  hint?: string;
}

export function AttachmentTray({ attachments, onRemove, uploading, hint }: AttachmentTrayProps) {
  if (attachments.length === 0 && !uploading && !hint) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5">
      {attachments.map((att) => (
        <AttachmentChip key={att.id} attachment={att} onRemove={onRemove} />
      ))}
      {uploading && <span className="text-[11px] text-[var(--text-muted)]">Uploading…</span>}
      {!uploading && hint && attachments.length === 0 && (
        <span className="text-[11px] text-[var(--text-muted)]">{hint}</span>
      )}
    </div>
  );
}
