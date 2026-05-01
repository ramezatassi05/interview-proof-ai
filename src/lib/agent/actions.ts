import { z } from 'zod';
import {
  ALLOWED_TRANSITIONS,
  type AgentActionStatus,
  type AgentActionType,
  actionRequiresExternalSend,
} from './types';

// One Zod schema per action_type. Schemas are intentionally minimal in M3 —
// later milestones tighten payload shape as the matching agent is built.
export const ACTION_PAYLOAD_SCHEMAS: Record<AgentActionType, z.ZodTypeAny> = {
  recommend_drill: z.object({
    riskId: z.string().min(1),
    reason: z.string().min(1),
  }),
  start_mock_interview: z.object({
    reportId: z.string().uuid(),
    focusAreas: z.array(z.string()).max(10).default([]),
  }),
  score_answer: z.object({
    answerId: z.string().uuid(),
  }),
  draft_recruiter_reply: z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
    recipientHint: z.string().optional(),
  }),
  rewrite_resume_bullet: z.object({
    originalBullet: z.string().min(1),
    rewrittenBullet: z.string().min(1),
    evidence: z.string().optional(),
  }),
  create_company_brief: z.object({
    companyName: z.string().min(1),
    roleTitle: z.string().optional(),
  }),
  update_prep_plan: z.object({
    prepPlanId: z.string().uuid(),
    patch: z.record(z.string(), z.unknown()),
  }),
  propose_opportunity_update: z.object({
    opportunityId: z.string().uuid(),
    changes: z.record(z.string(), z.unknown()),
  }),
  summarize_progress: z.object({
    reportId: z.string().uuid(),
    windowDays: z.number().int().positive().max(365),
  }),
};

export interface PayloadValidationOk {
  ok: true;
  payload: Record<string, unknown>;
}

export interface PayloadValidationErr {
  ok: false;
  error: ReturnType<z.ZodError['flatten']>;
}

export type PayloadValidationResult = PayloadValidationOk | PayloadValidationErr;

export function validateActionPayload(
  actionType: AgentActionType,
  payload: unknown
): PayloadValidationResult {
  const schema = ACTION_PAYLOAD_SCHEMAS[actionType];
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten() };
  }
  return { ok: true, payload: parsed.data as Record<string, unknown> };
}

export interface TransitionOk {
  ok: true;
}

export interface TransitionErr {
  ok: false;
  reason: 'invalid_transition' | 'external_send_blocked';
  message: string;
  allowed: readonly AgentActionStatus[];
}

export type TransitionResult = TransitionOk | TransitionErr;

/**
 * Enforces the action approval state machine.
 *
 * In M3 there is no execution layer for external-send actions, so an action
 * with `requiresExternalSend = true` cannot transition past `approved`. This
 * is a hard guarantee at the API boundary — agents have zero autonomy to send
 * anything user-facing without an explicit approved → completed flow that is
 * not yet implemented.
 */
export function assertTransitionAllowed(
  from: AgentActionStatus,
  to: AgentActionStatus,
  options: { actionType: AgentActionType; requiresExternalSend: boolean }
): TransitionResult {
  const allowed = ALLOWED_TRANSITIONS[from];

  if (!allowed.includes(to)) {
    return {
      ok: false,
      reason: 'invalid_transition',
      message: `Cannot transition action from "${from}" to "${to}".`,
      allowed,
    };
  }

  if (
    from === 'approved' &&
    (to === 'completed' || to === 'failed') &&
    options.requiresExternalSend
  ) {
    return {
      ok: false,
      reason: 'external_send_blocked',
      message:
        'External send is not yet implemented. Actions that produce user-facing output cannot be completed through this endpoint.',
      allowed: [],
    };
  }

  return { ok: true };
}

export { actionRequiresExternalSend };
