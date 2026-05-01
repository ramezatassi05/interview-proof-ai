'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Opportunity, OpportunityStage } from '@/types';
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS } from '@/lib/opportunities';

interface OpportunityFormProps {
  initial?: Opportunity | null;
  onSaved: (opp: Opportunity) => void;
  onCancel: () => void;
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // datetime-local expects YYYY-MM-DDTHH:mm in local TZ
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function OpportunityForm({ initial, onSaved, onCancel }: OpportunityFormProps) {
  const [companyName, setCompanyName] = useState(initial?.companyName ?? '');
  const [roleTitle, setRoleTitle] = useState(initial?.roleTitle ?? '');
  const [stage, setStage] = useState<OpportunityStage>(initial?.stage ?? 'applied');
  const [interviewDate, setInterviewDate] = useState(toLocalInput(initial?.interviewDate));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !roleTitle.trim()) {
      toast.error('Company and role are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        companyName: companyName.trim(),
        roleTitle: roleTitle.trim(),
        stage,
        interviewDate: fromLocalInput(interviewDate),
        notes: notes.trim() || null,
      };
      const url = initial ? `/api/opportunities/${initial.id}` : '/api/opportunities';
      const method = initial ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
      const json = await res.json();
      toast.success(initial ? 'Opportunity updated' : 'Opportunity created');
      onSaved(json.data as Opportunity);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
            Company
          </label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
            Role
          </label>
          <input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            required
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
            Stage
          </label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as OpportunityStage)}
            className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
          >
            {OPPORTUNITY_STAGES.map((s) => (
              <option key={s} value={s}>
                {OPPORTUNITY_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
            Interview date
          </label>
          <input
            type="datetime-local"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={5000}
          className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-accent)] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : initial ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  );
}
