import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { generateBestAnswer } from '@/server/questions';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export const maxDuration = 30;

const RequestSchema = z.object({
  questionIndex: z.number(),
  questionText: z.string().min(1),
  why: z.string().min(1),
});

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
      prefix: 'bestanswer',
      identifier: `user:${user.id}`,
      maxRequests: 20,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: report } = await supabase
      .from('reports')
      .select('id, round_type, user_id, paid_unlocked')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!report.paid_unlocked) {
      return NextResponse.json(
        { error: 'Report must be unlocked to access this feature' },
        { status: 403 }
      );
    }

    const { data: runs } = await supabase
      .from('runs')
      .select('extracted_resume_json, extracted_jd_json')
      .eq('report_id', reportId)
      .order('run_index', { ascending: false })
      .limit(1);

    const latestRun = runs?.[0];
    if (!latestRun) {
      return NextResponse.json({ error: 'No analysis found' }, { status: 404 });
    }

    const bestAnswer = await generateBestAnswer(
      parsed.data.questionText,
      parsed.data.why,
      latestRun.extracted_resume_json,
      latestRun.extracted_jd_json,
      report.round_type
    );

    return NextResponse.json({ data: bestAnswer });
  } catch (error) {
    console.error('Best answer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
