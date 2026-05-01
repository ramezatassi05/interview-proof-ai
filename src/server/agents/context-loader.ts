/**
 * loadAgentContext — reusable bundle loader for agentic platform agents.
 *
 * Reads from the supabase client passed in (must be the user-scoped client so
 * RLS enforces ownership). Centralizes the joins agents need: latest report
 * run (LLM analysis + diagnostic intelligence), profile, practice progress,
 * the active prep plan, non-archived opportunities, and recent memory.
 *
 * Agents call this once at the top of their pipeline; they never query these
 * tables directly. Keeping load surface narrow lets us swap data sources or
 * add caching in one place.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeUserPracticeProgress } from './practice-progress';
import type {
  DiagnosticIntelligence,
  LLMAnalysis,
  Opportunity,
  PracticeProgress,
  PrepPlan,
  PrepPlanTask,
  UserMemory,
  UserProfile,
} from '@/types';
import { rowToUserMemory } from '@/lib/agent/types';
import type { UserMemoryRow } from '@/lib/agent/types';

const RECENT_MEMORY_LIMIT = 20;

export interface AgentContextReportSummary {
  id: string;
  roundType: string;
  roleTitle: string | null;
  companyName: string | null;
  jobDescriptionText: string;
  resumeText: string | null;
  readinessScore: number | null;
  riskBand: string | null;
  createdAt: string;
}

export interface AgentContextActivePrepPlan {
  plan: PrepPlan;
  tasks: PrepPlanTask[];
}

export interface AgentContextBundle {
  report: AgentContextReportSummary;
  diagnosticIntelligence: DiagnosticIntelligence | null;
  llmAnalysis: LLMAnalysis | null;
  userProfile: UserProfile | null;
  practiceProgress: PracticeProgress;
  activePrepPlan: AgentContextActivePrepPlan | null;
  opportunities: Opportunity[];
  recentMemory: UserMemory[];
}

interface ReportRow {
  id: string;
  user_id: string;
  round_type: string;
  resume_text: string | null;
  job_description_text: string;
  created_at: string;
}

interface RunRow {
  id: string;
  report_id: string;
  run_index: number;
  extracted_jd_json: Record<string, unknown> | null;
  llm_analysis_json: LLMAnalysis | null;
  diagnostic_intelligence_json: DiagnosticIntelligence | null;
  readiness_score: number | null;
  risk_band: string | null;
  created_at: string;
}

interface UserProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  career_stage: string | null;
  target_roles: string[] | null;
  target_domains: string[] | null;
  years_experience: number | null;
  prep_urgency: string | null;
  biggest_concern: string | null;
  interview_experience: string | null;
  target_company_tier: string | null;
  practice_pain: string | null;
  interview_motivation: string | null;
  confidence_drop: string | null;
  segment: string | null;
  resume_text: string | null;
  resume_pdf_path: string | null;
  target_countries: string[] | null;
  target_cities: string[] | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  aha_score: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface PrepPlanRow {
  id: string;
  user_id: string;
  report_id: string | null;
  opportunity_id: string | null;
  target_date: string | null;
  status: 'active' | 'archived' | 'completed';
  plan_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface PrepPlanTaskRow {
  id: string;
  prep_plan_id: string;
  day_offset: number;
  title: string;
  description: string | null;
  category:
    | 'practice'
    | 'study'
    | 'behavioral'
    | 'technical'
    | 'company_research'
    | 'review'
    | 'rest';
  estimated_minutes: number | null;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
  evidence_refs_json: unknown[] | null;
  created_at: string;
  updated_at: string;
}

interface OpportunityRow {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string;
  stage: Opportunity['stage'];
  interview_date: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

function rowToUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    careerStage: row.career_stage as UserProfile['careerStage'],
    targetRoles: row.target_roles ?? [],
    targetDomains: (row.target_domains as UserProfile['targetDomains']) ?? [],
    yearsExperience: row.years_experience,
    prepUrgency: row.prep_urgency as UserProfile['prepUrgency'],
    biggestConcern: row.biggest_concern,
    interviewExperience: row.interview_experience as UserProfile['interviewExperience'],
    targetCompanyTier: row.target_company_tier as UserProfile['targetCompanyTier'],
    practicePain: row.practice_pain as UserProfile['practicePain'],
    interviewMotivation: row.interview_motivation as UserProfile['interviewMotivation'],
    confidenceDrop: row.confidence_drop as UserProfile['confidenceDrop'],
    segment: row.segment,
    resumeText: row.resume_text,
    resumePdfPath: row.resume_pdf_path,
    targetCountries: row.target_countries ?? [],
    targetCities: row.target_cities ?? [],
    onboardingCompleted: row.onboarding_completed,
    onboardingStep: row.onboarding_step,
    onboardingCompletedAt: row.onboarding_completed_at,
    ahaScore: row.aha_score as UserProfile['ahaScore'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPrepPlan(row: PrepPlanRow): PrepPlan {
  return {
    id: row.id,
    userId: row.user_id,
    reportId: row.report_id,
    opportunityId: row.opportunity_id,
    targetDate: row.target_date,
    status: row.status,
    planJson: row.plan_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPrepPlanTask(row: PrepPlanTaskRow): PrepPlanTask {
  return {
    id: row.id,
    prepPlanId: row.prep_plan_id,
    dayOffset: row.day_offset,
    title: row.title,
    description: row.description,
    category: row.category,
    estimatedMinutes: row.estimated_minutes,
    status: row.status,
    evidenceRefsJson: row.evidence_refs_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToOpportunity(row: OpportunityRow): Opportunity {
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

export class AgentContextNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentContextNotFoundError';
  }
}

export interface LoadAgentContextArgs {
  userId: string;
  reportId: string;
  supabase: SupabaseClient;
}

/**
 * Loads the typed context bundle for an agent.
 *
 * Throws `AgentContextNotFoundError` if the report does not exist or is not
 * owned by the user. RLS will already enforce ownership; the explicit
 * `.eq('user_id', userId)` is defense in depth.
 */
export async function loadAgentContext({
  userId,
  reportId,
  supabase,
}: LoadAgentContextArgs): Promise<AgentContextBundle> {
  // 1) Report row
  const { data: reportRow, error: reportErr } = await supabase
    .from('reports')
    .select('id, user_id, round_type, resume_text, job_description_text, created_at')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single();

  if (reportErr || !reportRow) {
    throw new AgentContextNotFoundError(`Report ${reportId} not found for user ${userId}`);
  }

  const report = reportRow as ReportRow;

  // 2) Latest run for that report (highest run_index → most recent analysis)
  const { data: runData } = await supabase
    .from('runs')
    .select(
      'id, report_id, run_index, extracted_jd_json, llm_analysis_json, diagnostic_intelligence_json, readiness_score, risk_band, created_at'
    )
    .eq('report_id', reportId)
    .order('run_index', { ascending: false })
    .limit(1);

  const latestRun = (runData?.[0] ?? null) as RunRow | null;

  const extractedJd = (latestRun?.extracted_jd_json ?? null) as {
    companyName?: string;
    jobTitle?: string;
  } | null;

  const reportSummary: AgentContextReportSummary = {
    id: report.id,
    roundType: report.round_type,
    roleTitle: extractedJd?.jobTitle ?? null,
    companyName: extractedJd?.companyName ?? null,
    jobDescriptionText: report.job_description_text,
    resumeText: report.resume_text,
    readinessScore: latestRun?.readiness_score ?? null,
    riskBand: latestRun?.risk_band ?? null,
    createdAt: report.created_at,
  };

  // 3) User profile (may not exist yet for a returning user)
  const { data: profileRow } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const userProfile = profileRow ? rowToUserProfile(profileRow as UserProfileRow) : null;

  // 4) Practice progress (read-only summary)
  const practiceProgress = await computeUserPracticeProgress(userId, reportId, supabase);

  // 5) Active prep plan (most recent active plan + its tasks)
  const { data: planRows } = await supabase
    .from('prep_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1);

  let activePrepPlan: AgentContextActivePrepPlan | null = null;
  const activePlanRow = (planRows?.[0] ?? null) as PrepPlanRow | null;
  if (activePlanRow) {
    const { data: taskRows } = await supabase
      .from('prep_plan_tasks')
      .select('*')
      .eq('prep_plan_id', activePlanRow.id)
      .order('day_offset', { ascending: true });
    const tasks = ((taskRows ?? []) as PrepPlanTaskRow[]).map(rowToPrepPlanTask);
    activePrepPlan = { plan: rowToPrepPlan(activePlanRow), tasks };
  }

  // 6) Opportunities (non-archived only — what the user is actively pursuing)
  const { data: oppRows } = await supabase
    .from('opportunities')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  const opportunities = ((oppRows ?? []) as OpportunityRow[]).map(rowToOpportunity);

  // 7) Recent user memory (most recently updated entries)
  const { data: memoryRows } = await supabase
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(RECENT_MEMORY_LIMIT);

  const recentMemory = ((memoryRows ?? []) as UserMemoryRow[]).map(rowToUserMemory);

  return {
    report: reportSummary,
    diagnosticIntelligence: latestRun?.diagnostic_intelligence_json ?? null,
    llmAnalysis: latestRun?.llm_analysis_json ?? null,
    userProfile,
    practiceProgress,
    activePrepPlan,
    opportunities,
    recentMemory,
  };
}
