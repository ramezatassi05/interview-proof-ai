import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateReferralCode, GRANT_AMOUNTS } from '@/lib/credits';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const referralCode = generateReferralCode(user.id);

    // Count referral grants for this user (as referrer)
    // These have stripe_event_id like 'grant:referral:{userId}:%'
    const { data: referralEntries } = await supabase
      .from('credits_ledger')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'grant')
      .like('stripe_event_id', `grant:referral:${user.id}:%`);

    const totalReferrals = referralEntries?.length ?? 0;
    const totalEarned = referralEntries?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

    return NextResponse.json({
      data: {
        referralCode,
        totalReferrals,
        totalEarned,
        bonusPerReferral: GRANT_AMOUNTS.REFERRAL_BONUS,
      },
    });
  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
