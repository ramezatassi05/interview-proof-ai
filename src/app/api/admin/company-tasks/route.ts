import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/admin';
import {
  COMPANY_TASK_STATUSES,
  publicCompanyTask,
  type CompanyTaskRow,
} from '@/server/agents/company/types';

export async function GET() {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const { data, error } = await auth.supabase
      .from('company_tasks')
      .select()
      .eq('user_id', auth.user.id)
      .neq('status', 'canceled')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('GET /api/admin/company-tasks error:', error);
      return NextResponse.json({ error: 'Could not load tasks' }, { status: 500 });
    }

    const tasks = (data ?? []).map((row) => publicCompanyTask(row as CompanyTaskRow));
    return NextResponse.json({ data: tasks });
  } catch (err) {
    console.error('GET /api/admin/company-tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const PatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(COMPANY_TASK_STATUSES).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from('company_tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('PATCH /api/admin/company-tasks error:', error);
      return NextResponse.json({ error: 'Could not update task' }, { status: 500 });
    }

    return NextResponse.json({ data: publicCompanyTask(data as CompanyTaskRow) });
  } catch (err) {
    console.error('PATCH /api/admin/company-tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
