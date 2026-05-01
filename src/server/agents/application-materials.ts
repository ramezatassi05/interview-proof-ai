/**
 * runApplicationMaterials — M7.10 entrypoint.
 *
 * Two modes, no new action types — the canonical action schemas are reused:
 *  - 'bullet'        → drafts a `rewrite_resume_bullet` action
 *                      (originalBullet, rewrittenBullet, evidence)
 *  - 'cover_letter'  → drafts a `draft_recruiter_reply` action
 *                      (subject, body) — recipientHint is omitted because
 *                      cover letters are not direct replies. The approval
 *                      modal already renders this action_type with subject
 *                      + body editors.
 *
 * Both actions are external-send; state machine blocks completion until an
 * external send endpoint exists.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { validateActionPayload } from '@/lib/agent/actions';
import { runAgentCall } from '@/lib/agent/audit';
import type {
  ApplicationMaterialsBulletOutput,
  ApplicationMaterialsCoverLetterOutput,
} from '@/types';
import { loadAgentContext } from './context-loader';
import {
  BULLET_SYSTEM_PROMPT,
  COVER_LETTER_SYSTEM_PROMPT,
  buildBulletPrompt,
  buildCoverLetterPrompt,
} from './prompts/application-materials';

export const APPLICATION_MATERIALS_VERSION = 'v1.0.0';

const BulletSchema = z.object({
  rewrittenBullet: z.string().min(1).max(800),
  evidence: z.string().min(1).max(800),
  rationale: z.string().min(1).max(800),
});

const CoverLetterSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  rationale: z.string().min(1).max(1500),
});

export class ApplicationMaterialsError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'ApplicationMaterialsError';
    this.cause = options?.cause;
  }
}

export type ApplicationMaterialsMode = 'bullet' | 'cover_letter';

export interface RunApplicationMaterialsBulletArgs {
  mode: 'bullet';
  userId: string;
  sessionId: string;
  reportId: string;
  supabase: SupabaseClient;
  originalBullet: string;
  targetRequirement?: string;
}

export interface RunApplicationMaterialsCoverLetterArgs {
  mode: 'cover_letter';
  userId: string;
  sessionId: string;
  reportId: string;
  supabase: SupabaseClient;
  applicationPrompt?: string;
  paragraphsTarget?: number;
}

export type RunApplicationMaterialsArgs =
  | RunApplicationMaterialsBulletArgs
  | RunApplicationMaterialsCoverLetterArgs;

export interface RunApplicationMaterialsBulletResult {
  mode: 'bullet';
  output: ApplicationMaterialsBulletOutput;
  actionId: string | null;
  tokensIn: number;
  tokensOut: number;
}

export interface RunApplicationMaterialsCoverLetterResult {
  mode: 'cover_letter';
  output: ApplicationMaterialsCoverLetterOutput;
  actionId: string | null;
  tokensIn: number;
  tokensOut: number;
}

export type RunApplicationMaterialsResult =
  | RunApplicationMaterialsBulletResult
  | RunApplicationMaterialsCoverLetterResult;

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

export async function runApplicationMaterials(
  args: RunApplicationMaterialsArgs
): Promise<RunApplicationMaterialsResult> {
  const { userId, sessionId, supabase, reportId } = args;

  const context = await loadAgentContext({ userId, reportId, supabase });

  const client = getAnthropicClient();

  if (args.mode === 'bullet') {
    if (!args.originalBullet.trim()) {
      throw new ApplicationMaterialsError('originalBullet is required');
    }

    const { prompt: userPrompt } = buildBulletPrompt(
      context,
      args.originalBullet,
      args.targetRequirement ?? null
    );

    let response: Anthropic.Messages.Message;
    try {
      const wrapped = await runAgentCall(
        {
          userId,
          sessionId,
          agentKind: 'application_materials',
          model: CLAUDE_MODELS.reasoning,
        },
        async () => {
          const value = await client.messages.create({
            model: CLAUDE_MODELS.reasoning,
            max_tokens: 1500,
            system: [
              {
                type: 'text',
                text: BULLET_SYSTEM_PROMPT,
                cache_control: { type: 'ephemeral' },
              },
            ],
            messages: [{ role: 'user', content: userPrompt }],
          });
          return {
            value,
            tokensIn: value.usage?.input_tokens ?? 0,
            tokensOut: value.usage?.output_tokens ?? 0,
          };
        }
      );
      response = wrapped.result;
    } catch (err) {
      throw new ApplicationMaterialsError('LLM call failed', { cause: err });
    }

    const rawText = extractAssistantText(response);
    if (!rawText) throw new ApplicationMaterialsError('Empty LLM response');

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(stripJsonFence(rawText));
    } catch (err) {
      console.error('[application-materials/bullet] JSON parse failure. Raw:', rawText);
      throw new ApplicationMaterialsError('LLM returned non-JSON output', { cause: err });
    }

    const validated = BulletSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.error(
        '[application-materials/bullet] Schema validation failure:',
        validated.error.flatten()
      );
      throw new ApplicationMaterialsError('LLM output failed schema validation', {
        cause: validated.error.flatten(),
      });
    }

    const output: ApplicationMaterialsBulletOutput = {
      mode: 'bullet',
      originalBullet: args.originalBullet,
      rewrittenBullet: validated.data.rewrittenBullet,
      evidence: validated.data.evidence,
      rationale: validated.data.rationale,
    };

    const tokensIn = response.usage?.input_tokens ?? 0;
    const tokensOut = response.usage?.output_tokens ?? 0;

    await supabase.from('agent_messages').insert({
      session_id: sessionId,
      role: 'agent',
      content_json: { ...output, version: APPLICATION_MATERIALS_VERSION },
      tokens_in: tokensIn,
      tokens_out: tokensOut,
    });

    await supabase
      .from('agent_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', userId);

    const payload = {
      originalBullet: args.originalBullet,
      rewrittenBullet: validated.data.rewrittenBullet,
      evidence: validated.data.evidence.slice(0, 800),
    };
    const v = validateActionPayload('rewrite_resume_bullet', payload);
    if (!v.ok) {
      throw new ApplicationMaterialsError(
        `rewrite_resume_bullet payload invalid: ${JSON.stringify(v.error)}`
      );
    }

    const evidenceRefs = [
      {
        kind: 'application_materials_bullet',
        targetRequirement: args.targetRequirement ?? null,
        rationale: output.rationale,
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
          requires_external_send: true,
          evidence_refs_json: evidenceRefs,
        },
      ])
      .select('id');

    if (actionsErr || !insertedActions || insertedActions.length === 0) {
      console.error('[application-materials/bullet] Failed to persist action:', actionsErr);
      throw new ApplicationMaterialsError('Failed to persist drafted action', {
        cause: actionsErr,
      });
    }
    const actionId = insertedActions[0].id as string;

    return { mode: 'bullet', output, actionId, tokensIn, tokensOut };
  }

  // === cover_letter mode ===
  const { prompt: userPrompt } = buildCoverLetterPrompt(
    context,
    args.applicationPrompt ?? null,
    args.paragraphsTarget ?? null
  );

  let response: Anthropic.Messages.Message;
  try {
    const wrapped = await runAgentCall(
      {
        userId,
        sessionId,
        agentKind: 'application_materials',
        model: CLAUDE_MODELS.reasoning,
      },
      async () => {
        const value = await client.messages.create({
          model: CLAUDE_MODELS.reasoning,
          max_tokens: 2500,
          system: [
            {
              type: 'text',
              text: COVER_LETTER_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: userPrompt }],
        });
        return {
          value,
          tokensIn: value.usage?.input_tokens ?? 0,
          tokensOut: value.usage?.output_tokens ?? 0,
        };
      }
    );
    response = wrapped.result;
  } catch (err) {
    throw new ApplicationMaterialsError('LLM call failed', { cause: err });
  }

  const rawText = extractAssistantText(response);
  if (!rawText) throw new ApplicationMaterialsError('Empty LLM response');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(rawText));
  } catch (err) {
    console.error('[application-materials/cover_letter] JSON parse failure. Raw:', rawText);
    throw new ApplicationMaterialsError('LLM returned non-JSON output', { cause: err });
  }

  const validated = CoverLetterSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error(
      '[application-materials/cover_letter] Schema validation failure:',
      validated.error.flatten()
    );
    throw new ApplicationMaterialsError('LLM output failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  const output: ApplicationMaterialsCoverLetterOutput = {
    mode: 'cover_letter',
    subject: validated.data.subject,
    body: validated.data.body,
    rationale: validated.data.rationale,
  };

  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;

  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    content_json: { ...output, version: APPLICATION_MATERIALS_VERSION },
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });

  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  const payload = {
    subject: validated.data.subject,
    body: validated.data.body,
  };
  const v = validateActionPayload('draft_recruiter_reply', payload);
  if (!v.ok) {
    throw new ApplicationMaterialsError(
      `draft_recruiter_reply payload invalid: ${JSON.stringify(v.error)}`
    );
  }

  const evidenceRefs = [
    {
      kind: 'application_materials_cover_letter',
      applicationPrompt: args.applicationPrompt ?? null,
      paragraphsTarget: args.paragraphsTarget ?? null,
      rationale: output.rationale,
    },
  ];

  const { data: insertedActions, error: actionsErr } = await supabase
    .from('agent_actions')
    .insert([
      {
        user_id: userId,
        session_id: sessionId,
        report_id: reportId,
        action_type: 'draft_recruiter_reply',
        payload_json: v.payload,
        status: 'drafted',
        requires_external_send: true,
        evidence_refs_json: evidenceRefs,
      },
    ])
    .select('id');

  if (actionsErr || !insertedActions || insertedActions.length === 0) {
    console.error('[application-materials/cover_letter] Failed to persist action:', actionsErr);
    throw new ApplicationMaterialsError('Failed to persist drafted action', {
      cause: actionsErr,
    });
  }
  const actionId = insertedActions[0].id as string;

  return { mode: 'cover_letter', output, actionId, tokensIn, tokensOut };
}
