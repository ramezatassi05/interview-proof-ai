export const COMPANY_AGENT_KINDS = [
  'ceo_orchestrator',
  'executive_assistant',
  'director_marketing',
  'director_finance',
  'director_engineering',
] as const;

export type CompanyAgentKind = (typeof COMPANY_AGENT_KINDS)[number];

export const COMPANY_ACTION_TYPES = [
  'draft_brief',
  'draft_marketing_asset',
  'draft_finance_memo',
  'draft_engineering_spec',
  'create_task',
  'record_decision',
  'request_approval',
  'summarize_metrics',
] as const;

export type CompanyActionType = (typeof COMPANY_ACTION_TYPES)[number];

export const COMPANY_ACTION_STATUSES = [
  'drafted',
  'awaiting_approval',
  'approved',
  'rejected',
  'completed',
  'failed',
] as const;

export type CompanyActionStatus = (typeof COMPANY_ACTION_STATUSES)[number];

export type CompanyActionPriority = 'low' | 'medium' | 'high' | 'critical';

export const COMPANY_AGENT_TRIGGERED_BY = ['user', 'cron', 'agent'] as const;
export type CompanyAgentTriggeredBy = (typeof COMPANY_AGENT_TRIGGERED_BY)[number];

export interface CompanyProposedAction {
  title: string;
  actionType: CompanyActionType;
  rationale: string;
  priority: CompanyActionPriority;
  payload: Record<string, unknown>;
  requiresApproval: boolean;
}

export interface CompanyAgentOutput {
  agentKind: CompanyAgentKind;
  summary: string;
  priorities: string[];
  proposedActions: CompanyProposedAction[];
  evidenceRefs: { label: string; source: string }[];
}

export interface CompanyAgentSessionRow {
  id: string;
  user_id: string;
  agent_kind: CompanyAgentKind;
  title: string;
  status: 'active' | 'archived' | 'completed';
  last_message_at: string | null;
  archived_at: string | null;
  triggered_by: CompanyAgentTriggeredBy;
  created_at: string;
  updated_at: string;
}

export interface CompanyAgentActionRow {
  id: string;
  user_id: string;
  session_id: string | null;
  agent_kind: CompanyAgentKind;
  action_type: CompanyActionType;
  title: string;
  rationale: string;
  priority: CompanyActionPriority;
  payload_json: Record<string, unknown>;
  status: CompanyActionStatus;
  result_json: Record<string, unknown> | null;
  evidence_refs_json: { label: string; source: string }[] | null;
  requires_approval: boolean;
  triggered_by: CompanyAgentTriggeredBy;
  approved_at: string | null;
  completed_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMetricsSnapshot {
  totalUsers: number;
  totalReports: number;
  unlockedReports: number;
  unlockRate: number;
  totalCreditsPurchased: number;
  estimatedRevenueCents: number;
  pendingCompanyActions: number;
  activeCompanySessions: number;
  capturedAt: string;
}

export function publicCompanySession(row: CompanyAgentSessionRow) {
  return {
    id: row.id,
    agentKind: row.agent_kind,
    title: row.title,
    status: row.status,
    lastMessageAt: row.last_message_at,
    archivedAt: row.archived_at,
    triggeredBy: row.triggered_by ?? 'user',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function publicCompanyAction(row: CompanyAgentActionRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    agentKind: row.agent_kind,
    actionType: row.action_type,
    title: row.title,
    rationale: row.rationale,
    priority: row.priority,
    payloadJson: row.payload_json,
    status: row.status,
    resultJson: row.result_json,
    evidenceRefsJson: row.evidence_refs_json ?? [],
    requiresApproval: row.requires_approval,
    triggeredBy: row.triggered_by ?? 'user',
    approvedAt: row.approved_at,
    completedAt: row.completed_at,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
