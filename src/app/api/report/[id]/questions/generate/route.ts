import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { generateMoreQuestions } from '@/server/questions';

export const maxDuration = 30;

const RequestSchema = z.object({
  existingQuestions: z.array(z.string()),
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
      .select('id, round_type, user_id')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const { data: runs } = await supabase
      .from('runs')
      .select('id, extracted_resume_json, extracted_jd_json, llm_analysis_json')
      .eq('report_id', reportId)
      .order('run_index', { ascending: false })
      .limit(1);

    const latestRun = runs?.[0];
    if (!latestRun) {
      return NextResponse.json({ error: 'No analysis found' }, { status: 404 });
    }

    const newQuestions = await generateMoreQuestions(
      latestRun.extracted_resume_json,
      latestRun.extracted_jd_json,
      report.round_type,
      parsed.data.existingQuestions
    );

    // Append new questions to the run's llm_analysis_json
    const updatedAnalysis = {
      ...latestRun.llm_analysis_json,
      interviewQuestions: [...latestRun.llm_analysis_json.interviewQuestions, ...newQuestions],
    };

    await supabase
      .from('runs')
      .update({ llm_analysis_json: updatedAnalysis })
      .eq('id', latestRun.id);

    return NextResponse.json({ data: { questions: newQuestions } });
  } catch (error) {
    console.error('Generate questions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
