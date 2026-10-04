// NOTE: these priceId values are placeholders. If you connect a real
// STRIPE_SECRET_KEY, create matching recurring Prices in your Stripe
// dashboard with these lookup keys (or swap in your own Price IDs) —
// otherwise checkout automatically falls back to local demo mode.
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    lookups: 50,
    skipTraces: 0,
    mailPieces: 0,
    priceId: null,
  },
  basic: {
    name: 'Basic',
    price: 4900, // cents
    lookups: 500,
    skipTraces: 25,
    mailPieces: 100,
    priceId: 'price_basic_monthly',
  },
  pro: {
    name: 'Pro',
    price: 9900, // cents
    lookups: 2000,
    skipTraces: 100,
    mailPieces: 500,
    priceId: 'price_pro_monthly',
  },
  team: {
    name: 'Team',
    price: 24900, // cents
    lookups: Infinity,
    skipTraces: 500,
    mailPieces: 2000,
    priceId: 'price_team_monthly',
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export interface Usage {
  lookups: number;
  skipTraces: number;
  mailPieces: number;
}

export interface Subscription {
  plan: PlanKey;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  usage: Usage;
  currentPeriodEnd: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number; // cents
  credits?: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  invoiceUrl?: string;
}

export const CREDIT_PACKAGES = [
  { credits: 25, price: 2500, label: '25 Credits' },
  { credits: 50, price: 4500, label: '50 Credits' },
  { credits: 100, price: 8000, label: '100 Credits' },
  { credits: 250, price: 17500, label: '250 Credits' },
] as const;

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function getUsagePercentage(used: number, limit: number): number {
  if (limit === Infinity) return 0;
  return Math.min((used / limit) * 100, 100);
}

export function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'text-destructive';
  if (percentage >= 75) return 'text-yellow-500';
  return 'text-primary';
}

export function formatLimit(limit: number): string {
  if (limit === Infinity) return 'Unlimited';
  return limit.toLocaleString();
}

// Demo subscription state
export const DEMO_SUBSCRIPTION: Subscription = {
  plan: 'free',
  status: 'active',
  usage: {
    lookups: 32,
    skipTraces: 0,
    mailPieces: 0,
  },
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn_1',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    description: 'Pro Plan - Monthly Subscription',
    amount: 9900,
    status: 'completed',
    invoiceUrl: '#',
  },
  {
    id: 'txn_2',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    description: '100 Credits Top-Up',
    amount: 8000,
    credits: 100,
    status: 'completed',
    invoiceUrl: '#',
  },
  {
    id: 'txn_3',
    date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
    description: 'Pro Plan - Monthly Subscription',
    amount: 9900,
    status: 'completed',
    invoiceUrl: '#',
  },
  {
    id: 'txn_4',
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    description: 'Basic Plan - Monthly Subscription',
    amount: 4900,
    status: 'completed',
    invoiceUrl: '#',
  },
];
