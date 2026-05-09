/**
 * DELETE /api/account/linked-accounts/[provider]
 *
 * Disconnects a linked account. RLS allows users to delete their own.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_PROVIDERS = new Set(['google']);

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    if (!VALID_PROVIDERS.has(provider)) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('user_linked_accounts')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      console.error('[linked-accounts] delete error:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    console.error('DELETE /api/account/linked-accounts/[provider] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
