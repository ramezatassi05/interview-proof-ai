import Stripe from 'stripe';

// Re-export client-safe config so server routes can still import from '@/lib/stripe'
export {
  CREDITS_PER_REPORT,
  CREDIT_BUNDLES,
  getCreditBundle,
  type CreditBundle,
} from './stripe-config';

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeInstance = new Stripe(secretKey);
  }
  return stripeInstance;
}

// Legacy single credit product (for backward compatibility)
export const CREDIT_PRODUCT = {
  name: 'InterviewProof Diagnostic Credit',
  description: 'Unlock full diagnostic report with all risks, questions, and study plan',
  price: 1900, // $19.00 in cents
  credits: 5,
};

// Stripe webhook event types we handle
export const WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  PAYMENT_SUCCEEDED: 'payment_intent.succeeded',
} as const;
