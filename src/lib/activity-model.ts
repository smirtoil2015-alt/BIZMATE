export type ActivityType = 'customer' | 'project' | 'finance' | 'team' | 'document' | 'automation' | 'system';

export interface ActivityEvent {
  id: string;
  organizationId: string;
  actorId: string;
  type: ActivityType;
  title: string;
  description?: string;
  resourceId?: string;
  createdAt: string;
}

export function recentActivity(events: ActivityEvent[], limit = 20) {
  return [...events]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
