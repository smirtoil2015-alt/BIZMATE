import type { BillingPlan } from '@/lib/billing-model';
import type { ModuleKey } from '@/types/business';

export interface WorkspaceState {
  organizationId: string;
  activeModule: ModuleKey;
  billingPlan: BillingPlan;
  onboardingComplete: boolean;
  notificationsUnread: number;
}

export function setActiveModule(state: WorkspaceState, activeModule: ModuleKey): WorkspaceState {
  return { ...state, activeModule };
}
