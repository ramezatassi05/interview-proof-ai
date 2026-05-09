'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  AgentAction,
  AgentActionType,
  ApprovalModalProps,
  ResumeBulletAlternative,
} from '@/types';

const ACTION_TYPE_LABELS: Record<AgentActionType, string> = {
  recommend_drill: 'Recommended drill',
  start_mock_interview: 'Mock interview',
  score_answer: 'Score answer',
  draft_recruiter_reply: 'Draft recruiter reply',
  rewrite_resume_bullet: 'Rewrite resume bullet',
  create_company_brief: 'Company brief',
  update_prep_plan: 'Prep plan update',
  propose_opportunity_update: 'Opportunity update',
  summarize_progress: 'Progress summary',
  delegate_to_specialist: 'Hand off to specialist',
};

interface ResumeAlternativesEvidence {
  kind?: string;
  targetRequirement?: string;
  critiqueOfOriginal?: string;
  alternatives?: ResumeBulletAlternative[];
}

function pickResumeAlternatives(action: AgentAction): ResumeAlternativesEvidence | null {
  if (!action.evidenceRefsJson || !Array.isArray(action.evidenceRefsJson)) return null;
  for (const ref of action.evidenceRefsJson) {
    if (
      ref &&
      typeof ref === 'object' &&
      (ref as ResumeAlternativesEvidence).kind === 'resume_bullet_alternatives'
    ) {
      return ref as ResumeAlternativesEvidence;
    }
  }
  return null;
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function ActionApprovalModal({ open, onClose, actionId, onResolved }: ApprovalModalProps) {
  const [action, setAction] = useState<AgentAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Per-action-type local edit state
  const [selectedAlternativeIndex, setSelectedAlternativeIndex] = useState<number>(0);
  const [editedBullet, setEditedBullet] = useState<string>('');
  const [editedSubject, setEditedSubject] = useState<string>('');
  const [editedBody, setEditedBody] = useState<string>('');

  // Fetch action when opened.
  useEffect(() => {
    if (!open || !actionId) {
      setAction(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/agent/actions/${actionId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Failed to load action (${res.status})`);
        }
        const json = await res.json();
        if (cancelled) return;
        const fetched = json.data as AgentAction;
        setAction(fetched);

        // Initialize edit state.
        if (fetched.actionType === 'rewrite_resume_bullet') {
          const evidence = pickResumeAlternatives(fetched);
          const alts = evidence?.alternatives ?? [];
          setSelectedAlternativeIndex(0);
          if (alts.length > 0) {
            setEditedBullet(alts[0].bullet);
          } else {
            setEditedBullet(asString(fetched.payloadJson.rewrittenBullet));
          }
        } else if (fetched.actionType === 'draft_recruiter_reply') {
          setEditedSubject(asString(fetched.payloadJson.subject));
          setEditedBody(asString(fetched.payloadJson.body));
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load action');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, actionId]);

  // When the user picks a different resume alternative, prefill the editor.
  const resumeEvidence = useMemo(
    () => (action?.actionType === 'rewrite_resume_bullet' ? pickResumeAlternatives(action) : null),
    [action]
  );
  const alternatives = useMemo<ResumeBulletAlternative[]>(
    () => resumeEvidence?.alternatives ?? [],
    [resumeEvidence]
  );

  const handleSelectAlternative = useCallback(
    (idx: number) => {
      setSelectedAlternativeIndex(idx);
      const alt = alternatives[idx];
      if (alt) setEditedBullet(alt.bullet);
    },
    [alternatives]
  );

  const handleApprove = useCallback(async () => {
    if (!action) return;
    setSubmitting(true);

    let payloadJson: Record<string, unknown> | undefined;
    if (action.actionType === 'rewrite_resume_bullet') {
      payloadJson = {
        ...action.payloadJson,
        rewrittenBullet: editedBullet,
        bullet: editedBullet, // tolerate either key downstream
        selectedAlternativeIndex,
      };
    } else if (action.actionType === 'draft_recruiter_reply') {
      payloadJson = {
        ...action.payloadJson,
        subject: editedSubject,
        body: editedBody,
      };
    }

    try {
      const res = await fetch(`/api/agent/actions/${action.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          ...(payloadJson ? { payloadJson } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Approve failed (${res.status})`);
      }
      toast.success('Action approved.');
      onResolved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setSubmitting(false);
    }
  }, [
    action,
    editedBullet,
    editedSubject,
    editedBody,
    selectedAlternativeIndex,
    onResolved,
    onClose,
  ]);

  const handleReject = useCallback(async () => {
    if (!action) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/agent/actions/${action.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', error: 'User rejected' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Reject failed (${res.status})`);
      }
      toast.success('Action rejected.');
      onResolved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setSubmitting(false);
    }
  }, [action, onResolved, onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-labelledby="approval-modal-title"
      >
        <DialogHeader>
          <DialogTitle id="approval-modal-title">
            {action
              ? (ACTION_TYPE_LABELS[action.actionType] ?? action.actionType)
              : 'Pending Approval'}
          </DialogTitle>
          {action && (
            <DialogDescription>
              Review the agent&apos;s draft below. Nothing is sent or stored until you approve.
            </DialogDescription>
          )}
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12 text-sm text-[var(--text-muted)]">
            Loading action…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-4 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {!loading && !error && action && (
          <div className="space-y-4">
            {/* Header meta: external badge + status */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-1 font-mono uppercase tracking-wide text-[var(--text-muted)]">
                {action.status}
              </span>
              {action.requiresExternalSend && (
                <span className="rounded-full border border-[var(--color-warning)]/40 bg-[var(--color-warning-muted)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-warning)]">
                  Requires external send
                </span>
              )}
            </div>

            {/* Per-action-type body */}
            {action.actionType === 'recommend_drill' && <RecommendDrillView action={action} />}
            {action.actionType === 'rewrite_resume_bullet' && (
              <RewriteResumeBulletView
                action={action}
                alternatives={alternatives}
                selectedIndex={selectedAlternativeIndex}
                onSelectIndex={handleSelectAlternative}
                editedBullet={editedBullet}
                onEditBullet={setEditedBullet}
                critique={resumeEvidence?.critiqueOfOriginal}
              />
            )}
            {action.actionType === 'draft_recruiter_reply' && (
              <DraftRecruiterReplyView
                subject={editedSubject}
                onChangeSubject={setEditedSubject}
                body={editedBody}
                onChangeBody={setEditedBody}
              />
            )}
            {action.actionType !== 'recommend_drill' &&
              action.actionType !== 'rewrite_resume_bullet' &&
              action.actionType !== 'draft_recruiter_reply' && (
                <GenericPayloadView action={action} />
              )}

            {/* Evidence refs */}
            {Array.isArray(action.evidenceRefsJson) && action.evidenceRefsJson.length > 0 && (
              <EvidenceRefsView refs={action.evidenceRefsJson} />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-[var(--border-default)] pt-4">
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting}
                className="rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting}
                className="rounded-md border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Approve'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Per-action-type views ── */

function RecommendDrillView({ action }: { action: AgentAction }) {
  const riskId = asString(action.payloadJson.riskId, 'unknown');
  const reason = asString(action.payloadJson.reason);
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
          Mapped risk
        </p>
        <p className="mt-1 text-sm text-[var(--text-primary)]">{riskId}</p>
      </div>
      <div>
        <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
          Why this drill
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{reason}</p>
      </div>
    </div>
  );
}

function RewriteResumeBulletView({
  action,
  alternatives,
  selectedIndex,
  onSelectIndex,
  editedBullet,
  onEditBullet,
  critique,
}: {
  action: AgentAction;
  alternatives: ResumeBulletAlternative[];
  selectedIndex: number;
  onSelectIndex: (i: number) => void;
  editedBullet: string;
  onEditBullet: (v: string) => void;
  critique?: string;
}) {
  const original = asString(action.payloadJson.originalBullet);
  const hasAlternatives = alternatives.length > 0;

  return (
    <div className="space-y-4">
      {critique && (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
          <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
            Critique of original
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{critique}</p>
        </div>
      )}

      {hasAlternatives && (
        <div>
          <p className="mb-2 text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
            Choose an alternative
          </p>
          <div className="space-y-2">
            {alternatives.map((alt, idx) => (
              <label
                key={idx}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                  selectedIndex === idx
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                    : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--border-accent)]'
                }`}
              >
                <input
                  type="radio"
                  className="mt-1 accent-[var(--accent-primary)]"
                  checked={selectedIndex === idx}
                  onChange={() => onSelectIndex(idx)}
                  name="resume-alternative"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-primary)]">{alt.bullet}</p>
                  {alt.rationale && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{alt.rationale}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
            Original
          </p>
          <div className="mt-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 text-sm text-[var(--text-secondary)]">
            {original || <span className="italic">No original provided</span>}
          </div>
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
            Selected (editable)
          </p>
          <textarea
            value={editedBullet}
            onChange={(e) => onEditBullet(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function DraftRecruiterReplyView({
  subject,
  onChangeSubject,
  body,
  onChangeBody,
}: {
  subject: string;
  onChangeSubject: (v: string) => void;
  body: string;
  onChangeBody: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
          Subject
        </label>
        <input
          value={subject}
          onChange={(e) => onChangeSubject(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
          Body
        </label>
        <textarea
          value={body}
          onChange={(e) => onChangeBody(e.target.value)}
          rows={8}
          className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
        />
      </div>
    </div>
  );
}

function GenericPayloadView({ action }: { action: AgentAction }) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
        Draft payload
      </p>
      <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-secondary)]">
        {JSON.stringify(action.payloadJson, null, 2)}
      </pre>
    </div>
  );
}

function EvidenceRefsView({ refs }: { refs: unknown[] }) {
  return (
    <details className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 text-xs">
      <summary className="cursor-pointer font-mono uppercase tracking-wide text-[var(--text-muted)]">
        Evidence references ({refs.length})
      </summary>
      <ul className="mt-2 space-y-1 text-[var(--text-secondary)]">
        {refs.map((ref, i) => {
          const obj = (ref ?? {}) as Record<string, unknown>;
          const kind = asString(obj.kind, 'unknown');
          const id = asString(obj.id);
          return (
            <li key={i} className="font-mono">
              {kind}
              {id ? `: ${id}` : ''}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
