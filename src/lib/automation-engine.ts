'use client';

import { createOrgRecord, listOrgRecords } from '@/lib/firestore-service';

type Workflow = {
  id: string;
  name: string;
  trigger: string;
  actions?: number;
  actionType?: 'create_activity' | 'create_approval';
  status: 'active' | 'paused' | 'approval required';
};

const triggerAliases: Record<string, string> = {
  'Customer created': 'customer.created',
  'Project becomes at-risk': 'project.at_risk',
  'Expense requires approval': 'finance.expense',
  'Manual trigger': 'manual',
};

export async function runAutomations(orgId: string, event: string, payload: Record<string, unknown>) {
  if (!orgId) return { matched: 0, executed: 0 };
  const workflows = await listOrgRecords<Workflow>(orgId, 'automations');
  const matching = workflows.filter((workflow) => workflow.status === 'active' && (triggerAliases[workflow.trigger] ?? workflow.trigger) === event);
  let executed = 0;

  for (const workflow of matching) {
    const actionType = workflow.actionType ?? 'create_activity';
    if (actionType === 'create_approval') {
      await createOrgRecord(orgId, 'approvals', {
        organizationId: orgId,
        requestedBy: String(payload.actorId ?? 'system'),
        status: 'pending',
        source: 'automation',
        workflowId: workflow.id,
        workflowName: workflow.name,
        event,
        payload,
      });
    } else {
      await createOrgRecord(orgId, 'activity', {
        organizationId: orgId,
        type: 'automation',
        status: 'completed',
        workflowId: workflow.id,
        workflowName: workflow.name,
        event,
        title: `Automation executed: ${workflow.name}`,
        description: `Workflow triggered by ${event}.`,
        payload,
      });
    }
    executed += 1;
  }

  return { matched: matching.length, executed };
}
