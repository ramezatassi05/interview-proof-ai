import crypto from 'crypto';
import { NextResponse } from 'next/server';

/**
 * Verify a Bearer token using timing-safe comparison.
 * Prevents timing attacks that could leak the secret.
 */
export function verifyBearerToken(authHeader: string | null, secret: string): boolean {
  if (!authHeader) return false;
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(authHeader, 'utf-8'), Buffer.from(expected, 'utf-8'));
}

/**
 * Verify the CRON_SECRET from request headers.
 * Returns a 401 response if invalid, or null if valid.
 */
export function verifyCronSecret(authHeader: string | null): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !verifyBearerToken(authHeader, cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
