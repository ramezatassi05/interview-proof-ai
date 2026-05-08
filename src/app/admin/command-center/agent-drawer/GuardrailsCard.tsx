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

        {error && <p className="text-[11px] text-[var(--color-danger)]">{error}</p>}
      </section>
    </TooltipProvider>
  );
}

function humanize(actionType: string): string {
  return actionType.replace(/_/g, ' ');
}
