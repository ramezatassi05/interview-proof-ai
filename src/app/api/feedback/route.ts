import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyFeedbackToken } from '@/lib/feedback-emails';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';

const FeedbackSchema = z.object({
  reportId: z.string().uuid(),
  token: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  mostUseful: z.string().max(500).optional(),
  improvement: z.string().max(500).optional(),
  wouldRecommend: z.enum(['yes', 'no', 'maybe']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const allowed = await checkRateLimit({
      prefix: 'feedback',
      identifier: `ip:${ip}`,
      maxRequests: 10,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const body = await request.json();
    const parsed = FeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { reportId, token, rating, mostUseful, improvement, wouldRecommend } = parsed.data;

    const supabase = await createServiceClient();

    // Look up the report to get user_id
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('user_id')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify HMAC token
    if (!verifyFeedbackToken(reportId, report.user_id, token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    // Check for existing feedback
    const { data: existing } = await supabase
      .from('feedback_responses')
      .select('id')
      .eq('report_id', reportId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Feedback already submitted for this report' }, { status: 409 });
    }

    // Insert feedback
    const { error: insertError } = await supabase.from('feedback_responses').insert({
      report_id: reportId,
      user_id: report.user_id,
      rating,
      most_useful: mostUseful || null,
      improvement: improvement || null,
      would_recommend: wouldRecommend || null,
    });

    if (insertError) {
      console.error('Feedback insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    auditLog({
      action: 'feedback.submitted',
      userId: report.user_id,
      resourceId: reportId,
      metadata: { rating, wouldRecommend },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
