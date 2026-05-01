import type { Opportunity, OpportunityStage } from '@/types';

export const OPPORTUNITY_STAGES: readonly OpportunityStage[] = [
  'applied',
  'recruiter_screen',
  'phone_screen',
  'onsite',
  'offer',
  'rejected',
  'withdrawn',
] as const;

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  applied: 'Applied',
  recruiter_screen: 'Recruiter Screen',
  phone_screen: 'Phone Screen',
  onsite: 'Onsite',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export interface OpportunityRow {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string;
  stage: OpportunityStage;
  interview_date: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export function rowToOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    roleTitle: row.role_title,
    stage: row.stage,
    interviewDate: row.interview_date,
    notes: row.notes,
    archived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
