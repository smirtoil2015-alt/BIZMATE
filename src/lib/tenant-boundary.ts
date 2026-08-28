export interface TenantContext {
  organizationId: string;
  userId: string;
}

/**
 * Every business-data query should carry a TenantContext.
 * This boundary is intentionally provider-neutral so the application can use
 * Firebase today and evolve its persistence layer later without rewriting
 * authorization rules throughout the UI.
 */
export function assertTenantContext(context: TenantContext) {
  if (!context.organizationId || !context.userId) {
    throw new Error('A valid organization and user are required.');
  }
  return context;
}

export function sameOrganization(resourceOrganizationId: string, context: TenantContext) {
  return resourceOrganizationId === context.organizationId;
}
