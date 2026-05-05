'use client';

import type { CompanyAgentKind } from '@/server/agents/company/types';
import { skillsForAgent } from './agent-skill-catalog';
import { SectionLabel } from '../_primitives';

interface SkillsPanelProps {
  agentKind: CompanyAgentKind;
  activeSkillId: string | null;
}

export function SkillsPanel({ agentKind, activeSkillId }: SkillsPanelProps) {
  const skills = skillsForAgent(agentKind);
  const reads = skills.filter((s) => s.kind === 'read');
  const writes = skills.filter((s) => s.kind === 'write');

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto border-r border-[var(--border-default)] bg-[var(--bg-card)] p-3 text-sm">
      <div>
        <SectionLabel>Skills</SectionLabel>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          Curated tools this agent can call. The active one pulses while in use.
        </p>
      </div>

      {reads.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Read
          </p>
          <ul className="flex flex-col gap-1.5">
            {reads.map((s) => (
              <SkillRow
                key={s.id}
                skillId={s.id}
                label={s.label}
                description={s.description}
                active={activeSkillId === s.id}
              />
            ))}
          </ul>
        </div>
      )}

      {writes.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Write · approval-gated
          </p>
          <ul className="flex flex-col gap-1.5">
            {writes.map((s) => (
              <SkillRow
                key={s.id}
                skillId={s.id}
                label={s.label}
                description={s.description}
                active={activeSkillId === s.id}
              />
            ))}
          </ul>
        </div>
      )}

      {skills.length === 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          No skills wired yet for this role. Use plain prose; the agent has its full system context
          but no callable tools.
        </p>
      )}
    </div>
  );
}

function SkillRow({
  skillId,
  label,
  description,
  active,
}: {
  skillId: string;
  label: string;
  description: string;
  active: boolean;
}) {
  return (
    <li
      data-skill-id={skillId}
      data-active={active ? 'true' : 'false'}
      className={`border border-[var(--border-default)] bg-[var(--bg-primary)] p-2 transition-all ${
        active
          ? 'border-[var(--border-accent)] shadow-[0_0_0_1px_var(--accent-primary)]'
          : 'hover:border-[var(--border-accent)]'
      }`}
    >
      <p className="text-[12px] font-medium text-[var(--text-primary)]">{label}</p>
      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--text-muted)]">
        {description}
      </p>
    </li>
  );
}
