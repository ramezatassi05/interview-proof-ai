/**
 * GET /api/outbox
 *
 * Lists the user's outbound drafts (draft_recruiter_reply +
 * rewrite_resume_bullet). Used by /outbox.
 *
 * Returns rows grouped by status — drafted, awaiting_approval, approved,
 * completed, failed, rejected.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rowToAgentAction } from '@/lib/agent/types';
import type { AgentActionRow } from '@/lib/agent/types';

const OUTBOX_TYPES = ['draft_recruiter_reply', 'rewrite_resume_bullet'] as const;

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
      .from('agent_actions')
      .select()
      .eq('user_id', user.id)
      .in('action_type', OUTBOX_TYPES as unknown as string[])
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[outbox] list error:', error);
      return NextResponse.json({ error: 'Failed to list' }, { status: 500 });
    }

    return NextResponse.json({
      data: ((data ?? []) as AgentActionRow[]).map(rowToAgentAction),
    });
  } catch (err) {
    console.error('GET /api/outbox error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
