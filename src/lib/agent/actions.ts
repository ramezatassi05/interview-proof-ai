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
  propose_opportunity_create: z.object({
    companyName: z.string().min(1).max(200),
    roleTitle: z.string().min(1).max(200),
    stage: z
      .enum([
        'applied',
        'recruiter_screen',
        'phone_screen',
        'onsite',
        'offer',
        'rejected',
        'withdrawn',
      ])
      .default('applied'),
    notes: z.string().max(2000).optional(),
    sourceUrl: z.string().url().optional(),
  }),
  delegate_to_specialist: z.object({
    targetAgentKind: z.enum([
      'readiness_coach',
      'mock_interview',
      'prep_plan',
      'resume_evidence',
      'company_research',
      'recruiter_comm',
      'opportunity_tracker',
      'application_materials',
      'post_interview_debrief',
    ]),
    brief: z.string().min(1).max(2000),
    reportId: z.string().uuid().optional(),
    opportunityId: z.string().uuid().optional(),
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
 * External-send actions (`requiresExternalSend = true`) cannot transition
 * past `approved` from the user-facing API. Only the executor cron
 * (`/api/cron/execute-approved-actions`) flips them to `completed` /
 * `failed`, and only when it sets `executorAuthorized: true`. This keeps the
 * autonomy boundary explicit: no API route a user can hit will ever mark an
 * outbound action as sent.
 */
export function assertTransitionAllowed(
  from: AgentActionStatus,
  to: AgentActionStatus,
  options: {
    actionType: AgentActionType;
    requiresExternalSend: boolean;
    executorAuthorized?: boolean;
  }
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
    options.requiresExternalSend &&
    !options.executorAuthorized
  ) {
    return {
      ok: false,
      reason: 'external_send_blocked',
      message:
        'External-send actions can only be completed by the executor cron. Approve the action and let the executor handle delivery.',
      allowed: [],
    };
  }

  return { ok: true };
}

export { actionRequiresExternalSend };
