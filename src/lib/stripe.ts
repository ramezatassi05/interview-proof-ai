import Stripe from 'stripe';
import https from 'node:https';

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

    // Stripe v20's NodeHttpClient uses keepAlive:true agents at module level.
    // In Vercel's serverless environment, frozen functions leave stale connections
    // that fail on resume. Pass a fresh agent with keepAlive:false to avoid this.
    const agent = new https.Agent({ keepAlive: false });
    let httpClient: Stripe.HttpClient;
    try {
      httpClient = Stripe.createNodeHttpClient(agent);
    } catch {
      httpClient = Stripe.createFetchHttpClient();
    }

    stripeInstance = new Stripe(secretKey, { httpClient });
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
