export interface SecurityEvent {
  id: string;
  organizationId: string;
  actorId: string;
  type: 'login' | 'logout' | 'permission_change' | 'data_export' | 'approval' | 'security_alert';
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AccessPolicy {
  organizationId: string;
  sessionMaxMinutes: number;
  requireMfaForAdmins: boolean;
  allowDataExport: boolean;
  requireApprovalForFinancialActions: boolean;
}

export const defaultAccessPolicy: Omit<AccessPolicy, 'organizationId'> = {
  sessionMaxMinutes: 480,
  requireMfaForAdmins: true,
  allowDataExport: true,
  requireApprovalForFinancialActions: true,
};
