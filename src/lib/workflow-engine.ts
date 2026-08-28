export type TriggerType = 'manual' | 'record_created' | 'record_updated' | 'threshold_reached';
export type ActionType = 'create_task' | 'notify' | 'create_draft' | 'request_approval';

export interface WorkflowRule {
  id: string;
  organizationId: string;
  name: string;
  enabled: boolean;
  trigger: {
    type: TriggerType;
    resource: string;
    field?: string;
    value?: string | number | boolean;
  };
  actions: Array<{
    type: ActionType;
    payload: Record<string, unknown>;
  }>;
}

export function matchesWorkflowTrigger(workflow: WorkflowRule, event: Record<string, unknown>) {
  if (!workflow.enabled) return false;
  if (workflow.trigger.type === 'manual') return false;
  if (event.resource !== workflow.trigger.resource) return false;
  if (!workflow.trigger.field) return true;
  return event[workflow.trigger.field] === workflow.trigger.value;
}

export function planWorkflowActions(workflow: WorkflowRule) {
  return workflow.actions.map((action, index) => ({
    id: `${workflow.id}:action:${index + 1}`,
    type: action.type,
    payload: action.payload,
    status: action.type === 'request_approval' ? 'awaiting_approval' : 'planned',
  }));
}
