/**
 * /api/report/[id]/prep-plan-tasks
 *
 * Server-backed completion tracking for the LLM-analysis study plan +
 * personalized day-by-day plan. Replaces the legacy
 * `localStorage[interviewproof-completed-tasks-{reportId}]` and
 * `localStorage[interviewproof-timeline-{reportId}]` write paths (M4).
 *
 *  - POST    : sync the candidate's client task list to prep_plan_tasks and
 *              return the current snapshot (status by client_task_id, plus
 *              the client-id → prep_plan_tasks.id mapping needed for PATCH).
 *  - PATCH   : flip the status of a single prep_plan_tasks row.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { syncStudyPlanForReport } from '@/lib/prep-plan-tasks';

const SyncSchema = z.object({
  clientTasks: z
    .array(
      z.object({
        id: z.string().min(1).max(120),
        title: z.string().min(1).max(1000),
        description: z.string().max(4000).nullable().optional(),
        category: z.string().max(40).nullable().optional(),
        dayOffset: z.number().int().min(0).max(365).nullable().optional(),
        estimatedMinutes: z.number().int().min(0).max(2000).nullable().optional(),
      })
    )
    .max(200),
});

const PatchSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'done', 'skipped']),
});

async function verifyReportOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reportId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reportId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'prep_plan_tasks_sync',
      identifier: `user:${user.id}`,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const owns = await verifyReportOwnership(supabase, reportId, user.id);
    if (!owns) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = SyncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let result;
    try {
      result = await syncStudyPlanForReport(supabase, user.id, reportId, parsed.data.clientTasks);
    } catch (err) {
      console.error('[prep-plan-tasks] sync error:', err);
      return NextResponse.json({ error: 'Failed to sync tasks' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        planId: result.planId,
        clientIdToTaskId: result.clientIdToTaskId,
        completedClientTaskIds: result.completedClientTaskIds,
      },
    });
  } catch (err) {
    console.error('POST /api/report/[id]/prep-plan-tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reportId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'prep_plan_tasks_write',
      identifier: `user:${user.id}`,
      maxRequests: 240,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const owns = await verifyReportOwnership(supabase, reportId, user.id);
    if (!owns) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { taskId, status } = parsed.data;

    // Verify ownership: task must belong to a prep_plan owned by this user.
    // RLS enforces this on the UPDATE, but we explicit-check to return 404
    // (instead of a no-op success) when the row is not theirs.
    const { data: taskRow } = await supabase
      .from('prep_plan_tasks')
      .select('id, prep_plan_id')
      .eq('id', taskId)
      .single();
    if (!taskRow) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    const { data: planRow } = await supabase
      .from('prep_plans')
      .select('id')
      .eq('id', (taskRow as { prep_plan_id: string }).prep_plan_id)
      .eq('user_id', user.id)
      .single();
    if (!planRow) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('prep_plan_tasks')
      .update({ status })
      .eq('id', taskId)
      .select('id, status')
      .single();
    if (updateErr || !updated) {
      console.error('prep_plan_tasks PATCH error:', updateErr);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        taskId: (updated as { id: string }).id,
        status: (updated as { status: string }).status,
      },
    });
  } catch (err) {
    console.error('PATCH /api/report/[id]/prep-plan-tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
