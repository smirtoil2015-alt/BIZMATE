import type { ModuleKey, UserRole } from '@/types/business';
import { modulesForRole } from '@/lib/permissions';

export const moduleMeta: Record<ModuleKey, { label: string; description: string }> = {
  overview: { label: 'Overview', description: 'Your executive command center' },
  intelligence: { label: 'Intelligence', description: 'AI-powered business insights' },
  customers: { label: 'Customers', description: 'Customer relationships and opportunities' },
  projects: { label: 'Projects', description: 'Projects, delivery and tasks' },
  people: { label: 'People', description: 'Employees, teams and roles' },
  finance: { label: 'Finance', description: 'Revenue, expenses and financial health' },
  automations: { label: 'Automations', description: 'Workflows and approval-driven actions' },
  knowledge: { label: 'Knowledge', description: 'Company documents and institutional memory' },
  reports: { label: 'Reports', description: 'Business reporting and analytics' },
  settings: { label: 'Settings', description: 'Company configuration and security' },
};

export function navigationForRole(role: UserRole) {
  return modulesForRole(role).map((key) => ({ key, ...moduleMeta[key] }));
}
