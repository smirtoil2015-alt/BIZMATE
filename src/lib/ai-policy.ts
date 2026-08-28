import type { UserRole } from '@/types/business';

export type AICapability = 'read_company_data' | 'create_draft' | 'create_task' | 'send_message' | 'modify_financial_data' | 'invite_member';

const allowed: Record<UserRole, AICapability[]> = {
  owner: ['read_company_data', 'create_draft', 'create_task', 'send_message', 'modify_financial_data', 'invite_member'],
  admin: ['read_company_data', 'create_draft', 'create_task', 'send_message', 'modify_financial_data', 'invite_member'],
  manager: ['read_company_data', 'create_draft', 'create_task', 'send_message'],
  employee: ['read_company_data', 'create_draft', 'create_task'],
};

export function canAIAgentPerform(role: UserRole, capability: AICapability) {
  return allowed[role].includes(capability);
}

/**
 * High-impact actions should still require an explicit approval step even when
 * the role has permission. This keeps AI execution approval-first by design.
 */
export function requiresApproval(capability: AICapability) {
  return ['send_message', 'modify_financial_data', 'invite_member'].includes(capability);
}
