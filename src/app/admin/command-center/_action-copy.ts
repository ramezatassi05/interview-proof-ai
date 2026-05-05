import type { CompanyActionType } from '@/server/agents/company/types';

const ACTION_TYPE_FRIENDLY: Record<CompanyActionType, string> = {
  draft_brief: 'a quick brief',
  draft_marketing_asset: 'some marketing copy',
  draft_finance_memo: 'a finance note',
  draft_engineering_spec: 'an engineering spec',
  create_task: 'a new task',
  record_decision: 'a decision to log',
  request_approval: 'something to approve',
  summarize_metrics: 'a metrics summary',
};

export function friendlyActionType(actionType: string): string {
  return ACTION_TYPE_FRIENDLY[actionType as CompanyActionType] ?? actionType.replace(/_/g, ' ');
}
