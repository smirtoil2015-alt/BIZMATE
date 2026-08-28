import type { ModuleKey, UserRole } from '@/types/business';

const roleModules: Record<UserRole, ModuleKey[]> = {
  owner: ['overview', 'intelligence', 'customers', 'projects', 'people', 'finance', 'automations', 'knowledge', 'reports', 'settings'],
  admin: ['overview', 'intelligence', 'customers', 'projects', 'people', 'finance', 'automations', 'knowledge', 'reports', 'settings'],
  manager: ['overview', 'intelligence', 'customers', 'projects', 'people', 'knowledge', 'reports'],
  employee: ['overview', 'customers', 'projects', 'knowledge'],
};

export function canAccessModule(role: UserRole, module: ModuleKey) {
  return roleModules[role].includes(module);
}

export function modulesForRole(role: UserRole) {
  return roleModules[role];
}
