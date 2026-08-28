import type { BillingPlan } from '@/lib/billing-model';

export type Feature = 'crm' | 'finance' | 'intelligence' | 'automations' | 'advanced_reports' | 'enterprise_security' | 'academy';

const features: Record<BillingPlan, Feature[]> = {
  trial: ['crm','intelligence','academy'],
  starter: ['crm','finance','intelligence','automations','academy'],
  business: ['crm','finance','intelligence','automations','advanced_reports','academy'],
  enterprise: ['crm','finance','intelligence','automations','advanced_reports','enterprise_security','academy'],
};

export function hasFeature(plan: BillingPlan, feature: Feature) { return features[plan].includes(feature); }
