import type { Customer, Project, BusinessInsight, Member } from '@/types/business';
import { calculateCompanyMetrics } from '@/lib/company-metrics';

export interface DashboardModel {
  metrics: ReturnType<typeof calculateCompanyMetrics>;
  customers: Customer[];
  projects: Project[];
  insights: BusinessInsight[];
  members: Member[];
}

export function buildDashboardModel(input: Omit<DashboardModel, 'metrics'>): DashboardModel {
  return {
    ...input,
    metrics: calculateCompanyMetrics(input.customers, input.projects, input.insights),
  };
}
