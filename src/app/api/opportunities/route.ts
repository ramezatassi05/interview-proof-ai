/**
 * GET /api/opportunities — list opportunities for the authenticated user.
 *   Query params: ?stage=<OpportunityStage>&archived=true|false
 * POST /api/opportunities — create a new opportunity.
 *
 * Auth: Supabase user. RLS enforces per-user scoping.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { OPPORTUNITY_STAGES, rowToOpportunity, type OpportunityRow } from '@/lib/opportunities';

const StageEnum = z.enum(OPPORTUNITY_STAGES as unknown as [string, ...string[]]);

const CreateSchema = z.object({
  companyName: z.string().min(1).max(200),
  roleTitle: z.string().min(1).max(200),
  stage: StageEnum.optional(),
  interviewDate: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
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

    const url = new URL(request.url);
    const stageParam = url.searchParams.get('stage');
    const archivedParam = url.searchParams.get('archived');

    let query = supabase
      .from('opportunities')
      .select()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (stageParam) {
      const parsed = StageEnum.safeParse(stageParam);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
      }
      query = query.eq('stage', parsed.data);
    }

    if (archivedParam !== null) {
      const archivedBool = archivedParam === 'true';
      query = query.eq('archived', archivedBool);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error('GET /api/opportunities error:', error);
      return NextResponse.json({ error: 'Failed to load opportunities' }, { status: 500 });
    }

    return NextResponse.json({
      data: ((rows ?? []) as OpportunityRow[]).map(rowToOpportunity),
    });
  } catch (err) {
    console.error('GET /api/opportunities error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const insert = {
      user_id: user.id,
      company_name: parsed.data.companyName,
      role_title: parsed.data.roleTitle,
      stage: parsed.data.stage ?? 'applied',
      interview_date: parsed.data.interviewDate ?? null,
      notes: parsed.data.notes ?? null,
    };

    const { data: row, error } = await supabase
      .from('opportunities')
      .insert(insert)
      .select()
      .single();
    if (error || !row) {
      console.error('POST /api/opportunities error:', error);
      return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
    }

    return NextResponse.json({ data: rowToOpportunity(row as OpportunityRow) });
  } catch (err) {
    console.error('POST /api/opportunities error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
