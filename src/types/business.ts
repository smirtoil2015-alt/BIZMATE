export type UserRole = 'owner' | 'admin' | 'manager' | 'employee';

export type ModuleKey =
  | 'overview'
  | 'intelligence'
  | 'customers'
  | 'projects'
  | 'people'
  | 'finance'
  | 'automations'
  | 'knowledge'
  | 'reports'
  | 'settings';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  country?: string;
  currency: string;
  timezone: string;
  locale: string;
  createdAt: string;
}

export interface Member {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  company?: string;
  email?: string;
  status: 'lead' | 'active' | 'inactive';
  value?: number;
  lastContactAt?: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  status: 'planning' | 'active' | 'at-risk' | 'completed';
  progress: number;
  ownerId?: string;
  dueDate?: string;
}

export interface BusinessInsight {
  id: string;
  organizationId: string;
  severity: 'critical' | 'warning' | 'opportunity' | 'info';
  title: string;
  description: string;
  metric?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  createdAt: string;
}
