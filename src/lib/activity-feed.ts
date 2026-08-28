import type { ModuleKey } from '@/types/business';

export type ActivityAction = 'created' | 'updated' | 'completed' | 'approved' | 'invited' | 'uploaded';

export interface ActivityItem {
  id: string;
  organizationId: string;
  actorId: string;
  actorName: string;
  module: ModuleKey;
  action: ActivityAction;
  title: string;
  createdAt: string;
}

export function sortActivity(items: ActivityItem[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
