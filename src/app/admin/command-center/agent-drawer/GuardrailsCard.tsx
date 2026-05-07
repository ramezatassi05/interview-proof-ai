'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import {
  GUARDRAIL_TIERS,
  ACTION_RISK,
  AUTO_EXECUTE_DAILY_LIMIT,
  type GuardrailTier,
  type RateLimitState,
} from '@/server/agents/company/types';
import { agentMeta } from '../agents';
import { SectionLabel } from '../_primitives';

interface GuardrailsCardProps {
  agentKind: CompanyAgentKind;
  onTierChange?: (tier: GuardrailTier) => void;
}

const TIER_DESCRIPTION: Record<GuardrailTier, string> = {
  manual: 'Every action waits on your OK. Today’s default — nothing runs without you.',
  guarded:
    'Low-risk drafts at low/medium priority run on their own. Bigger drafts and anything with side effects still wait on you.',
  autonomous:
    'All low-risk drafts run on their own. Side-effect actions (creating tasks, escalating) still wait on you.',
};

const TIER_BADGE_VARIANT: Record<GuardrailTier, 'default' | 'medium' | 'success'> = {
  manual: 'default',
  guarded: 'medium',
  autonomous: 'success',
};

export function tierBadgeVariant(tier: GuardrailTier) {
  return TIER_BADGE_VARIANT[tier];
}

export function GuardrailsCard({ agentKind, onTierChange }: GuardrailsCardProps) {
  const meta = agentMeta(agentKind);
  const [tier, setTier] = useState<GuardrailTier>('manual');
  const [rateLimit, setRateLimit] = useState<RateLimitState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        data?: { tier: GuardrailTier; rateLimit: RateLimitState };
      };
      if (json.data) {
        setTier(json.data.tier);
        setRateLimit(json.data.rateLimit);
        onTierChange?.(json.data.tier);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [agentKind, onTierChange]);

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

  return (
    <div
      id={`guardrails-${agentKind}`}
      className="border border-[var(--border-default)] bg-[var(--bg-card)] p-3 text-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <SectionLabel>How much freedom?</SectionLabel>
        {rateLimit && (
          <span
            className="text-[10px] tabular-nums text-[var(--text-muted)]"
            title="Auto-executed actions in last 24h"
          >
            {rateLimit.used}/{rateLimit.max} auto-run today
          </span>
        )}
      </div>

      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
        Sets how much {meta.label.toLowerCase()} can do without checking with you.
      </p>

      <div className="mt-2 grid grid-cols-3 overflow-hidden border border-[var(--border-default)]">
        {GUARDRAIL_TIERS.map((t) => {
          const active = t === tier;
          return (
            <button
              key={t}
              type="button"
              onClick={() => void handleSelect(t)}
              disabled={loading || saving}
              data-active={active ? 'true' : 'false'}
              aria-pressed={active}
              className={`px-2 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                active
                  ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              } ${t !== 'autonomous' ? 'border-r border-[var(--border-default)]' : ''}`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] leading-snug text-[var(--text-secondary)]">
        {TIER_DESCRIPTION[tier]}
      </p>

      {rateLimit && !rateLimit.allowed && (
        <p className="mt-1.5 text-[10px] text-[var(--color-warning)]">
          Hit the daily auto-run cap ({AUTO_EXECUTE_DAILY_LIMIT}). New actions will wait on you
          until tomorrow.
        </p>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 text-[11px]">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Badge variant="success">may auto-run</Badge>
          </div>
          <p className="text-[var(--text-muted)]">{lowRisk.map(humanize).join(', ')}</p>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Badge variant="high">always wait on you</Badge>
          </div>
          <p className="text-[var(--text-muted)]">{highRisk.map(humanize).join(', ')}</p>
        </div>
      </div>

      {error && <p className="mt-2 text-[11px] text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}

function humanize(actionType: string): string {
  return actionType.replace(/_/g, ' ');
}
