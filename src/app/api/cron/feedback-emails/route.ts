import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getResendClient, EMAIL_FROM } from '@/lib/resend';
import {
  getFeedbackEmailHtml,
  getFeedbackEmailSubject,
  generateFeedbackToken,
} from '@/lib/feedback-emails';
import { auditLog } from '@/lib/audit';
import { verifyCronSecret } from '@/lib/security';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request.headers.get('authorization'));
  if (unauthorized) return unauthorized;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL not configured' }, { status: 500 });
  }

  const supabase = await createServiceClient();
  const resend = getResendClient();

  // Find completed runs from the last 25 hours (daily cron with buffer)
  // Once upgraded to Pro, switch to hourly cron with 1-3 hour window:
  //   schedule: "0 * * * *"
  //   const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  //   const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  //   .gte('created_at', threeHoursAgo).lte('created_at', oneHourAgo)
  const now = new Date();
  const lookbackStart = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();

  const { data: pendingReports, error: queryError } = await supabase
    .from('runs')
    .select('report_id, reports!inner(id, user_id, feedback_email_sent_at)')
    .eq('status', 'complete')
    .gte('created_at', lookbackStart)
    .is('reports.feedback_email_sent_at', null)
    .limit(50);

  if (queryError) {
    console.error('Feedback cron query error:', queryError);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  if (!pendingReports || pendingReports.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, errors: 0 });
  }

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const run of pendingReports) {
    const report = run.reports as unknown as {
      id: string;
      user_id: string;
      feedback_email_sent_at: string | null;
    };

    try {
      // Get user email
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.admin.getUserById(report.user_id);

      if (userError || !user?.email) {
        skipped++;
        continue;
      }

      const token = generateFeedbackToken(report.id, report.user_id);

      const { error: sendError } = await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: getFeedbackEmailSubject(),
        html: getFeedbackEmailHtml(report.id, token, baseUrl),
        headers: {
          'X-Entity-Ref-ID': `feedback:${report.id}`,
        },
      });

      if (sendError) {
        console.error(`Failed to send feedback email for report ${report.id}:`, sendError);
        errors++;
        continue;
      }

      // Mark as sent
      const { error: updateError } = await supabase
        .from('reports')
        .update({ feedback_email_sent_at: new Date().toISOString() })
        .eq('id', report.id);

      if (updateError) {
        console.error(`Failed to update feedback_email_sent_at for report ${report.id}:`, updateError);
        errors++;
        continue;
      }

      auditLog({
        action: 'feedback.email_sent',
        userId: report.user_id,
        resourceId: report.id,
      });

      sent++;
    } catch (err) {
      console.error(`Feedback email error for report ${report.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ sent, skipped, errors });
}
