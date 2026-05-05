'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { relativeTime } from '@/lib/relative-time';
import { SoftLabel } from './_primitives';

export interface Decision {
  id: string;
  title: string;
  decisionText: string;
  rationale: string | null;
  decidedAt: string;
}

export function DecisionsStrip({
  decisions,
  onCreated,
}: {
  decisions: Decision[];
  onCreated: (decision: Decision) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [decisionText, setDecisionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const t = title.trim();
    const d = decisionText.trim();
    if (!t || !d || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/company-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t, decisionText: d }),
      });
      const json = (await res.json()) as { data?: Decision; error?: string };
      if (!res.ok || !json.data) throw new Error(json.error ?? 'Could not save');
      onCreated(json.data);
      setTitle('');
      setDecisionText('');
      setComposing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center justify-between gap-2">
        <SoftLabel>What we&apos;ve decided lately</SoftLabel>
        {!composing && (
          <Button variant="ghost" size="sm" onClick={() => setComposing(true)}>
            + Log a decision
          </Button>
        )}
      </div>

      {composing && (
        <div className="mt-3 flex flex-col gap-2 border border-[var(--border-default)] bg-[var(--bg-primary)] p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's the decision? (e.g. No new feature work this week)"
            maxLength={200}
            className="w-full border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-accent)]"
          />
          <textarea
            value={decisionText}
            onChange={(e) => setDecisionText(e.target.value)}
            placeholder="A sentence or two on what you decided and why."
            maxLength={2000}
            rows={2}
            className="w-full resize-y border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-accent)]"
          />
          {error && <p className="text-[11px] text-[var(--color-danger)]">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setComposing(false);
                setError(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!title.trim() || !decisionText.trim()}
              onClick={submit}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {decisions.length === 0 && !composing ? (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Nothing logged yet. Drop decisions here so the team stays on the same page.
        </p>
      ) : (
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {decisions.map((d) => (
            <li
              key={d.id}
              className="min-w-[260px] max-w-[300px] flex-shrink-0 border border-[var(--border-default)] bg-[var(--bg-primary)] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
                  {relativeTime(d.decidedAt)}
                </p>
              </div>
              <p
                className="mt-1.5 truncate text-sm font-semibold text-[var(--text-primary)]"
                title={d.title}
              >
                {d.title}
              </p>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                {d.decisionText}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
