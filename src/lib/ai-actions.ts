import type { UserRole } from '@/types/business';
import { canAIAgentPerform, requiresApproval, type AICapability } from '@/lib/ai-policy';

export interface AIActionRequest {
  capability: AICapability;
  requestedBy: UserRole;
  reason: string;
  payload: Record<string, unknown>;
}

export interface AIActionDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
}

export function evaluateAIAction(request: AIActionRequest): AIActionDecision {
  if (!canAIAgentPerform(request.requestedBy, request.capability)) {
    return { allowed: false, requiresApproval: false, reason: 'The current role does not have permission for this AI action.' };
  }

  return {
    allowed: true,
    requiresApproval: requiresApproval(request.capability),
    reason: requiresApproval(request.capability)
      ? 'The action is permitted but must be explicitly approved before execution.'
      : 'The action can proceed within the current role policy.',
  };
}
