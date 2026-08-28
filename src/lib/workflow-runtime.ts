import type { WorkflowRule } from '@/lib/workflow-engine';
import { matchesWorkflowTrigger, planWorkflowActions } from '@/lib/workflow-engine';

export interface WorkflowEvent {
  organizationId: string;
  resource: string;
  [key: string]: unknown;
}

export function runMatchingWorkflows(workflows: WorkflowRule[], event: WorkflowEvent) {
  return workflows
    .filter((workflow) => workflow.organizationId === event.organizationId)
    .filter((workflow) => matchesWorkflowTrigger(workflow, event))
    .flatMap((workflow) => planWorkflowActions(workflow));
}
