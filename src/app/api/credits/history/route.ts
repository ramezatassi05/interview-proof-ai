import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get total count
    const { count } = await supabase
      .from('credits_ledger')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get paginated entries
    const { data: entries, error: queryError } = await supabase
      .from('credits_ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) {
      console.error('Failed to fetch credit history:', queryError);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // Map snake_case → camelCase
    const mapped = (entries || []).map((e) => ({
      id: e.id,
      userId: e.user_id,
      type: e.type,
      amount: e.amount,
      stripeEventId: e.stripe_event_id,
      createdAt: e.created_at,
    }));

    return NextResponse.json({
      data: {
        entries: mapped,
        totalCount: count ?? 0,
      },
    });
  } catch (error) {
    console.error('Credit history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
