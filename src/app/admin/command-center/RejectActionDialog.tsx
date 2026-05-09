'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/Textarea';
import type { CompanyAction } from './_approvals';

export interface RejectActionDialogProps {
  action: CompanyAction | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, feedback: string | null) => void | Promise<void>;
}

export function RejectActionDialog({
  action,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: RejectActionDialogProps) {
  const [feedback, setFeedback] = useState('');

  if (!action) return null;

  const trimmed = feedback.trim();
  const hasFeedback = trimmed.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !pending && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject this proposal?</DialogTitle>
          <DialogDescription className="break-words text-[var(--text-secondary)]">
            {action.title}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-2">
          <label
            htmlFor="reject-feedback"
            className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
          >
            What should the agent do differently? (optional)
          </label>
          <Textarea
            id="reject-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Tighten the tone, add a metric for X, target a different audience…"
            rows={5}
            disabled={pending}
            maxLength={2000}
            autoFocus
          />
          <p className="text-[11px] text-[var(--text-muted)]">
            Leave empty to reject without feedback. With feedback, the agent will draft a new
            version that addresses what you wrote.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onConfirm(action.id, null)}
            disabled={pending}
          >
            Reject only
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={pending && hasFeedback}
            disabled={pending || !hasFeedback}
            onClick={() => onConfirm(action.id, trimmed)}
          >
            Reject &amp; ask for redo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
