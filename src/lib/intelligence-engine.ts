import type { BusinessInsight, Customer, Project } from '@/types/business';
import { calculateCompanyMetrics } from '@/lib/company-metrics';

export interface DecisionBrief {
  headline: string;
  healthScore: number;
  positives: string[];
  risks: string[];
  recommendedActions: string[];
}

export function buildDecisionBrief(customers: Customer[], projects: Project[], insights: BusinessInsight[]): DecisionBrief {
  const metrics = calculateCompanyMetrics(customers, projects, insights);
  const positives: string[] = [];
  const risks: string[] = [];
  const recommendedActions: string[] = [];

  if (metrics.activeCustomers > 0) positives.push(`${metrics.activeCustomers} active customers are currently in the portfolio.`);
  if (metrics.pipelineValue > 0) positives.push(`Tracked customer value is ${metrics.pipelineValue.toLocaleString()}.`);
  if (metrics.projectsAtRisk > 0) {
    risks.push(`${metrics.projectsAtRisk} project(s) are currently at risk.`);
    recommendedActions.push('Review the at-risk projects and assign a recovery owner.');
  }
  if (metrics.urgentInsights > 0) {
    risks.push(`${metrics.urgentInsights} critical business insight(s) need attention.`);
    recommendedActions.push('Open Intelligence and resolve critical insights first.');
  }
  if (recommendedActions.length === 0) recommendedActions.push('Keep monitoring the business pulse and review weekly KPIs.');

  const headline = metrics.healthScore >= 80
    ? 'Business is healthy, with a few opportunities to act on.'
    : metrics.healthScore >= 60
      ? 'Business is stable, but several areas need management attention.'
      : 'Business health needs immediate attention and a focused recovery plan.';

  return { headline, healthScore: metrics.healthScore, positives, risks, recommendedActions };
}
