import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/admin';
import { assertCompanyActionTransition } from '@/server/agents/company/company-actions';
import { executeAction } from '@/server/agents/company/action-executors';
import { COMPANY_ACTION_STATUSES, publicCompanyAction } from '@/server/agents/company/types';
import type { CompanyAgentActionRow, CompanyActionStatus } from '@/server/agents/company/types';

const PatchSchema = z.object({
  status: z.enum(COMPANY_ACTION_STATUSES),
  resultJson: z.record(z.string(), z.unknown()).optional(),
  error: z.string().max(1000).optional(),
});

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

    return NextResponse.json({
      data: publicCompanyAction(finalRow),
    });
  } catch (err) {
    console.error('PATCH /api/admin/company-agent/actions/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
