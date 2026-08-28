export const tenantCollections = {
  members: (organizationId: string) => `organizations/${organizationId}/members`,
  customers: (organizationId: string) => `organizations/${organizationId}/customers`,
  projects: (organizationId: string) => `organizations/${organizationId}/projects`,
  transactions: (organizationId: string) => `organizations/${organizationId}/transactions`,
  documents: (organizationId: string) => `organizations/${organizationId}/documents`,
  insights: (organizationId: string) => `organizations/${organizationId}/insights`,
  workflows: (organizationId: string) => `organizations/${organizationId}/workflows`,
  notifications: (organizationId: string) => `organizations/${organizationId}/notifications`,
  audit: (organizationId: string) => `organizations/${organizationId}/audit`,
};
