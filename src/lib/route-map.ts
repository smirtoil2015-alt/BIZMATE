import type { ModuleKey } from '@/types/business';

export const moduleRoutes: Record<ModuleKey, string> = {
  overview: '/dashboard',
  intelligence: '/dashboard/intelligence',
  customers: '/dashboard/customers',
  projects: '/dashboard/projects',
  people: '/dashboard/people',
  finance: '/dashboard/finance',
  automations: '/dashboard/automations',
  knowledge: '/dashboard/knowledge',
  reports: '/dashboard/reports',
  settings: '/dashboard/settings',
};

export function routeForModule(module: ModuleKey) {
  return moduleRoutes[module];
}
