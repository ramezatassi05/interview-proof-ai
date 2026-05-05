import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/admin';

const PostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  decisionText: z.string().trim().min(1).max(2000),
  rationale: z.string().trim().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from('company_decisions')
      .insert({
        user_id: auth.user.id,
        title: parsed.data.title,
        decision_text: parsed.data.decisionText,
        rationale: parsed.data.rationale ?? null,
      })
      .select('id, title, decision_text, rationale, decided_at')
      .single();

    if (error || !data) {
      console.error('POST /api/admin/company-decisions insert error:', error);
      return NextResponse.json({ error: 'Could not record decision' }, { status: 500 });
    }

    const row = data as {
      id: string;
      title: string;
      decision_text: string;
      rationale: string | null;
      decided_at: string;
    };

    return NextResponse.json({
      data: {
        id: row.id,
        title: row.title,
        decisionText: row.decision_text,
        rationale: row.rationale,
        decidedAt: row.decided_at,
      },
    });
  } catch (err) {
    console.error('POST /api/admin/company-decisions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
