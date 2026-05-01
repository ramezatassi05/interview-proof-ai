'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Opportunity } from '@/types';
import { StageBadge } from './StageBadge';
import { OpportunityForm } from './OpportunityForm';

interface OpportunityDetailProps {
  open: boolean;
  opportunity: Opportunity | null;
  onClose: () => void;
  onUpdated: (opp: Opportunity) => void;
  onArchived: (id: string) => void;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function OpportunityDetail({
  open,
  opportunity,
  onClose,
  onUpdated,
  onArchived,
}: OpportunityDetailProps) {
  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);

  if (!opportunity) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const handleArchive = async () => {
    if (!opportunity) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Archive failed (${res.status})`);
      }
      toast.success('Opportunity archived');
      onArchived(opportunity.id);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{opportunity.companyName}</DialogTitle>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{opportunity.roleTitle}</p>
        </DialogHeader>

        {editing ? (
          <OpportunityForm
            initial={opportunity}
            onSaved={(opp) => {
              onUpdated(opp);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StageBadge stage={opportunity.stage} size="md" />
              {opportunity.archived && (
                <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Archived
                </span>
              )}
            </div>

            <div className="grid gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 text-sm">
              <div>
                <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
                  Interview date
                </p>
                <p className="mt-1 text-[var(--text-primary)]">
                  {formatDateTime(opportunity.interviewDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[var(--text-secondary)]">
                  {opportunity.notes ?? <span className="italic">No notes yet</span>}
                </p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
                  Created
                </p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  {formatDateTime(opportunity.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border-default)] pt-4">
              {!opportunity.archived && (
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={archiving}
                  className="rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-50"
                >
                  {archiving ? 'Archiving…' : 'Archive'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
