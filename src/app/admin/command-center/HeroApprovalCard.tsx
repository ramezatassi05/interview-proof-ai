'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { relativeTime } from '@/lib/relative-time';
import { agentMeta } from './agents';
import { PriorityBadge } from './_primitives';
import type { CompanyAction, TransitionStatus } from './_approvals';

interface HeroApprovalCardProps {
  action: CompanyAction;
  pending: boolean;
  onTransition: (id: string, status: TransitionStatus) => void;
  onRequestReject: (action: CompanyAction) => void;
  onOpenDetail: (action: CompanyAction) => void;
}

export function HeroApprovalCard({
  action,
  pending,
  onTransition,
  onRequestReject,
  onOpenDetail,
}: HeroApprovalCardProps) {
  return (
    <article className="relative bg-[var(--bg-elevated)] before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-[var(--accent-primary)]">
      <button
        type="button"
        onClick={() => onOpenDetail(action)}
        className="block w-full px-5 py-4 text-left transition-colors hover:bg-[var(--bg-elevated)]/70 focus:bg-[var(--bg-elevated)]/70 focus:outline-none"
      >
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={action.priority} />
          <span className="text-[12px] font-medium text-[var(--accent-primary)]">
            {agentMeta(action.agentKind).label}
          </span>
          {action.triggeredBy === 'cron' && <Badge variant="default">Acted on its own</Badge>}
          <span className="ml-auto text-[11px] tabular-nums text-[var(--text-muted)]">
            {relativeTime(action.createdAt)}
          </span>
        </div>
        <h2
          className="mt-3 text-[17px] font-semibold leading-snug text-[var(--text-primary)]"
          title={action.title}
        >
          {action.title}
        </h2>
        <p className="mt-2 line-clamp-4 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
          {action.rationale}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--accent-primary)]">
          See the whole thing
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
      <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-default)]/50 px-5 py-3">
        <Button
          variant="ghost"
          size="md"
          className="w-full"
          onClick={() => onRequestReject(action)}
          disabled={pending}
        >
          Reject
        </Button>
        <Button
          variant="primary"
          size="md"
          className="w-full"
          loading={pending}
          onClick={() => onTransition(action.id, 'approved')}
        >
          Approve
        </Button>
      </div>
    </article>
  );
}
