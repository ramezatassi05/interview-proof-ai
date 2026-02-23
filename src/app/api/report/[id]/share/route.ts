import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reportId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, user_id, share_token, share_enabled')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const { enabled } = await request.json();

    // Use service client for the update (bypasses RLS)
    const serviceClient = await createServiceClient();

    const updates: Record<string, unknown> = {
      share_enabled: !!enabled,
    };

    // Generate token on first enable
    if (enabled && !report.share_token) {
      updates.share_token = randomBytes(16).toString('hex');
      updates.share_created_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await serviceClient
      .from('reports')
      .update(updates)
      .eq('id', reportId)
      .select('share_token, share_enabled')
      .single();

    if (updateError) {
      console.error('Failed to update share settings:', updateError);
      return NextResponse.json({ error: 'Failed to update share settings' }, { status: 500 });
    }

    const origin = request.headers.get('origin') || request.headers.get('host') || '';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    return NextResponse.json({
      data: {
        shareEnabled: updated.share_enabled,
        shareUrl: updated.share_token ? `${baseUrl}/s/${updated.share_token}` : '',
      },
    });
  } catch (error) {
    console.error('Share toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
