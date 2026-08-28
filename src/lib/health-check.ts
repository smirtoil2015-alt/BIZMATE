export interface SystemHealth {
  firebaseConfigured: boolean;
  tenantIsolation: boolean;
  billingModel: boolean;
  aiPolicy: boolean;
  workflowEngine: boolean;
}

export function getSystemHealth(): SystemHealth {
  return {
    firebaseConfigured: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    tenantIsolation: true,
    billingModel: true,
    aiPolicy: true,
    workflowEngine: true,
  };
}
