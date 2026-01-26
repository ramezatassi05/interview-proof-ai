import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getStripeClient, WEBHOOK_EVENTS } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === WEBHOOK_EVENTS.CHECKOUT_COMPLETED) {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only process successful payments
    if (session.payment_status !== 'paid') {
      console.log('Payment not completed, skipping:', session.id);
      return NextResponse.json({ received: true });
    }

    const userId = session.metadata?.user_id;
    const reportId = session.metadata?.report_id;
    const credits = parseInt(session.metadata?.credits || '1', 10);
    const purchaseType = session.metadata?.type; // 'credit_bundle' or undefined (legacy)

    if (!userId) {
      console.error('Missing user_id in checkout session:', session.id);
      return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 });
    }

    // For legacy flow, reportId is required
    if (!purchaseType && !reportId) {
      console.error('Missing report_id in legacy checkout session:', session.id);
      return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 });
    }

    try {
      // Use service client to bypass RLS
      const supabase = await createServiceClient();

      // Check for duplicate processing (idempotency)
      const { data: existingLedger } = await supabase
        .from('credits_ledger')
        .select('id')
        .eq('stripe_event_id', event.id)
        .single();

      if (existingLedger) {
        console.log('Event already processed:', event.id);
        return NextResponse.json({ received: true });
      }

      // 1. Add credits to ledger (purchase)
      const { error: purchaseError } = await supabase
        .from('credits_ledger')
        .insert({
          user_id: userId,
          type: 'purchase',
          amount: credits,
          stripe_event_id: event.id,
        })
        .select('id')
        .single();

      if (purchaseError) {
        console.error('Failed to add credits:', purchaseError);
        throw purchaseError;
      }

      // For credit bundle purchases, we're done - no report to unlock
      if (purchaseType === 'credit_bundle') {
        console.log('Successfully processed credit bundle purchase:', {
          userId,
          credits,
          eventId: event.id,
        });
        return NextResponse.json({ received: true });
      }

      // Legacy flow: also spend credit and unlock the report
      // 2. Spend credit for the report
      const { data: spendLedger, error: spendError } = await supabase
        .from('credits_ledger')
        .insert({
          user_id: userId,
          type: 'spend',
          amount: -1,
          stripe_event_id: `${event.id}_spend`,
        })
        .select('id')
        .single();

      if (spendError) {
        console.error('Failed to spend credit:', spendError);
        throw spendError;
      }

      // 3. Unlock the report
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          paid_unlocked: true,
          credit_spend_ledger_id: spendLedger.id,
        })
        .eq('id', reportId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to unlock report:', updateError);
        throw updateError;
      }

      console.log('Successfully processed payment:', {
        userId,
        reportId,
        credits,
        eventId: event.id,
      });

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Database operation failed:', error);
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }
  }

  // Return 200 for unhandled event types
  return NextResponse.json({ received: true });
}
