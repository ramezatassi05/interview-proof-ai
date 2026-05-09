/**
 * GET /api/account/linked-accounts
 *
 * Returns a list of the user's connected third-party accounts (no tokens).
 * Drives the "Connected accounts" panel on /account.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface LinkedAccountRow {
  id: string;
  provider: 'google';
  account_email: string | null;
  scope: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

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

    const { data, error } = await supabase
      .from('user_linked_accounts')
      .select('id, provider, account_email, scope, expires_at, created_at, updated_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('[linked-accounts] list error:', error);
      return NextResponse.json({ error: 'Failed to list' }, { status: 500 });
    }

    return NextResponse.json({
      data: ((data ?? []) as LinkedAccountRow[]).map((r) => ({
        id: r.id,
        provider: r.provider,
        accountEmail: r.account_email,
        scope: r.scope,
        expiresAt: r.expires_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) {
    console.error('GET /api/account/linked-accounts error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
