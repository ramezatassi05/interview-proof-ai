'use client';

import type { CompanyAgentKind } from '@/server/agents/company/types';
import { skillsForAgent } from './agent-skill-catalog';
import { SkillIcon } from './SkillIcon';
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
        <SectionLabel>What they can do</SectionLabel>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          Things this agent knows how to handle. The one they&apos;re using right now lights up.
        </p>
      </div>

      {reads.length > 0 && (
        <SkillGroup
          heading="Look up"
          subheading={`${reads.length} ${reads.length === 1 ? 'lookup' : 'lookups'}`}
          tone="read"
        >
          {reads.map((s) => (
            <SkillRow
              key={s.id}
              skillId={s.id}
              icon={s.icon}
              label={s.label}
              description={s.description}
              active={activeSkillId === s.id}
              tone="read"
            />
          ))}
        </SkillGroup>
      )}

      {writes.length > 0 && (
        <SkillGroup
          heading="Draft (you OK before anything happens)"
          subheading={`${writes.length} ${writes.length === 1 ? 'drafter' : 'drafters'}`}
          tone="write"
        >
          {writes.map((s) => (
            <SkillRow
              key={s.id}
              skillId={s.id}
              icon={s.icon}
              label={s.label}
              description={s.description}
              active={activeSkillId === s.id}
              tone="write"
            />
          ))}
        </SkillGroup>
      )}

      {skills.length === 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          Nothing wired up yet for this role. You can still talk to them — they just don&apos;t have
          any specific shortcuts.
        </p>
      )}
    </div>
  );
}

type Tone = 'read' | 'write';

function SkillGroup({
  heading,
  subheading,
  tone,
  children,
}: {
  heading: string;
  subheading: string;
  tone: Tone;
  children: React.ReactNode;
}) {
  const dotColor =
    tone === 'read' ? 'bg-[var(--text-muted)]' : 'bg-[var(--accent-primary,var(--text-primary))]';
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden />
          {heading}
        </p>
        <span className="text-[10px] tabular-nums text-[var(--text-muted)]">{subheading}</span>
      </div>
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  );
}

function SkillRow({
  skillId,
  icon,
  label,
  description,
  active,
  tone,
}: {
  skillId: string;
  icon?: string;
  label: string;
  description: string;
  active: boolean;
  tone: Tone;
}) {
  const accentClass = active
    ? 'border-[var(--border-accent)] shadow-[0_0_0_1px_var(--accent-primary)]'
    : 'hover:border-[var(--border-accent)]';
  const iconColor = active
    ? 'text-[var(--accent-primary,var(--text-primary))]'
    : tone === 'write'
      ? 'text-[var(--text-secondary)]'
      : 'text-[var(--text-muted)]';
  return (
    <li
      data-skill-id={skillId}
      data-active={active ? 'true' : 'false'}
      className={`group flex items-start gap-2 border border-[var(--border-default)] bg-[var(--bg-primary)] p-2 transition-all ${accentClass}`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center ${iconColor}`}
        aria-hidden
      >
        <SkillIcon name={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[12px] font-medium text-[var(--text-primary)]">{label}</p>
          {active && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wide text-[var(--accent-primary,var(--text-primary))]">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
              </span>
              now
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--text-muted)]">
          {description}
        </p>
      </div>
    </li>
  );
}
