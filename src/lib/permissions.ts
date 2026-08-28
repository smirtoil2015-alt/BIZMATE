import type { ModuleKey, UserRole } from '@/types/business';

const roleRank: Record<UserRole, number> = {
  employee: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

const roleModules: Record<UserRole, ModuleKey[]> = {
  owner: ['overview', 'intelligence', 'customers', 'projects', 'people', 'finance', 'automations', 'knowledge', 'reports', 'settings'],
  admin: ['overview', 'intelligence', 'customers', 'projects', 'people', 'finance', 'automations', 'knowledge', 'reports', 'settings'],
  manager: ['overview', 'intelligence', 'customers', 'projects', 'people', 'knowledge', 'reports'],
  employee: ['overview', 'customers', 'projects', 'knowledge'],
};

export function canAccessModule(role: UserRole, module: ModuleKey): boolean {
  return roleModules[role].includes(module);
}

export function modulesForRole(role: UserRole): ModuleKey[] {
  return roleModules[role];
}

export function canManageMembers(role: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageCompanySettings(role: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageFinance(role: UserRole): boolean {
  return roleRank[role] >= roleRank.manager;
}
