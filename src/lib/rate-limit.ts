import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface RateLimitOptions {
  prefix: string;
  identifier: string;
  maxRequests: number;
  windowSeconds: number;
}

/**
 * Check if a request is within rate limits.
 * Returns true if allowed, false if rate limited.
 * Fails closed on DB errors (denies requests for safety).
 */
export async function checkRateLimit({
  prefix,
  identifier,
  maxRequests,
  windowSeconds,
}: RateLimitOptions): Promise<boolean> {
  try {
    const supabase = await createServiceClient();
    const key = `${prefix}:${identifier}`;
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

    const { count, error: countError } = await supabase
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('attempted_at', windowStart);

    if (countError) {
      console.error('Rate limit check error:', countError);
      return false; // fail closed — deny requests when rate limit DB is unavailable
    }

    if ((count ?? 0) >= maxRequests) {
      return false;
    }

    // Record this attempt
    const { error: insertError } = await supabase.from('api_rate_limits').insert({ key });

    if (insertError) {
      console.error('Rate limit record error:', insertError);
    }

    return true;
  } catch (error) {
    console.error('Rate limit error:', error);
    return false; // fail closed — deny requests on unexpected errors
  }
}

/**
 * Returns a 429 Too Many Requests response.
 */
export function rateLimitResponse(retryAfterSeconds = 60): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    }
  );
}
