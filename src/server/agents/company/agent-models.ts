import { CLAUDE_MODELS, type ClaudeModelId } from '@/lib/anthropic';
import type { CompanyAgentKind } from './types';

const DEFAULT_AGENT_MODEL: ClaudeModelId = CLAUDE_MODELS.reasoning;

const AGENT_MODEL_OVERRIDES: Partial<Record<CompanyAgentKind, ClaudeModelId>> = {
  // CEO orchestrator reasons across every other domain at once, so it gets
  // the strongest model. Directors and the EA stay on Sonnet 4.6.
  ceo_orchestrator: CLAUDE_MODELS.reasoningPlus,
};

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
