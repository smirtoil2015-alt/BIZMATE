import type { BusinessInsight, Customer, Project } from '@/types/business';

export interface CompanyMetrics {
  healthScore: number;
  pipelineValue: number;
  activeCustomers: number;
  projectsAtRisk: number;
  urgentInsights: number;
}

export function calculateCompanyMetrics(
  customers: Customer[],
  projects: Project[],
  insights: BusinessInsight[],
): CompanyMetrics {
  const pipelineValue = customers.reduce((sum, customer) => sum + (customer.value ?? 0), 0);
  const activeCustomers = customers.filter((customer) => customer.status === 'active').length;
  const projectsAtRisk = projects.filter((project) => project.status === 'at-risk').length;
  const urgentInsights = insights.filter((insight) => insight.severity === 'critical').length;

  const projectHealth = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
    : 100;
  const riskPenalty = Math.min(projectsAtRisk * 8 + urgentInsights * 5, 40);
  const healthScore = Math.max(0, Math.min(100, Math.round(projectHealth - riskPenalty)));

  return { healthScore, pipelineValue, activeCustomers, projectsAtRisk, urgentInsights };
}
