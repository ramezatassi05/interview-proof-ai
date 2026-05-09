import type {
  AgentAction,
  AgentActionStatus,
  AgentActionType,
  AgentKind,
  AgentMessage,
  AgentMessageRole,
  AgentSession,
  AgentSessionStatus,
  UserMemory,
  UserMemoryKind,
} from '@/types';

export type {
  AgentAction,
  AgentActionStatus,
  AgentActionType,
  AgentKind,
  AgentMessage,
  AgentMessageRole,
  AgentSession,
  AgentSessionStatus,
  UserMemory,
  UserMemoryKind,
};

export const AGENT_ACTION_TYPES: readonly AgentActionType[] = [
  'recommend_drill',
  'start_mock_interview',
  'score_answer',
  'draft_recruiter_reply',
  'rewrite_resume_bullet',
  'create_company_brief',
  'update_prep_plan',
  'propose_opportunity_update',
  'summarize_progress',
  'delegate_to_specialist',
  'propose_opportunity_create',
] as const;

export const AGENT_KINDS: readonly AgentKind[] = [
  'orchestrator',
  'readiness_coach',
  'answer_feedback',
  'mock_interview',
  'prep_plan',
  'resume_evidence',
  'company_research',
  'recruiter_comm',
  'opportunity_tracker',
  'post_interview_debrief',
  'application_materials',
] as const;

export const AGENT_SESSION_STATUSES: readonly AgentSessionStatus[] = [
  'active',
  'archived',
  'completed',
] as const;

export const AGENT_MESSAGE_ROLES: readonly AgentMessageRole[] = [
  'user',
  'agent',
  'system',
  'tool',
] as const;

export const AGENT_ACTION_STATUSES: readonly AgentActionStatus[] = [
  'drafted',
  'awaiting_approval',
  'approved',
  'rejected',
  'completed',
  'failed',
] as const;

export const USER_MEMORY_KINDS: readonly UserMemoryKind[] = [
  'weakness',
  'preference',
  'interview_date',
  'goal',
  'custom',
] as const;

// Action approval state machine.
// drafted ──► awaiting_approval ──► approved ──► completed
//    │              │                  │            │
//    ├─► rejected   └─► rejected       └─► failed   (terminal)
//    └─► (terminal)
export const ALLOWED_TRANSITIONS: Record<AgentActionStatus, readonly AgentActionStatus[]> = {
  drafted: ['awaiting_approval', 'rejected'],
  awaiting_approval: ['approved', 'rejected'],
  approved: ['completed', 'failed'],
  rejected: [],
  completed: [],
  failed: [],
};

// Actions that may only be finalized by the executor cron.
// Originally just "external sends" (recruiter reply, resume bullet rewrite),
// now also includes inter-agent delegations whose completion side-effects
// (target session creation, primed brief) must run server-side. The API
// PATCH route refuses approved → completed/failed for these; the cron at
// /api/cron/execute-approved-actions sets executorAuthorized=true to bypass.
export const EXTERNAL_SEND_ACTIONS: ReadonlySet<AgentActionType> = new Set<AgentActionType>([
  'draft_recruiter_reply',
  'rewrite_resume_bullet',
  'delegate_to_specialist',
  'propose_opportunity_create',
]);

export function actionRequiresExternalSend(actionType: AgentActionType): boolean {
  return EXTERNAL_SEND_ACTIONS.has(actionType);
}

// Snake-case DB row shapes (what supabase returns) — kept narrow on purpose.
export interface AgentSessionRow {
  id: string;
  user_id: string;
  report_id: string | null;
  agent_kind: AgentKind;
  status: AgentSessionStatus;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentMessageRow {
  id: string;
  session_id: string;
  role: AgentMessageRole;
  content_json: Record<string, unknown>;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
}

export interface AgentActionRow {
  id: string;
  user_id: string;
  session_id: string | null;
  report_id: string | null;
  action_type: AgentActionType;
  payload_json: Record<string, unknown>;
  status: AgentActionStatus;
  result_json: Record<string, unknown> | null;
  evidence_refs_json: unknown[] | null;
  requires_external_send: boolean;
  approved_at: string | null;
  completed_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserMemoryRow {
  id: string;
  user_id: string;
  kind: UserMemoryKind;
  key: string;
  value_json: Record<string, unknown>;
  source_action_id: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToAgentSession(row: AgentSessionRow): AgentSession {
  return {
    id: row.id,
    userId: row.user_id,
    reportId: row.report_id,
    agentKind: row.agent_kind,
    status: row.status,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToAgentMessage(row: AgentMessageRow): AgentMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    contentJson: row.content_json,
    tokensIn: row.tokens_in,
    tokensOut: row.tokens_out,
    createdAt: row.created_at,
  };
}

export function rowToAgentAction(row: AgentActionRow): AgentAction {
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    reportId: row.report_id,
    actionType: row.action_type,
    payloadJson: row.payload_json,
    status: row.status,
    resultJson: row.result_json,
    evidenceRefsJson: row.evidence_refs_json,
    requiresExternalSend: row.requires_external_send,
    approvedAt: row.approved_at,
    completedAt: row.completed_at,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToUserMemory(row: UserMemoryRow): UserMemory {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    key: row.key,
    valueJson: row.value_json,
    sourceActionId: row.source_action_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
