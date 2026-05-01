/**
 * runCompanyResearch — M7.6 entrypoint.
 *
 * Produces a structured, interview-ready company brief for the candidate.
 * Cache-first: reads `company_research_cache` by normalized name and returns
 * the cached payload if present and unexpired. On a miss, calls Sonnet 4.6,
 * Zod-validates the JSON output, writes the cache via service role, persists
 * an agent message, and drafts a `create_company_brief` action for the user.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { actionRequiresExternalSend } from '@/lib/agent/types';
import { validateActionPayload } from '@/lib/agent/actions';
import { runAgentCall } from '@/lib/agent/audit';
import {
  readCompanyCache,
  writeCompanyCache,
  type CompanyResearchPayload,
  type CompanyResearchSource,
} from '@/lib/agent/company-cache';
import type { CompanyResearchOutput } from '@/types';
import { loadAgentContext, type AgentContextBundle } from './context-loader';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts/company-research';

export const COMPANY_RESEARCH_VERSION = 'v1.0.0';
const CACHE_TTL_DAYS = 30;

const SourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().max(500).optional(),
  snippet: z.string().max(500).optional(),
});

const CompanyResearchSchema = z.object({
  summary: z.string().min(1).max(2000),
  mission: z.string().max(1000).default(''),
  recentNews: z.array(z.string().max(500)).max(20).default([]),
  productAreas: z.array(z.string().max(200)).max(20).default([]),
  hiringSignals: z.array(z.string().max(500)).max(15).default([]),
  cultureSignals: z.array(z.string().max(500)).max(15).default([]),
  interviewerHints: z.array(z.string().max(500)).max(15).default([]),
  sources: z.array(SourceSchema).max(15).default([]),
});

export class CompanyResearchError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'CompanyResearchError';
    this.cause = options?.cause;
  }
}

export interface RunCompanyResearchArgs {
  userId: string;
  sessionId: string;
  supabase: SupabaseClient;
  companyName: string;
  roleTitle?: string;
  reportId?: string;
}

export interface RunCompanyResearchResult {
  output: CompanyResearchOutput;
  cacheHit: boolean;
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

export async function runCompanyResearch(
  args: RunCompanyResearchArgs
): Promise<RunCompanyResearchResult> {
  const { userId, sessionId, supabase, companyName, roleTitle, reportId } = args;

  if (!companyName.trim()) {
    throw new CompanyResearchError('companyName is required');
  }

  let context: AgentContextBundle | null = null;
  if (reportId) {
    context = await loadAgentContext({ userId, reportId, supabase });
  }
  const resolvedRole = roleTitle ?? context?.report.roleTitle ?? null;

  // 1) Cache hit?
  const cached = await readCompanyCache(supabase, companyName);
  if (cached) {
    const output: CompanyResearchOutput = {
      ...cached.research,
      sources: cached.sources ?? cached.research.sources,
      cacheHit: true,
      cachedAt: cached.createdAt,
      expiresAt: cached.expiresAt,
    };

    const { error: cacheMsgErr } = await supabase.from('agent_messages').insert({
      session_id: sessionId,
      role: 'agent',
      content_json: { ...output, version: COMPANY_RESEARCH_VERSION },
      tokens_in: 0,
      tokens_out: 0,
    });
    if (cacheMsgErr) {
      console.error('[company-research] Failed to persist cache-hit message:', cacheMsgErr);
    }

    await supabase
      .from('agent_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', userId);

    const actionId = await draftBriefAction(
      supabase,
      userId,
      sessionId,
      reportId ?? null,
      companyName,
      resolvedRole
    );

    return { output, cacheHit: true, actionId, tokensIn: 0, tokensOut: 0 };
  }

  // 2) Cache miss — call LLM
  const { prompt: userPrompt } = buildUserPrompt(companyName, resolvedRole, context);

  const client = getAnthropicClient();
  let response: Anthropic.Messages.Message;
  try {
    const wrapped = await runAgentCall(
      {
        userId,
        sessionId,
        agentKind: 'company_research',
        model: CLAUDE_MODELS.reasoning,
      },
      async () => {
        const value = await client.messages.create({
          model: CLAUDE_MODELS.reasoning,
          max_tokens: 2500,
          system: [
            {
              type: 'text',
              text: SYSTEM_PROMPT,
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
    throw new CompanyResearchError('LLM call failed', { cause: err });
  }

  const rawText = extractAssistantText(response);
  if (!rawText) throw new CompanyResearchError('Empty LLM response');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(rawText));
  } catch (err) {
    console.error('[company-research] JSON parse failure. Raw:', rawText);
    throw new CompanyResearchError('LLM returned non-JSON output', { cause: err });
  }

  const validated = CompanyResearchSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error('[company-research] Schema validation failure:', validated.error.flatten());
    throw new CompanyResearchError('LLM output failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  const research: CompanyResearchPayload = {
    summary: validated.data.summary,
    mission: validated.data.mission,
    recentNews: validated.data.recentNews,
    productAreas: validated.data.productAreas,
    hiringSignals: validated.data.hiringSignals,
    cultureSignals: validated.data.cultureSignals,
    interviewerHints: validated.data.interviewerHints,
    sources: validated.data.sources as CompanyResearchSource[],
  };

  // 3) Write cache (best-effort)
  await writeCompanyCache(companyName, research, research.sources, CACHE_TTL_DAYS);

  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;

  const expiresAt = new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const output: CompanyResearchOutput = {
    ...research,
    cacheHit: false,
    cachedAt: new Date().toISOString(),
    expiresAt,
  };

  // 4) Persist agent message
  const { error: agentMsgErr } = await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    content_json: { ...output, version: COMPANY_RESEARCH_VERSION },
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });
  if (agentMsgErr) {
    console.error('[company-research] Failed to persist agent message:', agentMsgErr);
  }

  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  // 5) Draft create_company_brief action
  const actionId = await draftBriefAction(
    supabase,
    userId,
    sessionId,
    reportId ?? null,
    companyName,
    resolvedRole
  );

  return { output, cacheHit: false, actionId, tokensIn, tokensOut };
}

async function draftBriefAction(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  reportId: string | null,
  companyName: string,
  roleTitle: string | null
): Promise<string | null> {
  const payload: { companyName: string; roleTitle?: string } = { companyName };
  if (roleTitle) payload.roleTitle = roleTitle;

  const v = validateActionPayload('create_company_brief', payload);
  if (!v.ok) {
    throw new CompanyResearchError(
      `create_company_brief payload invalid: ${JSON.stringify(v.error)}`
    );
  }

  const { data: insertedActions, error: actionsErr } = await supabase
    .from('agent_actions')
    .insert([
      {
        user_id: userId,
        session_id: sessionId,
        report_id: reportId,
        action_type: 'create_company_brief',
        payload_json: v.payload,
        status: 'drafted',
        requires_external_send: actionRequiresExternalSend('create_company_brief'),
      },
    ])
    .select('id');

  if (actionsErr || !insertedActions || insertedActions.length === 0) {
    console.error('[company-research] Failed to persist action:', actionsErr);
    throw new CompanyResearchError('Failed to persist drafted action', { cause: actionsErr });
  }

  return insertedActions[0].id as string;
}
