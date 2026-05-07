import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tool } from '@anthropic-ai/sdk/resources/messages/messages';
import type {
  CompanyActionPriority,
  CompanyActionType,
  CompanyAgentKind,
  CompanyMetricsSnapshot,
  GuardrailTier,
} from '../types';

export type SkillKind = 'read' | 'write';

export interface SkillUiMeta {
  label: string;
  description: string;
  icon?: string;
}

export interface ActionDraft {
  actionType: CompanyActionType;
  title: string;
  rationale: string;
  priority: CompanyActionPriority;
  payload: Record<string, unknown>;
  evidenceRefs?: { label: string; source: string }[];
}

export interface SkillContext {
  supabase: SupabaseClient;
  userId: string;
  sessionId: string;
  agentKind: CompanyAgentKind;
  metrics: CompanyMetricsSnapshot;
  persistAction(draft: ActionDraft): Promise<{ actionId: string }>;
  // Mutable per-turn budget for nested-agent skills (consult_director). Only
  // populated for the CEO. Skills decrement `remaining` on success.
  consultBudget?: { remaining: number };
  // Guardrail tier snapshotted at agent-turn start. Drives whether persisted
  // actions auto-execute or wait for operator approval.
  guardrailTier?: GuardrailTier;
}

export type SkillResultStatus = 'succeeded' | 'awaiting_approval' | 'failed';

export interface SkillResult {
  status: SkillResultStatus;
  output: Record<string, unknown>;
  linkedActionId?: string;
}

export interface SkillDefinition<Input = Record<string, unknown>> {
  id: string;
  agentKinds: readonly CompanyAgentKind[];
  kind: SkillKind;
  tool: Tool;
  ui: SkillUiMeta;
  handler(input: Input, ctx: SkillContext): Promise<SkillResult>;
}
