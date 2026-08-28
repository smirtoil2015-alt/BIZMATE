import type { BusinessInsight, Customer, Project } from '@/types/business';
import { listOrgRecords } from '@/lib/firestore-service';
import { calculateCompanyMetrics } from '@/lib/company-metrics';

const customerStatuses: Customer['status'][] = ['lead', 'active', 'inactive'];
const projectStatuses: Project['status'][] = ['planning', 'active', 'at-risk', 'completed'];
const insightSeverities: BusinessInsight['severity'][] = ['critical', 'warning', 'opportunity', 'info'];

function asCustomerStatus(value: unknown): Customer['status'] {
  const candidate = String(value ?? 'lead') as Customer['status'];
  return customerStatuses.includes(candidate) ? candidate : 'lead';
}

function asProjectStatus(value: unknown): Project['status'] {
  const candidate = String(value ?? 'planning') as Project['status'];
  return projectStatuses.includes(candidate) ? candidate : 'planning';
}

function asInsightSeverity(value: unknown): BusinessInsight['severity'] {
  const candidate = String(value ?? 'info') as BusinessInsight['severity'];
  return insightSeverities.includes(candidate) ? candidate : 'info';
}

export async function loadDashboardData(organizationId: string) {
  const [customers, projects, insights] = await Promise.all([
    listOrgRecords<Customer>(organizationId, 'customers'),
    listOrgRecords<Project>(organizationId, 'projects'),
    listOrgRecords<BusinessInsight>(organizationId, 'insights'),
  ]);

  const typedCustomers: Customer[] = customers.map((item) => ({
    ...item,
    organizationId,
    name: String(item.name ?? 'Unnamed customer'),
    status: asCustomerStatus(item.status),
    value: Number(item.value ?? item.estimatedValue ?? 0),
  }));

  const typedProjects: Project[] = projects.map((item) => ({
    ...item,
    organizationId,
    name: String(item.name ?? 'Untitled project'),
    status: asProjectStatus(item.status),
    progress: Math.max(0, Math.min(100, Number(item.progress ?? 0))),
  }));

  const typedInsights: BusinessInsight[] = insights.map((item) => ({
    ...item,
    organizationId,
    title: String(item.title ?? 'Business insight'),
    description: String(item.description ?? ''),
    severity: asInsightSeverity(item.severity),
    createdAt: String(item.createdAt ?? new Date().toISOString()),
  }));

  return {
    customers: typedCustomers,
    projects: typedProjects,
    insights: typedInsights,
    metrics: calculateCompanyMetrics(typedCustomers, typedProjects, typedInsights),
  };
}
