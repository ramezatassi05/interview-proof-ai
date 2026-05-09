/**
 * Customer-facing artifact registry.
 *
 * Maps an agent action_type → a presentation-only React component that
 * summarizes the action's payload for embedding anywhere a referenced
 * action needs to render: PendingApprovalsList rows, IntelligencePanel
 * cards, and (in Phase C) inline citations from the copilot dock.
 *
 * These cards are READ-ONLY. The interactive approval/edit views still
 * live inside ActionApprovalModal — they own local form state for the
 * radio picker, edit-in-place, etc.
 *
 * Mirrors the CC artifact registry pattern at
 * src/app/admin/command-center/artifacts/index.tsx, but keyed by
 * action_type instead of skillId because customer agents don't expose
 * skills in the same way.
 */
import type { ComponentType } from 'react';
import type { AgentAction, AgentActionType } from '@/types';
import { DrillSummaryCard } from './DrillSummaryCard';
import { ResumeBulletCard } from './ResumeBulletCard';
import { RecruiterDraftCard } from './RecruiterDraftCard';
import { GenericActionCard } from './GenericActionCard';

export interface ActionArtifactProps {
  action: AgentAction;
}

const REGISTRY: Partial<Record<AgentActionType, ComponentType<ActionArtifactProps>>> = {
  recommend_drill: DrillSummaryCard,
  rewrite_resume_bullet: ResumeBulletCard,
  draft_recruiter_reply: RecruiterDraftCard,
};

export function getActionRenderer(
  actionType: AgentActionType
): ComponentType<ActionArtifactProps> {
  return REGISTRY[actionType] ?? GenericActionCard;
}

export function ActionCard({ action }: { action: AgentAction }) {
  const Renderer = getActionRenderer(action.actionType);
  return <Renderer action={action} />;
}

export { DrillSummaryCard, ResumeBulletCard, RecruiterDraftCard, GenericActionCard };
