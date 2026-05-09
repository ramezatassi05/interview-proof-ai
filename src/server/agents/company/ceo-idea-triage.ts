import type { SupabaseClient } from '@supabase/supabase-js';
import { runCeoOrchestratorStream } from './ceo-orchestrator';

export interface CeoIdeaContext {
  cwd?: string;
  branch?: string;
  lastCommitSubject?: string;
  lastCommitSha?: string;
}

const MAX_ACTIONS_PER_IDEA = 3;

/**
 * Frame a raw CEO idea (typed in Claude Code) as a structured message the CEO
 * orchestrator can route. The orchestrator already knows how to delegate via
 * create_task / draft_brief; we just hand it the idea with grounding context
 * and a soft cap so the resulting inbox stays scannable.
 */
export function formatIdeaPrompt(args: {
  rawText: string;
  context?: CeoIdeaContext | null;
}): string {
  const ctx = args.context ?? {};
  const ctxLines: string[] = [];
  if (ctx.branch) ctxLines.push(`branch: ${ctx.branch}`);
  if (ctx.lastCommitSubject) {
    const sha = ctx.lastCommitSha ? ` (${ctx.lastCommitSha.slice(0, 7)})` : '';
    ctxLines.push(`last commit: ${ctx.lastCommitSubject}${sha}`);
  }
  if (ctx.cwd) ctxLines.push(`cwd: ${ctx.cwd}`);

  const header = [
    '[CEO_CLI_IDEA — relayed from Claude Code in the InterviewProof repo]',
    'I just dropped this idea from my CLI. Triage it and route it to the right specialist(s).',
    `Cap yourself at ${MAX_ACTIONS_PER_IDEA} concrete actions (create_task or draft_brief). If the idea is exploratory, prefer one create_task that scopes follow-up.`,
    'Use the repo context below only as grounding. Do not assume the idea must be implemented in this branch.',
  ].join('\n');

  const ctxBlock = ctxLines.length > 0 ? `\n\nRepo context:\n- ${ctxLines.join('\n- ')}` : '';

  return `${header}${ctxBlock}\n\nIdea:\n${args.rawText.trim()}`;
}

/**
 * Fire-and-forget triage. Runs the CEO orchestrator inline with the formatted
 * idea, persists messages/actions to the DB via the existing runner, and on
 * completion patches the parent ceo_ideas row with status + spawned action ids.
 *
 * Returns the promise so the caller can attach error logging; do NOT await it
 * if you want a fast HTTP response — let it run in the background.
 */
export async function runIdeaTriage(args: {
  supabase: SupabaseClient;
  serviceClient: SupabaseClient;
  userId: string;
  ideaId: string;
  sessionId: string;
  rawText: string;
  context?: CeoIdeaContext | null;
}): Promise<void> {
  const message = formatIdeaPrompt({ rawText: args.rawText, context: args.context });

  try {
    const result = await runCeoOrchestratorStream(
      {
        userId: args.userId,
        sessionId: args.sessionId,
        message,
        triggeredBy: 'ceo_cli',
        supabase: args.supabase,
      },
      {
        // No live callbacks — the browser hydrates from the DB. We rely on
        // the runner's built-in persistence of messages and actions.
      }
    );

    const linkedActionIds = (result.linkedActionIds ?? []).slice(0, MAX_ACTIONS_PER_IDEA);

    await args.serviceClient
      .from('ceo_ideas')
      .update({
        status: 'routed',
        spawned_action_ids: linkedActionIds,
      })
      .eq('id', args.ideaId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown triage error';
    console.error('[ceo-idea-triage] failed:', err);
    await args.serviceClient
      .from('ceo_ideas')
      .update({
        status: 'failed',
        error: message.slice(0, 500),
      })
      .eq('id', args.ideaId);
  }
}
