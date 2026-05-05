import type { CompanyAgentKind } from '../types';
import type { SkillDefinition } from './types';
import { rememberSkill } from './shared/remember';
import { fetchFunnelMetricsSkill } from './director_marketing/fetch_funnel_metrics';
import { fetchRevenueSnapshotSkill } from './director_finance/fetch_revenue_snapshot';

// Use `any` for the input type variable: the registry is heterogeneous (each
// skill narrows its own input shape) and `handler` is contravariant in Input,
// so a wider parametric type would reject narrower handlers. The router casts
// inputs back to `never` before invoking the handler.
type AnySkill = SkillDefinition<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const REGISTRY: AnySkill[] = [rememberSkill, fetchFunnelMetricsSkill, fetchRevenueSnapshotSkill];

const BY_ID = new Map<string, AnySkill>(REGISTRY.map((s) => [s.id, s]));

export function getSkillById(id: string): AnySkill | undefined {
  return BY_ID.get(id);
}

export function getSkillsForAgent(agentKind: CompanyAgentKind): AnySkill[] {
  return REGISTRY.filter((s) => s.agentKinds.includes(agentKind));
}

export function listAllSkills(): AnySkill[] {
  return [...REGISTRY];
}

export function isSkillAllowedForAgent(skillId: string, agentKind: CompanyAgentKind): boolean {
  const skill = BY_ID.get(skillId);
  return Boolean(skill?.agentKinds.includes(agentKind));
}

export type { SkillDefinition, SkillContext, SkillResult, ActionDraft } from './types';
