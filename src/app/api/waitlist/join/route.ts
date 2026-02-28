import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { getResendClient, EMAIL_FROM } from '@/lib/resend';
import {
  generateReferralCode,
  isRateLimited,
  recordRateLimitAttempt,
  isDisposableEmail,
} from '@/lib/waitlist';
import {
  getConfirmationEmailHtml,
  getConfirmationEmailSubject,
} from '@/lib/waitlist-emails';

const joinSchema = z.object({
  email: z.string().email(),
  honeypot: z.string().optional().default(''),
  formLoadedAt: z.number(),
  referralCode: z.string().optional(),
});

// Silent fake success response (for bots)
const FAKE_SUCCESS = NextResponse.json(
  { data: { message: 'Check your email to confirm your spot.' } },
  { status: 200 }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = joinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    const { email, honeypot, formLoadedAt, referralCode } = parsed.data;

    // Anti-spam: honeypot check
    if (honeypot) {
      return FAKE_SUCCESS;
    }

    // Anti-spam: timing check (< 2 seconds = bot)
    const elapsed = Date.now() - formLoadedAt;
    if (elapsed < 2000) {
      return FAKE_SUCCESS;
    }

    // Anti-spam: disposable email check
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: 'Please use a non-temporary email address.' },
        { status: 400 }
      );
    }

    // Get IP for rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    const supabase = await createServiceClient();

    // Anti-spam: IP rate limiting
    const rateLimited = await isRateLimited(supabase, ip);
    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Record rate limit attempt
    await recordRateLimitAttempt(supabase, ip);

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id, status, confirmation_token')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      if (existing.status === 'confirmed') {
        return NextResponse.json(
          { data: { message: 'You\'re already on the waitlist!', alreadyJoined: true } },
          { status: 200 }
        );
      }

      // Resend confirmation email for pending entries
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const confirmUrl = `${appUrl}/api/waitlist/confirm?token=${existing.confirmation_token}`;

      const resend = getResendClient();
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email.toLowerCase(),
        subject: getConfirmationEmailSubject(),
        html: getConfirmationEmailHtml(confirmUrl),
      });

      return NextResponse.json(
        { data: { message: 'Check your email to confirm your spot.' } },
        { status: 200 }
      );
    }

    // Insert new waitlist entry
    const newReferralCode = generateReferralCode();
    const { data: entry, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase(),
        referral_code: newReferralCode,
        referred_by: referralCode || null,
        ip_address: ip,
        user_agent: headersList.get('user-agent') || null,
      })
      .select('confirmation_token')
      .single();

    if (insertError) {
      console.error('Waitlist insert error:', insertError);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    // Send confirmation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const confirmUrl = `${appUrl}/api/waitlist/confirm?token=${entry.confirmation_token}`;

    const resend = getResendClient();
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email.toLowerCase(),
      subject: getConfirmationEmailSubject(),
      html: getConfirmationEmailHtml(confirmUrl),
    });

    return NextResponse.json(
      { data: { message: 'Check your email to confirm your spot.' } },
      { status: 200 }
    );
  } catch (err) {
    console.error('Waitlist join error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
