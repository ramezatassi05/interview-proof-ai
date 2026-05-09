'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { relativeTime } from '@/lib/relative-time';

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
  const [expanded, setExpanded] = useState(false);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [decisionText, setDecisionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latest = decisions[0];

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
      setExpanded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSubmitting(false);
    }
  }

  function startCompose() {
    setComposing(true);
    setExpanded(true);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Latest decision
        </span>
        {latest ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <span className="truncate font-medium text-[var(--text-primary)]" title={latest.title}>
              {latest.title}
            </span>
            <span className="shrink-0 tabular-nums text-[var(--text-muted)]">
              · {relativeTime(latest.decidedAt)}
            </span>
          </button>
        ) : (
          <span className="flex-1 text-[13px] text-[var(--text-muted)]">
            Nothing logged yet — drop decisions here so the team stays on the same page.
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {decisions.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {expanded ? 'Hide' : `View all ${decisions.length}`}
            </button>
          )}
          <Button variant="ghost" size="sm" onClick={startCompose} className="shrink-0">
            + Log a decision
          </Button>
        </div>
      </div>

      {composing && (
        <div className="flex flex-col gap-2 border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
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

      {expanded && decisions.length > 0 && (
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {decisions.map((d) => (
            <li
              key={d.id}
              className="min-w-[260px] max-w-[320px] flex-shrink-0 border border-[var(--border-default)]/70 bg-[var(--bg-elevated)] p-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
                {relativeTime(d.decidedAt)}
              </p>
              <p
                className="mt-1.5 truncate text-sm font-semibold text-[var(--text-primary)]"
                title={d.title}
              >
                {d.title}
              </p>
              <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
                {d.decisionText}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
