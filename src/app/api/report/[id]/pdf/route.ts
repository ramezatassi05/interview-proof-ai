import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { DiagnosticPDF } from '@/server/pdf/template';
import type { RiskItem, LLMAnalysis, ScoreBreakdown, RiskBand, RoundType } from '@/types';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reportId } = await params;

    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if report is unlocked
    if (!report.paid_unlocked) {
      return NextResponse.json(
        { error: 'Report must be unlocked to download PDF' },
        { status: 403 }
      );
    }

    // Fetch the latest run
    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('*')
      .eq('report_id', reportId)
      .order('run_index', { ascending: false })
      .limit(1)
      .single();

    if (runError || !run) {
      return NextResponse.json({ error: 'No analysis found for this report' }, { status: 404 });
    }

    // Extract data from run
    const llmAnalysis = run.llm_analysis_json as LLMAnalysis;
    const scoreBreakdown = run.score_breakdown_json as ScoreBreakdown;
    const risks = run.ranked_risks_json as RiskItem[];

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      DiagnosticPDF({
        reportId,
        roundType: report.round_type as RoundType,
        readinessScore: run.readiness_score,
        riskBand: run.risk_band as RiskBand,
        risks,
        interviewQuestions: llmAnalysis.interviewQuestions || [],
        studyPlan: llmAnalysis.studyPlan || [],
        scoreBreakdown,
        generatedAt: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      })
    );

    // Return PDF - convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="interviewproof-diagnostic-${reportId.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
