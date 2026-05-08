import type { CompanyAgentKind } from '../types';
import type { SkillDefinition } from './types';
import { rememberSkill } from './shared/remember';
import { escalateToCeoSkill } from './shared/escalate_to_ceo';
import { proposeRoadmapRowSkill } from './shared/propose_roadmap_row';
import { fileTicketSkill } from './shared/file_ticket';
import { delegateTaskSkill } from './ceo_orchestrator/delegate_task';
import { consultDirectorSkill } from './ceo_orchestrator/consult_director';
import { searchEmailsSkill } from './executive_assistant/search_emails';
import { scheduleFollowupSkill } from './executive_assistant/schedule_followup';
import { summarizeThreadsSkill } from './executive_assistant/summarize_threads';
import { fetchFunnelMetricsSkill } from './director_marketing/fetch_funnel_metrics';
import { draftLandingCopySkill } from './director_marketing/draft_landing_copy';
import { draftSocialPostSkill } from './director_marketing/draft_social_post';
import { queryBrandGuidelinesSkill } from './director_marketing/query_brand_guidelines';
import { searchCompetitorLandingPagesSkill } from './director_marketing/search_competitor_landing_pages';
import { fetchRevenueSnapshotSkill } from './director_finance/fetch_revenue_snapshot';
import { fetchRunwaySkill } from './director_finance/fetch_runway';
import { fetchBurnBreakdownSkill } from './director_finance/fetch_burn_breakdown';
import { modelPricingChangeSkill } from './director_finance/model_pricing_change';
import { draftFinanceMemoSkill } from './director_finance/draft_finance_memo';
import { fetchOpenIncidentsSkill } from './director_engineering/fetch_open_incidents';
import { fetchDeployHistorySkill } from './director_engineering/fetch_deploy_history';
import { fetchUptimeSkill } from './director_engineering/fetch_uptime';
import { queryCodebaseSummarySkill } from './director_engineering/query_codebase_summary';
import { draftEngineeringSpecSkill } from './director_engineering/draft_engineering_spec';

// Use `any` for the input type variable: the registry is heterogeneous (each
// skill narrows its own input shape) and `handler` is contravariant in Input,
// so a wider parametric type would reject narrower handlers. The router casts
// inputs back to `never` before invoking the handler.
type AnySkill = SkillDefinition<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const REGISTRY: AnySkill[] = [
  rememberSkill,
  escalateToCeoSkill,
  proposeRoadmapRowSkill,
  fileTicketSkill,
  // ceo_orchestrator
  delegateTaskSkill,
  consultDirectorSkill,
  // executive_assistant
  searchEmailsSkill,
  scheduleFollowupSkill,
  summarizeThreadsSkill,
  // director_marketing
  fetchFunnelMetricsSkill,
  draftLandingCopySkill,
  draftSocialPostSkill,
  queryBrandGuidelinesSkill,
  searchCompetitorLandingPagesSkill,
  // director_finance
  fetchRevenueSnapshotSkill,
  fetchRunwaySkill,
  fetchBurnBreakdownSkill,
  modelPricingChangeSkill,
  draftFinanceMemoSkill,
  // director_engineering
  fetchOpenIncidentsSkill,
  fetchDeployHistorySkill,
  fetchUptimeSkill,
  queryCodebaseSummarySkill,
  draftEngineeringSpecSkill,
];

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
