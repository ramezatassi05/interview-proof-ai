import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// In-memory cache with 5-minute TTL
let cachedCount: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();
    if (cachedCount !== null && now - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json({ data: { count: cachedCount } });
    }

    const supabase = await createServiceClient();
    const { data: count, error } = await supabase.rpc('get_waitlist_count');

    if (error) {
      console.error('Waitlist count error:', error);
      return NextResponse.json({ data: { count: cachedCount ?? 0 } });
    }

    cachedCount = count ?? 0;
    cacheTimestamp = now;

    return NextResponse.json({ data: { count: cachedCount } });
  } catch (err) {
    console.error('Waitlist count API error:', err);
    return NextResponse.json({ data: { count: 0 } });
  }
}
