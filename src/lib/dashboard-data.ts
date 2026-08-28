import { findOrgRecords, listOrgRecords } from '@/lib/firestore-service';
import { calculateCompanyMetrics } from '@/lib/company-metrics';

export async function loadDashboardData(organizationId: string) {
  const [customers, projects, insights] = await Promise.all([
    listOrgRecords(organizationId, 'customers'),
    listOrgRecords(organizationId, 'projects'),
    listOrgRecords(organizationId, 'insights'),
  ]);

  const typedCustomers = customers.map((item) => ({ ...item, status: String(item.status ?? 'lead') as any, value: Number(item.value ?? item.estimatedValue ?? 0) }));
  const typedProjects = projects.map((item) => ({ ...item, status: String(item.status ?? 'planning') as any, progress: Number(item.progress ?? 0) }));
  const typedInsights = insights.map((item) => ({ ...item, severity: String(item.severity ?? 'info') as any }));

  return {
    customers: typedCustomers,
    projects: typedProjects,
    insights: typedInsights,
    metrics: calculateCompanyMetrics(typedCustomers, typedProjects, typedInsights),
  };
}
