/**
 * delegate_to_specialist executor — Phase B v1.
 *
 * Inter-agent delegation as a routing hint, not a fully-async invocation.
 * The executor:
 *   1. Creates an `agent_sessions` row for the target agent (so the user
 *      lands on a primed conversation when they open it).
 *   2. Persists the proposing agent's brief as the first system message in
 *      that session — the target specialist sees it as context.
 *   3. Returns a result_json with the new sessionId + a UI deep link so
 *      the post-completion user_notifications row points the user to the
 *      right surface.
 *
 * Why not invoke the target agent inline: most specialists need user
 * input on every turn (an answer to score, a brief from the user, etc).
 * Auto-invoking would either fabricate user input or skip critical context.
 * The routing-hint approach keeps the user in the loop.
 */
import type { ActionExecutor } from './index';

const TARGET_SURFACE_HREFS: Record<string, (reportId: string | null) => string | null> = {
  readiness_coach: (r) => (r ? `/r/${r}/full?tab=coach&agent=readiness_coach` : null),
  mock_interview: (r) => (r ? `/r/${r}/full?tab=coach&agent=mock_interview` : null),
  prep_plan: (r) => (r ? `/r/${r}/full?tab=strategy` : null),
  resume_evidence: (r) => (r ? `/r/${r}/full?tab=evidence` : null),
  company_research: (r) => (r ? `/r/${r}/full?tab=insights` : null),
  recruiter_comm: () => '/opportunities',
  opportunity_tracker: () => '/opportunities',
  application_materials: (r) => (r ? `/r/${r}/full?tab=evidence` : null),
  post_interview_debrief: (r) => (r ? `/r/${r}/full?tab=coach&agent=post_interview_debrief` : null),
};

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export const executeDelegateToSpecialist: ActionExecutor = async (action, { supabase }) => {
  const targetAgentKind = asString(action.payload_json.targetAgentKind);
  const brief = asString(action.payload_json.brief);

  if (!targetAgentKind || !brief) {
    return { ok: false, error: 'Missing targetAgentKind or brief' };
  }

  const { data: session, error: sessionErr } = await supabase
    .from('agent_sessions')
    .insert({
      user_id: action.user_id,
      agent_kind: targetAgentKind,
      report_id: action.report_id,
    })
    .select('id')
    .single();

  if (sessionErr || !session) {
    return { ok: false, error: `Failed to create target session: ${sessionErr?.message ?? 'unknown'}` };
  }

  const targetSessionId = session.id as string;

  const { error: msgErr } = await supabase.from('agent_messages').insert({
    session_id: targetSessionId,
    role: 'system',
    content_json: {
      type: 'delegation_brief',
      from_action_id: action.id,
      from_session_id: action.session_id,
      brief,
    },
    tokens_in: null,
    tokens_out: null,
  });

  if (msgErr) {
    console.error('[delegate_to_specialist] brief insert failed:', msgErr);
    // Continue — the session exists; missing brief is non-fatal.
  }

  const hrefBuilder = TARGET_SURFACE_HREFS[targetAgentKind];
  const href = hrefBuilder ? hrefBuilder(action.report_id) : null;

  return {
    ok: true,
    resultJson: {
      delivery: 'session_primed',
      targetAgentKind,
      targetSessionId,
      href,
    },
  };
};
