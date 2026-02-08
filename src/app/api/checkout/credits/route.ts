import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient, getCreditBundle } from '@/lib/stripe';

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
    const { bundleId, referralCode } = body;

    if (!bundleId) {
      return NextResponse.json({ error: 'bundleId is required' }, { status: 400 });
    }

    // Validate bundle exists
    const bundle = getCreditBundle(bundleId);
    if (!bundle) {
      return NextResponse.json({ error: 'Invalid bundle' }, { status: 400 });
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
              name: `InterviewProof ${bundle.name} Bundle`,
              description: `${bundle.credits} credits for diagnostic reports`,
            },
            unit_amount: bundle.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        bundle_id: bundle.id,
        credits: bundle.credits.toString(),
        type: 'credit_bundle',
        referral_code: referralCode || '',
      },
      customer_email: user.email,
      success_url: `${appUrl}/wallet?payment=success&credits=${bundle.credits}`,
      cancel_url: `${appUrl}/wallet?payment=cancelled`,
    });

    return NextResponse.json({
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Credits checkout session creation failed:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
