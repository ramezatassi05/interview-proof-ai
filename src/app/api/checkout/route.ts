import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient, CREDIT_PRODUCT } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    // Verify the report exists and belongs to the user
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, paid_unlocked')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.paid_unlocked) {
      return NextResponse.json({ error: 'Report is already unlocked' }, { status: 400 });
    }

    // Create Stripe checkout session
    const stripe = getStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: CREDIT_PRODUCT.name,
              description: CREDIT_PRODUCT.description,
            },
            unit_amount: CREDIT_PRODUCT.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        report_id: reportId,
        credits: CREDIT_PRODUCT.credits.toString(),
      },
      customer_email: user.email,
      success_url: `${appUrl}/r/${reportId}/full?payment=success`,
      cancel_url: `${appUrl}/r/${reportId}?payment=cancelled`,
    });

    return NextResponse.json({
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
