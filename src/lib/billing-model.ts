export type BillingPlan = 'trial' | 'starter' | 'business' | 'enterprise';

export interface BillingSubscription {
  organizationId: string;
  plan: BillingPlan;
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  seats: number;
  currency: string;
  renewsAt?: string;
}

export const billingPlans = {
  trial: { name: 'Free Trial', seats: 3, intelligence: true, automations: 2 },
  starter: { name: 'Starter', seats: 10, intelligence: true, automations: 10 },
  business: { name: 'Business', seats: 50, intelligence: true, automations: 100 },
  enterprise: { name: 'Enterprise', seats: Infinity, intelligence: true, automations: Infinity },
} as const;
