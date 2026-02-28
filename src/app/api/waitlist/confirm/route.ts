import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getResendClient, EMAIL_FROM } from '@/lib/resend';
import { getWaitlistTier } from '@/lib/waitlist';
import { getWelcomeEmailHtml, getWelcomeEmailSubject } from '@/lib/waitlist-emails';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!token) {
      return NextResponse.redirect(
        `${appUrl}/waitlist/confirm?status=error&message=invalid-token`
      );
    }

    const supabase = await createServiceClient();

    // Look up entry by confirmation token
    const { data: entry, error } = await supabase
      .from('waitlist')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (error || !entry) {
      return NextResponse.redirect(
        `${appUrl}/waitlist/confirm?status=error&message=invalid-token`
      );
    }

    // Already confirmed — redirect with existing data
    if (entry.status === 'confirmed') {
      return NextResponse.redirect(
        `${appUrl}/waitlist/confirm?status=confirmed&position=${entry.position}&code=${entry.referral_code}`
      );
    }

    // Assign next position
    const { data: positionData } = await supabase.rpc('get_next_waitlist_position');
    const position = positionData ?? 1;

    // Update entry to confirmed
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        position,
      })
      .eq('id', entry.id);

    if (updateError) {
      console.error('Waitlist confirm update error:', updateError);
      return NextResponse.redirect(
        `${appUrl}/waitlist/confirm?status=error&message=server-error`
      );
    }

    // If referred, increment referrer's count and boost their position
    if (entry.referred_by) {
      // Increment referral count
      await supabase.rpc('increment_referral_count', { code: entry.referred_by });

      // Boost referrer's position by 3 (lower number = better)
      const { data: referrer } = await supabase
        .from('waitlist')
        .select('id, position')
        .eq('referral_code', entry.referred_by)
        .eq('status', 'confirmed')
        .single();

      if (referrer?.position && referrer.position > 3) {
        await supabase
          .from('waitlist')
          .update({ position: referrer.position - 3 })
          .eq('id', referrer.id);
      }
    }

    // Send welcome email (non-blocking — confirmation already succeeded)
    const tier = getWaitlistTier(position);
    const referralUrl = `${appUrl}?ref=${entry.referral_code}`;

    const resend = getResendClient();
    const { error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: entry.email,
      subject: getWelcomeEmailSubject(),
      html: getWelcomeEmailHtml(position, referralUrl, tier),
    });

    if (emailError) {
      console.error('Waitlist welcome email error:', emailError);
      // Don't fail the redirect — confirmation already succeeded
    }

    return NextResponse.redirect(
      `${appUrl}/waitlist/confirm?status=confirmed&position=${position}&code=${entry.referral_code}`
    );
  } catch (err) {
    console.error('Waitlist confirm error:', err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${appUrl}/waitlist/confirm?status=error&message=server-error`
    );
  }
}
