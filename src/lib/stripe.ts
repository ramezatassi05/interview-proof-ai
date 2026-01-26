import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeInstance = new Stripe(secretKey, {
      typescript: true,
    });
  }
  return stripeInstance;
}

// Credits required per diagnostic report
export const CREDITS_PER_REPORT = 5;

// Legacy single credit product (for backward compatibility)
export const CREDIT_PRODUCT = {
  name: 'InterviewProof Diagnostic Credit',
  description: 'Unlock full diagnostic report with all risks, questions, and study plan',
  price: 1500, // $15.00 in cents
  credits: CREDITS_PER_REPORT, // Updated to match new pricing
};

// Credit bundle configuration
export interface CreditBundle {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents
  pricePerCredit: number;
  popular?: boolean;
}

export const CREDIT_BUNDLES: CreditBundle[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 5,
    price: 500, // $5.00
    pricePerCredit: 1.0,
  },
  {
    id: 'popular',
    name: 'Popular',
    credits: 20,
    price: 900, // $9.00
    pricePerCredit: 0.45,
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 50,
    price: 1900, // $19.00
    pricePerCredit: 0.38,
  },
];

export function getCreditBundle(bundleId: string): CreditBundle | undefined {
  return CREDIT_BUNDLES.find((b) => b.id === bundleId);
}

// Stripe webhook event types we handle
export const WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  PAYMENT_SUCCEEDED: 'payment_intent.succeeded',
} as const;
