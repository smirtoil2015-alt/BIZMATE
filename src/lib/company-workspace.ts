import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { Organization } from '@/types/business';

export async function loadOrganization(organizationId: string): Promise<Organization | null> {
  if (!organizationId) return null;
  const snapshot = await getDoc(doc(getFirebaseDb(), 'organizations', organizationId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Organization;
}
