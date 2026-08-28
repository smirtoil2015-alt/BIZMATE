import type { BusinessInsight, Customer, Member, Organization, Project } from '@/types/business';

export const demoOrganization: Organization = {
  id: 'org_demo',
  name: 'BIZMATE Demo Company',
  slug: 'bizmate-demo',
  industry: 'Technology',
  country: 'Global',
  currency: 'USD',
  timezone: 'UTC',
  locale: 'en-US',
  createdAt: '2026-01-01T00:00:00Z',
};

export const demoMembers: Member[] = [
  { id: 'u1', organizationId: 'org_demo', name: 'Alex Morgan', email: 'alex@example.com', role: 'owner', department: 'Executive', status: 'active' },
  { id: 'u2', organizationId: 'org_demo', name: 'Maya Chen', email: 'maya@example.com', role: 'manager', department: 'Sales', status: 'active' },
  { id: 'u3', organizationId: 'org_demo', name: 'Daniel Reed', email: 'daniel@example.com', role: 'employee', department: 'Operations', status: 'active' },
];

export const demoCustomers: Customer[] = [
  { id: 'c1', organizationId: 'org_demo', name: 'Northstar Group', company: 'Northstar', status: 'active', value: 84000, lastContactAt: '2026-08-24' },
  { id: 'c2', organizationId: 'org_demo', name: 'Vertex Labs', company: 'Vertex', status: 'lead', value: 42000, lastContactAt: '2026-08-21' },
  { id: 'c3', organizationId: 'org_demo', name: 'Atlas Retail', company: 'Atlas', status: 'active', value: 67000, lastContactAt: '2026-08-17' },
];

export const demoProjects: Project[] = [
  { id: 'p1', organizationId: 'org_demo', name: 'Atlas Platform', status: 'active', progress: 78, ownerId: 'u2', dueDate: '2026-09-14' },
  { id: 'p2', organizationId: 'org_demo', name: 'Global Launch', status: 'at-risk', progress: 54, ownerId: 'u3', dueDate: '2026-09-03' },
  { id: 'p3', organizationId: 'org_demo', name: 'Customer Portal', status: 'planning', progress: 12, ownerId: 'u2', dueDate: '2026-10-12' },
];

export const demoInsights: BusinessInsight[] = [
  { id: 'i1', organizationId: 'org_demo', severity: 'critical', title: '3 high-value customers need follow-up', description: 'Engagement has fallen over the last 14 days.', metric: '$193k at risk', createdAt: '2026-08-28T07:30:00Z' },
  { id: 'i2', organizationId: 'org_demo', severity: 'warning', title: 'Global Launch is trending late', description: 'The delivery forecast moved beyond the planned date.', metric: '6 days', createdAt: '2026-08-28T08:15:00Z' },
  { id: 'i3', organizationId: 'org_demo', severity: 'opportunity', title: 'Sales pipeline has room to grow', description: 'Seven qualified opportunities are awaiting a next action.', metric: '$126k', createdAt: '2026-08-28T09:00:00Z' },
];
