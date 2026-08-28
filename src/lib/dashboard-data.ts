import type { BusinessInsight, Customer, Project } from '@/types/business';
import { listOrgRecords } from '@/lib/firestore-service';
import { calculateCompanyMetrics } from '@/lib/company-metrics';

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
    status: ['lead', 'active', 'inactive'].includes(String(item.status))
      ? (String(item.status) as Customer['status'])
      : 'lead',
    value: Number(item.value ?? 0),
  }));

  const typedProjects: Project[] = projects.map((item) => ({
    ...item,
    organizationId,
    name: String(item.name ?? 'Untitled project'),
    status: ['planning', 'active', 'at-risk', 'completed'].includes(String(item.status))
      ? (String(item.status) as Project['status'])
      : 'planning',
    progress: Number(item.progress ?? 0),
  }));

  const typedInsights: BusinessInsight[] = insights.map((item) => ({
    ...item,
    organizationId,
    title: String(item.title ?? 'Business insight'),
    description: String(item.description ?? ''),
    severity: ['critical', 'warning', 'opportunity', 'info'].includes(String(item.severity))
      ? (String(item.severity) as BusinessInsight['severity'])
      : 'info',
    createdAt: String(item.createdAt ?? new Date().toISOString()),
  }));

  return {
    customers: typedCustomers,
    projects: typedProjects,
    insights: typedInsights,
    metrics: calculateCompanyMetrics(typedCustomers, typedProjects, typedInsights),
  };
}
