import { CLAUDE_MODELS, type ClaudeModelId } from '@/lib/anthropic';
import type { CompanyAgentKind } from './types';

// Every company agent (orchestrator, EA, all directors) runs on Opus 4.7. The
// CEO wants the strongest reasoning model on every surface — these agents act
// on the business directly, so the cost premium is worth the quality.
const DEFAULT_AGENT_MODEL: ClaudeModelId = CLAUDE_MODELS.reasoningPlus;

const AGENT_MODEL_OVERRIDES: Partial<Record<CompanyAgentKind, ClaudeModelId>> = {};

export function getModelForAgent(agentKind: CompanyAgentKind): ClaudeModelId {
  return AGENT_MODEL_OVERRIDES[agentKind] ?? DEFAULT_AGENT_MODEL;
}

const MODEL_LABELS: Record<ClaudeModelId, string> = {
  [CLAUDE_MODELS.reasoning]: 'Sonnet 4.6',
  [CLAUDE_MODELS.reasoningPlus]: 'Opus 4.7',
  [CLAUDE_MODELS.reasoningFast]: 'Haiku 4.5',
};

export function getModelLabelForAgent(agentKind: CompanyAgentKind): string {
  return MODEL_LABELS[getModelForAgent(agentKind)];
}
