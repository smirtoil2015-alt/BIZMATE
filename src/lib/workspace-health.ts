import type { BillingPlan } from '@/lib/billing-model';
import type { Organization, Member, Customer, Project, BusinessInsight } from '@/types/business';
import { calculateCompanyMetrics } from '@/lib/company-metrics';

export interface WorkspaceHealth {
  organization: Pick<Organization, 'id' | 'name' | 'currency' | 'locale' | 'timezone'>;
  members: number;
  customers: number;
  projects: number;
  plan: BillingPlan;
  metrics: ReturnType<typeof calculateCompanyMetrics>;
  setupProgress: number;
}

export function buildWorkspaceHealth(
  organization: Organization,
  members: Member[],
  customers: Customer[],
  projects: Project[],
  insights: BusinessInsight[],
  plan: BillingPlan,
): WorkspaceHealth {
  const completedSignals = [
    Boolean(organization.name),
    Boolean(organization.industry),
    Boolean(organization.country),
    Boolean(organization.locale),
    members.length > 0,
    customers.length > 0,
    projects.length > 0,
  ].filter(Boolean).length;

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      currency: organization.currency,
      locale: organization.locale,
      timezone: organization.timezone,
    },
    members: members.length,
    customers: customers.length,
    projects: projects.length,
    plan,
    metrics: calculateCompanyMetrics(customers, projects, insights),
    setupProgress: Math.round((completedSignals / 7) * 100),
  };
}
