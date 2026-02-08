import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { CREDITS_PER_REPORT } from '@/lib/stripe';
import { grantCredits, GRANT_AMOUNTS } from '@/lib/credits';

const UnlockReportSchema = z.object({
  reportId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = UnlockReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { reportId } = validation.data;

    // Fetch the report
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, paid_unlocked')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if already unlocked
    if (report.paid_unlocked) {
      return NextResponse.json({
        data: {
          reportId,
          alreadyUnlocked: true,
          message: 'Report is already unlocked',
        },
      });
    }

    // Check user's credit balance
    const { data: balanceResult, error: balanceError } = await supabase.rpc(
      'get_user_credit_balance',
      { p_user_id: user.id }
    );

    if (balanceError) {
      console.error('Failed to check credit balance:', balanceError);
      return NextResponse.json({ error: 'Failed to check credit balance' }, { status: 500 });
    }

    const currentBalance = balanceResult as number;

    if (currentBalance < CREDITS_PER_REPORT) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          currentBalance,
          requiredCredits: CREDITS_PER_REPORT,
          message: 'Purchase credits to unlock the full diagnostic',
        },
        { status: 402 }
      );
    }

    // Spend credits (insert negative ledger entry)
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('credits_ledger')
      .insert({
        user_id: user.id,
        type: 'spend',
        amount: -CREDITS_PER_REPORT,
      })
      .select('id')
      .single();

    if (ledgerError) {
      console.error('Failed to spend credit:', ledgerError);
      return NextResponse.json({ error: 'Failed to process credit' }, { status: 500 });
    }

    // Update report to unlocked
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        paid_unlocked: true,
        credit_spend_ledger_id: ledgerEntry.id,
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('Failed to unlock report:', updateError);
      // TODO: Consider rolling back the credit spend
      return NextResponse.json({ error: 'Failed to unlock report' }, { status: 500 });
    }

    // Grant first-unlock bonus if this is the user's first unlock (non-blocking)
    try {
      const { count } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('paid_unlocked', true);

      if (count === 1) {
        const serviceClient = await createServiceClient();
        await grantCredits({
          supabase: serviceClient,
          userId: user.id,
          amount: GRANT_AMOUNTS.FIRST_UNLOCK_BONUS,
          reason: 'first_unlock',
          uniqueKey: user.id,
        });
      }
    } catch (grantError) {
      console.error('Failed to grant first unlock bonus:', grantError);
    }

    return NextResponse.json({
      data: {
        reportId,
        unlocked: true,
        creditsRemaining: currentBalance - CREDITS_PER_REPORT,
        message: 'Report unlocked successfully. Full diagnostic now available.',
      },
    });
  } catch (error) {
    console.error('Unlock report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
