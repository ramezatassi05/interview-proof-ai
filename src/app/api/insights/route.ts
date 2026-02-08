import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { AggregateInsightStats } from '@/types';

// In-memory cache with 5-minute TTL
let cachedData: AggregateInsightStats | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();
    if (cachedData && now - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json({ data: cachedData });
    }

    const supabase = await createServiceClient();
    const { data, error } = await supabase.rpc('get_aggregate_insights');

    if (error || !data) {
      console.error('Failed to fetch aggregate insights:', error);
      return NextResponse.json({ data: null });
    }

    cachedData = data as AggregateInsightStats;
    cacheTimestamp = now;

    return NextResponse.json({ data: cachedData });
  } catch (err) {
    console.error('Insights API error:', err);
    return NextResponse.json({ data: null });
  }
}
