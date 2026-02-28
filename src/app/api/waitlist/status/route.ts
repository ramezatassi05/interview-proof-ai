import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getWaitlistTier } from '@/lib/waitlist';
import type { WaitlistStatusResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    const code = request.nextUrl.searchParams.get('code');

    if (!email && !code) {
      return NextResponse.json(
        { error: 'Provide an email or referral code.' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Look up entry
    let query = supabase
      .from('waitlist')
      .select('status, position, referral_code, referral_count');

    if (email) {
      query = query.eq('email', email.toLowerCase());
    } else if (code) {
      query = query.eq('referral_code', code);
    }

    const { data: entry, error } = await query.single();

    if (error || !entry) {
      return NextResponse.json(
        { error: 'Entry not found.' },
        { status: 404 }
      );
    }

    // Get total count
    const { data: totalCount } = await supabase.rpc('get_waitlist_count');

    const response: WaitlistStatusResponse = {
      status: entry.status,
      position: entry.position,
      totalCount: totalCount ?? 0,
      referralCode: entry.referral_code,
      referralCount: entry.referral_count,
      tier: entry.position ? getWaitlistTier(entry.position) : null,
    };

    return NextResponse.json({ data: response });
  } catch (err) {
    console.error('Waitlist status error:', err);
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
