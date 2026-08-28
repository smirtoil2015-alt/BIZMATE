import type { Customer, Member, Project, BusinessInsight } from '@/types/business';
import { calculateCompanyMetrics } from '@/lib/company-metrics';
import type { FinancialTransaction } from '@/lib/finance-model';

export interface ExecutiveReport {
  title: string;
  generatedAt: string;
  summary: string;
  metrics: ReturnType<typeof calculateCompanyMetrics> & { income: number; expenses: number; net: number };
  highlights: string[];
  actions: string[];
}

export function generateExecutiveReport(input: {
  customers: Customer[];
  projects: Project[];
  insights: BusinessInsight[];
  members: Member[];
  transactions: FinancialTransaction[];
}): ExecutiveReport {
  const company = calculateCompanyMetrics(input.customers, input.projects, input.insights);
  const posted = input.transactions.filter((item) => item.status === 'posted');
  const income = posted.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = posted.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const net = income - expenses;

  const highlights = [
    `${company.healthScore}/100 business health score`,
    `${company.activeCustomers} active customers`,
    `${input.members.filter((member) => member.status === 'active').length} active team members`,
    `${net.toLocaleString()} net posted result`,
  ];

  const actions = [
    ...(company.urgentInsights ? ['Resolve critical insights before lower-priority work.'] : []),
    ...(company.projectsAtRisk ? ['Create recovery plans for at-risk projects.'] : []),
    'Review the report with the executive team and assign owners to actions.',
  ];

  return {
    title: 'Executive Business Report',
    generatedAt: new Date().toISOString(),
    summary: company.healthScore >= 80 ? 'The business is operating from a healthy position with focused actions available.' : 'The business needs focused management attention across risk and execution.',
    metrics: { ...company, income, expenses, net },
    highlights,
    actions,
  };
}
