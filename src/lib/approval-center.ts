export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApprovalRequest {
  id: string;
  organizationId: string;
  requestedBy: string;
  approverRole: 'owner' | 'admin' | 'manager';
  action: string;
  summary: string;
  status: ApprovalStatus;
  createdAt: string;
  expiresAt?: string;
  sourceAlertId?: string;
  source?: string;
  metric?: string | null;
}

export function canResolveApproval(role: string, request: ApprovalRequest) {
  return request.status === 'pending' && ['owner', 'admin', 'manager'].includes(role) && role === request.approverRole;
}
