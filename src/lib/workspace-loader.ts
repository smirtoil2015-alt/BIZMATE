import { collection, getDocs, limit, query } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import { loadOrganization } from '@/lib/company-workspace';
import { getOrganizationRole } from '@/lib/organization-access';
import { buildDashboardModel, type DashboardModel } from '@/lib/dashboard-model';
import type { BusinessInsight, Customer, Member, Project } from '@/types/business';

async function readCollection<T extends object>(organizationId: string, name: string, count = 50): Promise<T[]> {
  const snapshot = await getDocs(query(collection(getFirebaseDb(), 'organizations', organizationId, name), limit(count)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as T));
}

export async function loadWorkspace(userId: string, organizationId: string): Promise<{ organization: Awaited<ReturnType<typeof loadOrganization>>; role: Awaited<ReturnType<typeof getOrganizationRole>>; dashboard: DashboardModel }> {
  const [organization, role, customers, projects, insights, members] = await Promise.all([
    loadOrganization(organizationId),
    getOrganizationRole(organizationId, userId),
    readCollection<Customer>(organizationId, 'customers'),
    readCollection<Project>(organizationId, 'projects'),
    readCollection<BusinessInsight>(organizationId, 'insights'),
    readCollection<Member>(organizationId, 'members'),
  ]);

  if (!organization || !role) throw new Error('You do not have access to this company workspace.');
  return { organization, role, dashboard: buildDashboardModel({ customers, projects, insights, members }) };
}
