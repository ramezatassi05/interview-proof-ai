'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { relativeTime } from '@/lib/relative-time';
import { agentMeta } from './agents';
import type { CompanyTask } from './TaskKanban';
import type { CompanyTaskOwnerKind, CompanyTaskStatus } from '@/server/agents/company/types';
import { Markdown } from './_markdown';

const STATUS_LABEL: Record<CompanyTaskStatus, string> = {
  todo: 'Backlog',
  doing: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
  canceled: 'Canceled',
};

function ownerLabel(kind: CompanyTaskOwnerKind): string {
  return agentMeta(kind).label.replace('Director of ', '');
}

export function TaskDetailDialog({
  task,
  onClose,
  onCancelTask,
}: {
  task: CompanyTask | null;
  onClose: () => void;
  onCancelTask?: (taskId: string) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!task) return null;
  const open = true;
  const canCancel = task.status !== 'done' && task.status !== 'canceled';

  const handleCancel = async () => {
    if (!onCancelTask) return;
    setBusy(true);
    setCancelError(null);
    try {
      await onCancelTask(task.id);
      setConfirming(false);
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : 'Could not cancel task');
    } finally {
      setBusy(false);
    }
  };

  const fromCeo = task.delegatedBy === 'ceo_orchestrator';
  const isEscalated = !!task.escalatedAt;
  const fromPeer = !!task.requesterKind && task.requesterKind !== 'ceo_orchestrator';
  const requesterLabel = fromPeer
    ? agentMeta(task.requesterKind as CompanyTaskOwnerKind).label.replace('Director of ', '')
    : null;

  const dueDateFull = task.dueAt
    ? new Date(task.dueAt).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl" aria-describedby={undefined}>
        <DialogHeader className="mb-4">
          <div className="flex flex-wrap items-center gap-1.5 pr-8">
            <Badge variant="default">{ownerLabel(task.ownerKind)}</Badge>
            {fromCeo && <Badge variant="accent">from CEO</Badge>}
            {fromPeer && <Badge variant="default">from {requesterLabel}</Badge>}
            {isEscalated && <Badge variant="default">escalated</Badge>}
          </div>
          <DialogTitle className="mt-3 font-serif text-2xl leading-tight">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {task.description && <Markdown text={task.description} />}

          {fromCeo && task.delegationRationale && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Why this was delegated
              </p>
              <div className="mt-1.5 italic">
                <Markdown text={`“${task.delegationRationale}”`} />
              </div>
            </div>
          )}

          {isEscalated && (
            <div className="border-l-2 border-l-[var(--color-warning,#f5a524)] pl-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-warning,#f5a524)]">
                Escalated · {relativeTime(task.escalatedAt!)}
              </p>
              {task.escalationReason && (
                <div className="mt-1.5">
                  <Markdown text={task.escalationReason} />
                </div>
              )}
            </div>
          )}

          {task.resolution && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Resolution{task.resolvedAt ? ` · ${relativeTime(task.resolvedAt)}` : ''}
              </p>
              <div className="mt-1.5">
                <Markdown text={task.resolution} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 border-t border-[var(--border-default)]/60 pt-4 text-[11px] tabular-nums sm:grid-cols-4">
            <Meta label="Status" value={STATUS_LABEL[task.status] ?? task.status} />
            <Meta label="Due" value={dueDateFull ?? '—'} />
            <Meta label="Updated" value={relativeTime(task.updatedAt)} />
            <Meta label="Created" value={relativeTime(task.createdAt)} />
          </div>

          {canCancel && onCancelTask && (
            <div className="flex flex-col gap-2 border-t border-[var(--border-default)]/60 pt-4">
              {cancelError && (
                <p className="text-[11px] text-[var(--color-danger)]">{cancelError}</p>
              )}
              {confirming ? (
                <div className="flex items-center justify-end gap-2">
                  <span className="mr-auto text-[12px] text-[var(--text-secondary)]">
                    Cancel this task? It will be removed from the board.
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirming(false)}
                    disabled={busy}
                  >
                    Keep
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleCancel}
                    loading={busy}
                    disabled={busy}
                  >
                    Cancel task
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirming(true)}
                    className="text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                  >
                    Cancel task
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </span>
      <span className="text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
