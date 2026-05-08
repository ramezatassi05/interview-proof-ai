'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import {
  GUARDRAIL_TIERS,
  ACTION_RISK,
  AUTO_EXECUTE_DAILY_LIMIT,
  type GuardrailTier,
  type RateLimitState,
} from '@/server/agents/company/types';
import { agentMeta } from '../agents';
import { BorderBeam } from '@/components/ui/border-beam';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SpendState {
  allowed: boolean;
  monthSpendUsd: number;
  capUsd: number | null;
  monthStart: string;
  resetsAt: string;
}

interface GuardrailsCardProps {
  agentKind: CompanyAgentKind;
  onTierChange?: (tier: GuardrailTier) => void;
}

const TIER_DESCRIPTION: Record<GuardrailTier, string> = {
  manual: 'Every action waits on your OK. Today’s default — nothing runs without you.',
  guarded: 'Low-risk drafts at low/medium priority run on their own. Bigger drafts and side-effect actions still wait on you.',
  autonomous: 'All low-risk drafts run on their own. Side-effect actions still wait on you.',
};

const TIER_BADGE_VARIANT: Record<GuardrailTier, 'default' | 'medium' | 'success'> = {
  manual: 'default',
  guarded: 'medium',
  autonomous: 'success',
};

const TIER_SHORT_LABEL: Record<GuardrailTier, string> = {
  manual: 'Manual',
  guarded: 'Guarded',
  autonomous: 'Auto',
};

export function tierBadgeVariant(tier: GuardrailTier) {
  return TIER_BADGE_VARIANT[tier];
}

export function GuardrailsCard({ agentKind, onTierChange }: GuardrailsCardProps) {
  const meta = agentMeta(agentKind);
  const [tier, setTier] = useState<GuardrailTier>('manual');
  const [rateLimit, setRateLimit] = useState<RateLimitState | null>(null);
  const [spend, setSpend] = useState<SpendState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCap, setSavingCap] = useState(false);
  const [editingCap, setEditingCap] = useState(false);
  const [capInput, setCapInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/company-agent/guardrails?agentKind=${encodeURIComponent(agentKind)}`,
        { method: 'GET' }
      );
      if (!res.ok) {
        setError(`Couldn’t load guardrails (${res.status})`);
        return;
      }
      const json = (await res.json()) as {
        data?: { tier: GuardrailTier; rateLimit: RateLimitState; spend: SpendState };
      };
      if (json.data) {
        setTier(json.data.tier);
        setRateLimit(json.data.rateLimit);
        setSpend(json.data.spend);
        onTierChange?.(json.data.tier);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [agentKind, onTierChange]);

  const saveCap = async (next: number | null) => {
    if (savingCap) return;
    setSavingCap(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/company-agent/guardrails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentKind, monthlySpendCapUsd: next }),
      });
      if (!res.ok) {
        setError(`Couldn’t save cap (${res.status})`);
        return;
      }
      setEditingCap(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSavingCap(false);
    }
  };

  const handleCapSubmit = () => {
    const trimmed = capInput.trim();
    if (trimmed === '') {
      void saveCap(null);
      return;
    }
    const parsed = Number.parseFloat(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Enter a positive dollar amount or leave blank to clear');
      return;
    }
    void saveCap(parsed);
  };

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelect = async (next: GuardrailTier) => {
    if (next === tier || saving) return;
    const prev = tier;
    setTier(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/company-agent/guardrails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentKind, tier: next }),
      });
      if (!res.ok) {
        setTier(prev);
        setError(`Couldn’t save (${res.status})`);
        return;
      }
      onTierChange?.(next);
    } catch (err) {
      setTier(prev);
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const lowRisk = (Object.keys(ACTION_RISK) as Array<keyof typeof ACTION_RISK>).filter(
    (t) => ACTION_RISK[t] === 'low'
  );
  const highRisk = (Object.keys(ACTION_RISK) as Array<keyof typeof ACTION_RISK>).filter(
    (t) => ACTION_RISK[t] === 'high'
  );

  const tierIndex = GUARDRAIL_TIERS.indexOf(tier);

  return (
    <TooltipProvider delayDuration={200}>
      <section
        id={`guardrails-${agentKind}`}
        className="flex flex-col gap-3 px-4 pt-4 pb-5"
      >
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)]">
              Freedom
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border-default)] text-[10px] font-medium leading-none text-[var(--text-muted)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--text-secondary)]"
                  aria-label="What runs automatically vs always waits on you"
                >
                  ?
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" className="max-w-[260px]">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-[var(--text-primary)]">
                      May auto-run
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">
                      {lowRisk.map(humanize).join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[var(--text-primary)]">
                      Always waits on you
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">
                      {highRisk.map(humanize).join(', ')}
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          {rateLimit && (
            <span
              className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] tabular-nums text-[var(--text-muted)]"
              title="Auto-executed actions in last 24h"
            >
              {rateLimit.used}/{rateLimit.max} today
            </span>
          )}
        </header>

        <p className="text-[12px] leading-snug text-[var(--text-muted)]">
          How much {meta.label.toLowerCase()} can do without checking with you.
        </p>

        <div
          role="radiogroup"
          aria-label="Guardrail tier"
          className="relative grid grid-cols-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-md bg-[var(--bg-card)] shadow-sm transition-transform duration-300 ease-out"
            style={{
              width: `calc((100% - 0.5rem) / 3)`,
              transform: `translateX(${tierIndex * 100}%)`,
            }}
          />
          {tier !== 'manual' && (
            <BorderBeam
              size={90}
              duration={8}
              colorFrom={tier === 'autonomous' ? '#34D399' : '#F59E0B'}
              colorTo={tier === 'autonomous' ? '#6EE7B7' : '#FCD34D'}
            />
          )}
          {GUARDRAIL_TIERS.map((t) => {
            const active = t === tier;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => void handleSelect(t)}
                disabled={loading || saving}
                className={`relative z-10 px-2 py-1.5 text-[12px] font-medium transition-colors ${
                  active
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                } disabled:opacity-60`}
              >
                {TIER_SHORT_LABEL[t]}
              </button>
            );
          })}
        </div>

        <p className="text-[12px] leading-snug text-[var(--text-secondary)]">
          {TIER_DESCRIPTION[tier]}
        </p>

        {rateLimit && !rateLimit.allowed && (
          <p className="text-[11px] leading-snug text-[var(--color-warning)]">
            Hit the daily auto-run cap ({AUTO_EXECUTE_DAILY_LIMIT}). New actions will wait on you
            until tomorrow.
          </p>
        )}

        {spend && (
          <SpendBar
            spend={spend}
            editing={editingCap}
            saving={savingCap}
            value={capInput}
            onValueChange={setCapInput}
            onStartEdit={() => {
              setCapInput(spend.capUsd != null ? spend.capUsd.toFixed(2) : '');
              setEditingCap(true);
              setError(null);
            }}
            onCancel={() => {
              setEditingCap(false);
              setError(null);
            }}
            onSubmit={handleCapSubmit}
            onClear={() => void saveCap(null)}
          />
        )}

        {error && <p className="text-[11px] text-[var(--color-danger)]">{error}</p>}
      </section>
    </TooltipProvider>
  );
}

interface SpendBarProps {
  spend: SpendState;
  editing: boolean;
  saving: boolean;
  value: string;
  onValueChange: (next: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  onClear: () => void;
}

function SpendBar({
  spend,
  editing,
  saving,
  value,
  onValueChange,
  onStartEdit,
  onCancel,
  onSubmit,
  onClear,
}: SpendBarProps) {
  const used = spend.monthSpendUsd;
  const cap = spend.capUsd;
  const pct = cap != null && cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
  const overCap = cap != null && used >= cap;
  const resetDate = new Date(spend.resetsAt).toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums">
        <span className="font-medium text-[var(--text-primary)]">Monthly cost</span>
        <span className={overCap ? 'text-[var(--color-danger)]' : 'text-[var(--text-muted)]'}>
          ${used.toFixed(2)}
          {cap != null ? ` / $${cap.toFixed(2)}` : ' (no cap)'}
        </span>
      </div>

      {cap != null && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--bg-card)]">
          <div
            className={`h-full transition-all ${
              overCap
                ? 'bg-[var(--color-danger)]'
                : pct > 80
                  ? 'bg-[var(--color-warning)]'
                  : 'bg-[var(--color-success)]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {overCap && (
        <p className="text-[11px] leading-snug text-[var(--color-danger)]">
          Paused until {resetDate}. Raise the cap below to resume now.
        </p>
      )}

      {editing ? (
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-[var(--text-muted)]">$</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="No cap"
            className="h-6 flex-1 rounded border border-[var(--border-default)] bg-[var(--bg-card)] px-1.5 text-[11px] tabular-nums text-[var(--text-primary)] outline-none focus:border-[var(--border-accent)]"
            autoFocus
            disabled={saving}
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="rounded bg-[var(--bg-accent)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-on-accent)] hover:opacity-90 disabled:opacity-60"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded px-1.5 py-0.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2 pt-0.5 text-[11px]">
          <button
            type="button"
            onClick={onStartEdit}
            className="text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
          >
            {cap != null ? 'Change cap' : 'Set cap'}
          </button>
          {cap != null && (
            <button
              type="button"
              onClick={onClear}
              disabled={saving}
              className="text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline disabled:opacity-60"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function humanize(actionType: string): string {
  return actionType.replace(/_/g, ' ');
}
