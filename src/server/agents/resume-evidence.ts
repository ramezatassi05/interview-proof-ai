/**
 * runResumeEvidence — M7.5 entrypoint.
 *
 * Drafts 3 alternative rewrites for a resume bullet aligned to a specific JD
 * requirement. Drafts a `rewrite_resume_bullet` action with
 * requires_external_send=true (the bullet ends up in user-facing copy, so
 * approval is required).
 *
 * The action's payload satisfies the existing validateActionPayload schema
 * (originalBullet, rewrittenBullet, evidence?). The full set of 3
 * alternatives is preserved in evidence_refs_json so the approval UI in M8
 * can let the user pick which one to apply.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { validateActionPayload } from '@/lib/agent/actions';
import type { ResumeBulletAlternative, ResumeEvidenceOutput } from '@/types';
import { loadAgentContext } from './context-loader';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts/resume-evidence';

export const RESUME_EVIDENCE_VERSION = 'v1.0.0';

const AlternativeSchema = z.object({
  bullet: z.string().min(1).max(800),
  rationale: z.string().min(1).max(800),
  evidence_alignment: z.string().min(1).max(800),
});

const ResumeEvidenceOutputSchema = z.object({
  alternatives: z.array(AlternativeSchema).length(3),
  critique_of_original: z.string().min(1).max(2000),
});

export class ResumeEvidenceError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'ResumeEvidenceError';
    this.cause = options?.cause;
  }
}

export interface RunResumeEvidenceArgs {
  userId: string;
  reportId: string;
  sessionId: string;
  supabase: SupabaseClient;
  originalBullet: string;
  targetRequirement: string;
}

export interface RunResumeEvidenceResult {
  output: ResumeEvidenceOutput;
  actionId: string | null;
  tokensIn: number;
  tokensOut: number;
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
  }
  return trimmed;
}

function extractAssistantText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

export async function runResumeEvidence(
  args: RunResumeEvidenceArgs
): Promise<RunResumeEvidenceResult> {
  const { userId, reportId, sessionId, supabase, originalBullet, targetRequirement } = args;

  const context = await loadAgentContext({ userId, reportId, supabase });

  const { prompt: userPrompt } = buildUserPrompt(context, originalBullet, targetRequirement);

  const client = getAnthropicClient();
  let response: Anthropic.Messages.Message;
  try {
    response = await client.messages.create({
      model: CLAUDE_MODELS.reasoning,
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });
  } catch (err) {
    throw new ResumeEvidenceError('LLM call failed', { cause: err });
  }

  const rawText = extractAssistantText(response);
  if (!rawText) throw new ResumeEvidenceError('Empty LLM response');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(rawText));
  } catch (err) {
    console.error('[resume-evidence] JSON parse failure. Raw:', rawText);
    throw new ResumeEvidenceError('LLM returned non-JSON output', { cause: err });
  }

  const validated = ResumeEvidenceOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error('[resume-evidence] Schema validation failure:', validated.error.flatten());
    throw new ResumeEvidenceError('LLM output failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  const alternatives: ResumeBulletAlternative[] = validated.data.alternatives.map((a) => ({
    bullet: a.bullet,
    rationale: a.rationale,
    evidenceAlignment: a.evidence_alignment,
  }));

  const output: ResumeEvidenceOutput = {
    alternatives,
    critiqueOfOriginal: validated.data.critique_of_original,
  };

  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;

  // Persist user + agent message
  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'user',
    content_json: { originalBullet, targetRequirement },
    tokens_in: null,
    tokens_out: null,
  });

  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    content_json: {
      alternatives,
      critiqueOfOriginal: output.critiqueOfOriginal,
      version: RESUME_EVIDENCE_VERSION,
    },
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });

  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  // Draft rewrite_resume_bullet action. The canonical payload schema only
  // captures one rewritten bullet; we set the first alternative as the
  // default selection. The full set of alternatives is preserved in
  // evidence_refs_json so the approval modal (M8) can let the user pick.
  const defaultAlternative = alternatives[0];
  const payload = {
    originalBullet,
    rewrittenBullet: defaultAlternative.bullet,
    evidence: defaultAlternative.evidenceAlignment.slice(0, 800),
  };
  const v = validateActionPayload('rewrite_resume_bullet', payload);
  let actionId: string | null = null;
  if (!v.ok) {
    throw new ResumeEvidenceError(
      `rewrite_resume_bullet payload invalid: ${JSON.stringify(v.error)}`
    );
  }

  const evidenceRefs = [
    {
      kind: 'resume_bullet_alternatives',
      targetRequirement,
      critiqueOfOriginal: output.critiqueOfOriginal,
      alternatives,
    },
  ];

  const { data: insertedActions, error: actionsErr } = await supabase
    .from('agent_actions')
    .insert([
      {
        user_id: userId,
        session_id: sessionId,
        report_id: reportId,
        action_type: 'rewrite_resume_bullet',
        payload_json: v.payload,
        status: 'drafted',
        // Always external-facing — the bullet ends up in the user's resume.
        // rewrite_resume_bullet is already in EXTERNAL_SEND_ACTIONS, but we
        // assert explicitly so this remains correct even if the registry
        // changes.
        requires_external_send: true,
        evidence_refs_json: evidenceRefs,
      },
    ])
    .select('id');

  if (actionsErr || !insertedActions || insertedActions.length === 0) {
    console.error('[resume-evidence] Failed to persist action:', actionsErr);
    throw new ResumeEvidenceError('Failed to persist drafted action', { cause: actionsErr });
  }
  actionId = insertedActions[0].id as string;

  return { output, actionId, tokensIn, tokensOut };
}
