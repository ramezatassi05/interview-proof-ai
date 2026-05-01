'use client';

import type { OpportunityStage } from '@/types';
import { OPPORTUNITY_STAGE_LABELS } from '@/lib/opportunities';

const STAGE_STYLES: Record<OpportunityStage, { color: string; bg: string; border: string }> = {
  applied: {
    color: 'var(--text-secondary)',
    bg: 'var(--bg-elevated)',
    border: 'var(--border-default)',
  },
  recruiter_screen: {
    color: 'var(--accent-primary)',
    bg: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
    border: 'color-mix(in srgb, var(--accent-primary) 30%, transparent)',
  },
  phone_screen: {
    color: 'var(--accent-primary)',
    bg: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
    border: 'color-mix(in srgb, var(--accent-primary) 30%, transparent)',
  },
  onsite: {
    color: 'var(--color-warning)',
    bg: 'var(--color-warning-muted)',
    border: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
  },
  offer: {
    color: 'var(--color-success)',
    bg: 'var(--color-success-muted)',
    border: 'color-mix(in srgb, var(--color-success) 30%, transparent)',
  },
  rejected: {
    color: 'var(--color-danger)',
    bg: 'var(--color-danger-muted)',
    border: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
  },
  withdrawn: {
    color: 'var(--text-muted)',
    bg: 'var(--bg-elevated)',
    border: 'var(--border-default)',
  },
};

interface StageBadgeProps {
  stage: OpportunityStage;
  size?: 'sm' | 'md';
}

export function StageBadge({ stage, size = 'sm' }: StageBadgeProps) {
  const style = STAGE_STYLES[stage];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium uppercase tracking-wide ${padding}`}
      style={{ color: style.color, background: style.bg, borderColor: style.border }}
    >
      {OPPORTUNITY_STAGE_LABELS[stage]}
    </span>
  );
}
