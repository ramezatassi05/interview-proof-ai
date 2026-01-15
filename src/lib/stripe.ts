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

// Product configuration
export const CREDIT_PRODUCT = {
  name: 'InterviewProof Diagnostic Credit',
  description: 'Unlock full diagnostic report with all risks, questions, and study plan',
  price: 1500, // $15.00 in cents
  credits: 1,
};

// Stripe webhook event types we handle
export const WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  PAYMENT_SUCCEEDED: 'payment_intent.succeeded',
} as const;
