'use client';

import type { CompanyAgentKind } from '@/server/agents/company/types';
import { skillsForAgent } from './agent-skill-catalog';
import type { SkillCatalogEntry } from './types';
import { SkillIcon } from './SkillIcon';
import { BorderBeam } from '@/components/ui/border-beam';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SkillsPanelProps {
  agentKind: CompanyAgentKind;
  activeSkillId: string | null;
}

export function SkillsPanel({ agentKind, activeSkillId }: SkillsPanelProps) {
  const skills = skillsForAgent(agentKind);
  const sorted = [...skills].sort((a, b) => {
    // Write skills first (they're the ones the CEO acts on), then read.
    if (a.kind !== b.kind) return a.kind === 'write' ? -1 : 1;
    return a.label.localeCompare(b.label);
  });

  return (
    <TooltipProvider delayDuration={200}>
      <section className="flex flex-col gap-3 px-4 pt-5 pb-4">
        <header className="flex items-end justify-between gap-2">
          <div>
            <h3 className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)]">
              Skills
            </h3>
            <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-muted)]">
              What this agent can do for you.
            </p>
          </div>
          {sorted.length > 0 && (
            <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--text-secondary)]">
              {sorted.length}
            </span>
          )}
        </header>

        {sorted.length === 0 ? (
          <p className="text-[12px] leading-snug text-[var(--text-muted)]">
            Nothing wired up for this role yet. You can still talk to them.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {sorted.map((skill) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                active={activeSkillId === skill.id}
              />
            ))}
          </ul>
        )}
      </section>
    </TooltipProvider>
  );
}

function SkillRow({ skill, active }: { skill: SkillCatalogEntry; active: boolean }) {
  const isWrite = skill.kind === 'write';

  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            data-skill-id={skill.id}
            data-active={active ? 'true' : 'false'}
            className={`group relative flex items-center gap-2.5 overflow-hidden rounded-md border px-2.5 py-2 transition-colors ${
              active
                ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/8'
                : 'border-transparent bg-transparent hover:bg-[var(--bg-elevated)]'
            }`}
          >
            {active && (
              <BorderBeam size={120} duration={6} colorFrom="#6366F1" colorTo="#A5B4FC" />
            )}
            <span
              aria-hidden
              className={`relative h-7 w-[3px] shrink-0 rounded-full transition-colors ${
                active
                  ? 'bg-[var(--accent-primary)]'
                  : isWrite
                    ? 'bg-[var(--text-secondary)]/40 group-hover:bg-[var(--text-secondary)]/70'
                    : 'bg-[var(--text-muted)]/30 group-hover:bg-[var(--text-muted)]/60'
              }`}
            />
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center transition-colors ${
                active
                  ? 'text-[var(--accent-primary)]'
                  : isWrite
                    ? 'text-[var(--text-secondary)]'
                    : 'text-[var(--text-muted)]'
              }`}
              aria-hidden
            >
              <SkillIcon name={skill.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-[12.5px] font-medium leading-tight ${
                  active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                }`}
              >
                {skill.label}
              </p>
            </div>
            {active ? (
              <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-primary)] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
              </span>
            ) : (
              <ToneDot tone={isWrite ? 'write' : 'read'} />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" className="max-w-[240px]">
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-medium text-[var(--text-primary)]">{skill.label}</p>
            <p className="text-[11px] leading-snug text-[var(--text-muted)]">{skill.description}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]/70">
              {isWrite ? 'Drafts something for you to OK' : 'Looks up info'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </li>
  );
}

function ToneDot({ tone }: { tone: 'read' | 'write' }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-1 w-1 shrink-0 rounded-full ${
        tone === 'write'
          ? 'bg-[var(--text-secondary)]/40 group-hover:bg-[var(--text-secondary)]/70'
          : 'bg-[var(--text-muted)]/40 group-hover:bg-[var(--text-muted)]/70'
      }`}
    />
  );
}
