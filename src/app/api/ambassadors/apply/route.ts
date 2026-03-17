import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const applySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  university: z.string().min(1, 'University is required.'),
  gradYear: z.string().min(4, 'Graduation year is required.'),
  linkedin: z.string().optional(),
  whyInterested: z.string().min(10, 'Please tell us why you\'re interested.'),
});

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const allowed = await checkRateLimit({
      prefix: 'ambassador',
      identifier: `ip:${ip}`,
      maxRequests: 3,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const body = await req.json();
    const parsed = applySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input.' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Send via Resend to admin email
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'InterviewProof <noreply@interviewproof.ai>',
          to: ['team@interviewproof.ai'],
          subject: `Ambassador Application: ${data.name} (${data.university})`,
          text: [
            `Name: ${data.name}`,
            `Email: ${data.email}`,
            `University: ${data.university}`,
            `Graduation Year: ${data.gradYear}`,
            `LinkedIn: ${data.linkedin || 'Not provided'}`,
            `Why interested: ${data.whyInterested}`,
          ].join('\n'),
        });
      }
    } catch (emailErr) {
      // Log but don't fail — application is still recorded
      console.error('Ambassador email send error:', emailErr);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
