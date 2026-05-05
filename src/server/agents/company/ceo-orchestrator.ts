import type { SupabaseClient } from '@supabase/supabase-js';
import type Anthropic from '@anthropic-ai/sdk';
import { loadCompanyMetrics } from './company-metrics';
import { loadDirectorContext } from './director-context';
import {
  streamCompanyAgent,
  type StreamCompanyAgentCallbacks,
  type StreamCompanyAgentResult,
} from './company-agent-runner';
import type { CompanyAgentKind, CompanyAgentTriggeredBy } from './types';

export interface RunCeoOrchestratorArgs {
  userId: string;
  sessionId: string;
  message: string;
  messageContent?: Anthropic.Messages.ContentBlockParam[];
  attachmentIds?: string[];
  requestedAgentKind?: CompanyAgentKind;
  triggeredBy?: CompanyAgentTriggeredBy;
  supabase: SupabaseClient;
  abortSignal?: AbortSignal;
}

export async function runCeoOrchestratorStream(
  args: RunCeoOrchestratorArgs,
  callbacks: StreamCompanyAgentCallbacks
): Promise<StreamCompanyAgentResult> {
  const agentKind: CompanyAgentKind = args.requestedAgentKind ?? 'ceo_orchestrator';

  const [metrics, directorContext] = await Promise.all([
    loadCompanyMetrics({ supabase: args.supabase, userId: args.userId }),
    agentKind === 'ceo_orchestrator'
      ? Promise.resolve(undefined)
      : loadDirectorContext({ supabase: args.supabase, userId: args.userId, kind: agentKind }),
  ]);

  return streamCompanyAgent(
    {
      userId: args.userId,
      sessionId: args.sessionId,
      agentKind,
      message: args.message,
      messageContent: args.messageContent,
      attachmentIds: args.attachmentIds,
      supabase: args.supabase,
      metrics,
      directorContext,
      triggeredBy: args.triggeredBy ?? 'user',
      abortSignal: args.abortSignal,
    },
    callbacks
  );
}
