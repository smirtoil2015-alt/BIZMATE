import { billingPlans, type BillingPlan, type BillingSubscription } from '@/lib/billing-model';

export function canUseAutomation(subscription: BillingSubscription, currentCount: number) {
  return currentCount < billingPlans[subscription.plan].automations;
}

export function canAddSeat(subscription: BillingSubscription, currentSeats: number) {
  return currentSeats < billingPlans[subscription.plan].seats;
}

export function subscriptionLabel(plan: BillingPlan) {
  return billingPlans[plan].name;
}
