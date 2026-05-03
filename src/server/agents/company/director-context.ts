import type { SupabaseClient } from '@supabase/supabase-js';
import type { CompanyAgentKind } from './types';

export interface DirectorContext {
  summary: string;
  structured: Record<string, unknown>;
}

interface LoadDirectorContextArgs {
  supabase: SupabaseClient;
  userId: string;
  kind: CompanyAgentKind;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

async function countRowsSince(
  supabase: SupabaseClient,
  table: string,
  column: string,
  sinceIso: string
): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .gte(column, sinceIso);
  return count ?? 0;
}

async function loadMarketingContext(supabase: SupabaseClient): Promise<DirectorContext> {
  const reports7 = await countRowsSince(supabase, 'reports', 'created_at', isoDaysAgo(7));
  const reports30 = await countRowsSince(supabase, 'reports', 'created_at', isoDaysAgo(30));
  const profiles7 = await countRowsSince(supabase, 'user_profiles', 'created_at', isoDaysAgo(7));
  const profiles30 = await countRowsSince(supabase, 'user_profiles', 'created_at', isoDaysAgo(30));

  const { data: profileRows } = await supabase
    .from('user_profiles')
    .select('target_roles, target_domains')
    .order('created_at', { ascending: false })
    .limit(500);

  const roleTally: Record<string, number> = {};
  const domainTally: Record<string, number> = {};
  for (const raw of profileRows ?? []) {
    const row = raw as { target_roles: unknown; target_domains: unknown };
    const roles = Array.isArray(row.target_roles) ? (row.target_roles as string[]) : [];
    const domains = Array.isArray(row.target_domains) ? (row.target_domains as string[]) : [];
    for (const r of roles) roleTally[r] = (roleTally[r] ?? 0) + 1;
    for (const d of domains) domainTally[d] = (domainTally[d] ?? 0) + 1;
  }

  const topRoles = Object.entries(roleTally)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([role, count]) => ({ role, count }));
  const topDomains = Object.entries(domainTally)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([domain, count]) => ({ domain, count }));

  const structured = {
    reportsLast7d: reports7,
    reportsLast30d: reports30,
    signupsLast7d: profiles7,
    signupsLast30d: profiles30,
    topTargetRoles: topRoles,
    topTargetDomains: topDomains,
  };

  const summary = [
    `Reports last 7d: ${reports7} | last 30d: ${reports30}`,
    `Signups last 7d: ${profiles7} | last 30d: ${profiles30}`,
    `Top target roles: ${topRoles.map((r) => `${r.role}(${r.count})`).join(', ') || 'n/a'}`,
    `Top target domains: ${topDomains.map((d) => `${d.domain}(${d.count})`).join(', ') || 'n/a'}`,
  ].join('\n');

  return { summary, structured };
}

async function loadEngineeringContext(supabase: SupabaseClient): Promise<DirectorContext> {
  const sinceIso = isoDaysAgo(7);

  const { data: auditFailRows } = await supabase
    .from('agent_audit_events')
    .select('event_type')
    .gte('created_at', sinceIso)
    .in('event_type', ['agent_call_failed', 'action_failed']);
  const auditFailures = auditFailRows?.length ?? 0;

  const { count: actionsFailed } = await supabase
    .from('company_agent_actions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('created_at', sinceIso);

  const { data: recentMigrationRows } = await supabase
    .from('company_agent_actions')
    .select('action_type, status, created_at')
    .eq('agent_kind', 'director_engineering')
    .order('created_at', { ascending: false })
    .limit(5);

  const structured = {
    auditFailuresLast7d: auditFailures,
    companyActionsFailedLast7d: actionsFailed ?? 0,
    recentEngineeringActions: recentMigrationRows ?? [],
  };

  const summary = [
    `Audit failures last 7d: ${auditFailures}`,
    `Company actions failed last 7d: ${actionsFailed ?? 0}`,
    `Recent engineering proposals: ${recentMigrationRows?.length ?? 0}`,
  ].join('\n');

  return { summary, structured };
}

async function loadFinanceContext(supabase: SupabaseClient): Promise<DirectorContext> {
  const sinceIso = isoDaysAgo(30);

  const { data: ledgerRows } = await supabase
    .from('credits_ledger')
    .select('amount, created_at, type')
    .eq('type', 'purchase')
    .gte('created_at', sinceIso);

  const purchasesLast30d = (ledgerRows ?? []).reduce((sum, raw) => {
    const row = raw as { amount: number };
    return sum + Math.max(0, row.amount);
  }, 0);

  const { count: payingUsers } = await supabase
    .from('credits_ledger')
    .select('user_id', { count: 'exact', head: true })
    .eq('type', 'purchase');

  const { count: totalReports } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true });
  const { count: unlockedReports } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('paid_unlocked', true);

  const monthlyBurnUsd = Number(process.env.COMPANY_AGENT_MONTHLY_BURN_USD ?? '0');
  const estimatedRevenueUsd = (purchasesLast30d * 1500) / 100;
  const runwayMonths =
    monthlyBurnUsd > 0 && estimatedRevenueUsd >= 0
      ? Math.max(0, (estimatedRevenueUsd - monthlyBurnUsd) / Math.max(1, monthlyBurnUsd))
      : null;

  const structured = {
    creditsPurchasedLast30d: purchasesLast30d,
    estimatedRevenueLast30dUsd: estimatedRevenueUsd,
    payingUserPurchaseEvents: payingUsers ?? 0,
    totalReports: totalReports ?? 0,
    unlockedReports: unlockedReports ?? 0,
    monthlyBurnUsd,
    runwayMonthsEstimate: runwayMonths,
  };

  const summary = [
    `Credits purchased last 30d: ${purchasesLast30d}`,
    `Estimated revenue last 30d: $${estimatedRevenueUsd.toFixed(2)}`,
    `Paying-user purchase events (all-time): ${payingUsers ?? 0}`,
    `Reports: ${totalReports ?? 0} (unlocked: ${unlockedReports ?? 0})`,
    monthlyBurnUsd > 0
      ? `Monthly burn: $${monthlyBurnUsd.toFixed(2)} | runway estimate: ${runwayMonths?.toFixed(2) ?? 'n/a'} months`
      : 'Monthly burn not configured (set COMPANY_AGENT_MONTHLY_BURN_USD).',
  ].join('\n');

  return { summary, structured };
}

async function loadExecutiveAssistantContext(
  supabase: SupabaseClient,
  userId: string
): Promise<DirectorContext> {
  const counts: Record<string, number> = {};
  for (const status of ['awaiting_approval', 'approved', 'completed', 'failed', 'rejected']) {
    const { count } = await supabase
      .from('company_agent_actions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', status);
    counts[status] = count ?? 0;
  }

  const { data: recentDecisions } = await supabase
    .from('company_decisions')
    .select('title, decided_at')
    .eq('user_id', userId)
    .order('decided_at', { ascending: false })
    .limit(5);

  const { data: openTasks } = await supabase
    .from('company_tasks')
    .select('title, status, owner_kind, created_at')
    .eq('user_id', userId)
    .in('status', ['todo', 'doing', 'blocked'])
    .order('created_at', { ascending: false })
    .limit(5);

  const structured = {
    actionStatusCounts: counts,
    recentDecisions: recentDecisions ?? [],
    openTasks: openTasks ?? [],
  };

  const summary = [
    `Action counts — awaiting:${counts.awaiting_approval} approved:${counts.approved} completed:${counts.completed} failed:${counts.failed} rejected:${counts.rejected}`,
    `Recent decisions: ${(recentDecisions ?? []).map((d) => (d as { title: string }).title).join('; ') || 'none'}`,
    `Open tasks: ${(openTasks ?? []).length}`,
  ].join('\n');

  return { summary, structured };
}

export async function loadDirectorContext(args: LoadDirectorContextArgs): Promise<DirectorContext> {
  const { supabase, userId, kind } = args;
  switch (kind) {
    case 'director_marketing':
      return loadMarketingContext(supabase);
    case 'director_engineering':
      return loadEngineeringContext(supabase);
    case 'director_finance':
      return loadFinanceContext(supabase);
    case 'executive_assistant':
      return loadExecutiveAssistantContext(supabase, userId);
    case 'ceo_orchestrator':
    default:
      return { summary: '', structured: {} };
  }
}
