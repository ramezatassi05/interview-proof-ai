/**
 * GET /api/opportunities/[id] — fetch a single opportunity.
 * PATCH /api/opportunities/[id] — partial update.
 * DELETE /api/opportunities/[id] — soft-delete (sets archived=true).
 *
 * All routes scope by user_id (RLS also enforces this). Cross-user access
 * returns 404, never 403.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { OPPORTUNITY_STAGES, rowToOpportunity, type OpportunityRow } from '@/lib/opportunities';

const StageEnum = z.enum(OPPORTUNITY_STAGES as unknown as [string, ...string[]]);

const PatchSchema = z
  .object({
    companyName: z.string().min(1).max(200).optional(),
    roleTitle: z.string().min(1).max(200).optional(),
    stage: StageEnum.optional(),
    interviewDate: z.string().datetime().nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'opportunities:read',
      identifier: `user:${user.id}`,
      maxRequests: 240,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(60);

    const { data: row } = await supabase
      .from('opportunities')
      .select()
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: rowToOpportunity(row as OpportunityRow) });
  } catch (err) {
    console.error('GET /api/opportunities/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'opportunities:write',
      identifier: `user:${user.id}`,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(60);

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

    const { data: existing } = await supabase
      .from('opportunities')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (parsed.data.companyName !== undefined) update.company_name = parsed.data.companyName;
    if (parsed.data.roleTitle !== undefined) update.role_title = parsed.data.roleTitle;
    if (parsed.data.stage !== undefined) update.stage = parsed.data.stage;
    if (parsed.data.interviewDate !== undefined) update.interview_date = parsed.data.interviewDate;
    if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;
    if (parsed.data.archived !== undefined) update.archived = parsed.data.archived;

    const { data: row, error } = await supabase
      .from('opportunities')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !row) {
      console.error('PATCH /api/opportunities/[id] error:', error);
      return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 });
    }

    return NextResponse.json({ data: rowToOpportunity(row as OpportunityRow) });
  } catch (err) {
    console.error('PATCH /api/opportunities/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'opportunities:write',
      identifier: `user:${user.id}`,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(60);

    const { data: existing } = await supabase
      .from('opportunities')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Soft delete via archived=true.
    const { data: row, error } = await supabase
      .from('opportunities')
      .update({ archived: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !row) {
      console.error('DELETE /api/opportunities/[id] error:', error);
      return NextResponse.json({ error: 'Failed to archive opportunity' }, { status: 500 });
    }

    return NextResponse.json({ data: rowToOpportunity(row as OpportunityRow) });
  } catch (err) {
    console.error('DELETE /api/opportunities/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
