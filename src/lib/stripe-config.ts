// Client-safe Stripe configuration — no Stripe SDK import
// Use this in client components. Server code can import from '@/lib/stripe' instead.

// Credits required per diagnostic report
export const CREDITS_PER_REPORT = 5;

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
    price: 899, // $8.99
    pricePerCredit: 1.8,
  },
  {
    id: 'popular',
    name: 'Popular',
    credits: 20,
    price: 1499, // $14.99
    pricePerCredit: 0.75,
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 50,
    price: 1999, // $19.99
    pricePerCredit: 0.4,
  },
];

export function getCreditBundle(bundleId: string): CreditBundle | undefined {
  return CREDIT_BUNDLES.find((b) => b.id === bundleId);
}
