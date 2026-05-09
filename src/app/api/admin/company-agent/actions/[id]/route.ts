import { NextRequest, NextResponse, after } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/server';
import { assertCompanyActionTransition } from '@/server/agents/company/company-actions';
import { executeAction } from '@/server/agents/company/action-executors';
import { COMPANY_ACTION_STATUSES, publicCompanyAction } from '@/server/agents/company/types';
import type { CompanyAgentActionRow, CompanyActionStatus } from '@/server/agents/company/types';
import { runCeoOrchestratorStream } from '@/server/agents/company/ceo-orchestrator';

const PatchSchema = z.object({
  status: z.enum(COMPANY_ACTION_STATUSES),
  resultJson: z.record(z.string(), z.unknown()).optional(),
  error: z.string().max(1000).optional(),
  feedback: z.string().max(2000).optional(),
});

export const maxDuration = 300;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: existing } = await auth.supabase
      .from('company_agent_actions')
      .select()
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .single();

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const current = existing as CompanyAgentActionRow;
    const nextStatus = parsed.data.status as CompanyActionStatus;
    const transition = assertCompanyActionTransition(current.status, nextStatus);
    if (!transition.ok) {
      return NextResponse.json(
        {
          error: transition.message,
          from: current.status,
          to: nextStatus,
          allowed: transition.allowed,
        },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();
    const update: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === 'approved') update.approved_at = nowIso;
    if (nextStatus === 'completed' || nextStatus === 'failed') {
      update.completed_at = nowIso;
      if (parsed.data.resultJson !== undefined) update.result_json = parsed.data.resultJson;
      if (parsed.data.error !== undefined) update.error = parsed.data.error;
    }
    const rejectionFeedback =
      nextStatus === 'rejected' && parsed.data.feedback?.trim()
        ? parsed.data.feedback.trim()
        : null;
    if (nextStatus === 'rejected') {
      update.completed_at = nowIso;
      const existingResult =
        (current.result_json as Record<string, unknown> | null | undefined) ?? {};
      update.result_json = {
        ...existingResult,
        rejected_at: nowIso,
        ...(rejectionFeedback ? { rejection_feedback: rejectionFeedback } : {}),
      };
    }

    const { data: updated, error } = await auth.supabase
      .from('company_agent_actions')
      .update(update)
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
    }

    let finalRow = updated as CompanyAgentActionRow;

    if (nextStatus === 'approved') {
      const result = await executeAction(finalRow, auth.supabase);
      const followUp: Record<string, unknown> = {
        status: result.status,
        completed_at: new Date().toISOString(),
      };
      if (result.resultJson !== undefined) followUp.result_json = result.resultJson;
      if (result.error !== undefined) followUp.error = result.error;

      const { data: executedRow, error: executionUpdateError } = await auth.supabase
        .from('company_agent_actions')
        .update(followUp)
        .eq('id', id)
        .eq('user_id', auth.user.id)
        .select()
        .single();

      if (!executionUpdateError && executedRow) {
        finalRow = executedRow as CompanyAgentActionRow;
      }
    }

    if (
      nextStatus === 'rejected' &&
      rejectionFeedback &&
      finalRow.session_id
    ) {
      const sessionId = finalRow.session_id;
      const userId = auth.user.id;
      const followupMessage = [
        `I'm rejecting your proposed action: "${finalRow.title}".`,
        '',
        "Here's what I want done differently:",
        rejectionFeedback,
        '',
        'Please draft a new version of this action that addresses my feedback.',
      ].join('\n');

      after(async () => {
        try {
          const service = await createServiceClient();
          await runCeoOrchestratorStream(
            {
              userId,
              sessionId,
              message: followupMessage,
              requestedAgentKind: finalRow.agent_kind,
              triggeredBy: 'user',
              supabase: service,
            },
            {}
          );
        } catch (err) {
          console.error(
            '[PATCH /actions/:id] follow-up redraft failed for session',
            sessionId,
            err
          );
        }
      });
    }

    return NextResponse.json({
      data: publicCompanyAction(finalRow),
    });
  } catch (err) {
    console.error('PATCH /api/admin/company-agent/actions/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
