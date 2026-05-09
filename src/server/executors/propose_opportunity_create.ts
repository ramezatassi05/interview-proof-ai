/**
 * propose_opportunity_create executor — Phase D.
 *
 * On approval, inserts the opportunity row. Stores the source URL (and any
 * agent-provided notes) so the user can trace where the suggestion came from.
 */
import type { ActionExecutor } from './index';

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

const VALID_STAGES = new Set([
  'applied',
  'recruiter_screen',
  'phone_screen',
  'onsite',
  'offer',
  'rejected',
  'withdrawn',
]);

export const executeProposeOpportunityCreate: ActionExecutor = async (action, { supabase }) => {
  const companyName = asString(action.payload_json.companyName).trim();
  const roleTitle = asString(action.payload_json.roleTitle).trim();
  const stageRaw = asString(action.payload_json.stage, 'applied');
  const stage = VALID_STAGES.has(stageRaw) ? stageRaw : 'applied';
  const notes = asString(action.payload_json.notes).trim() || null;
  const sourceUrl = asString(action.payload_json.sourceUrl).trim() || null;

  if (!companyName || !roleTitle) {
    return { ok: false, error: 'Missing companyName or roleTitle' };
  }

  // Append the source URL to notes so it survives even though opportunities
  // doesn't have a dedicated url column.
  const composedNotes = sourceUrl
    ? `${notes ? `${notes}\n\n` : ''}Source: ${sourceUrl}`
    : notes;

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      user_id: action.user_id,
      company_name: companyName,
      role_title: roleTitle,
      stage,
      notes: composedNotes,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Insert failed' };
  }

  return {
    ok: true,
    resultJson: {
      delivery: 'opportunity_created',
      opportunityId: data.id as string,
      companyName,
      roleTitle,
      stage,
    },
  };
};
