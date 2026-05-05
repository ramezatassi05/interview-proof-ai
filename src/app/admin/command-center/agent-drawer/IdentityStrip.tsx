'use client';

import { Badge } from '@/components/ui/Badge';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import { agentMeta } from '../agents';
import { skillsForAgent } from './agent-skill-catalog';

interface IdentityStripProps {
  agentKind: CompanyAgentKind;
  memoryCount: number;
}

export function IdentityStrip({ agentKind, memoryCount }: IdentityStripProps) {
  const meta = agentMeta(agentKind);
  const skills = skillsForAgent(agentKind);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-2.5">
      <Badge variant="accent">{meta.label}</Badge>
      <span className="text-[11px] tabular-nums text-[var(--text-muted)]">Sonnet 4.6</span>
      <span className="text-[11px] text-[var(--text-muted)]" aria-hidden>
        ·
      </span>
      <span className="text-[11px] text-[var(--text-secondary)]">
        Knows how to do <span className="tabular-nums">{skills.length}</span>{' '}
        {skills.length === 1 ? 'thing' : 'things'}
      </span>
      <span className="text-[11px] text-[var(--text-muted)]" aria-hidden>
        ·
      </span>
      <span className="text-[11px] text-[var(--text-secondary)]">
        Remembers <span className="tabular-nums">{memoryCount}</span>
      </span>
      <Badge variant="default">Won&apos;t act without your OK</Badge>
      <span className="ml-auto truncate text-[11px] text-[var(--text-muted)]">
        {meta.discipline}
      </span>
    </div>
  );
}
