import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { UserRole } from '@/types/business';

export async function getOrganizationRole(organizationId: string, userId: string): Promise<UserRole | null> {
  if (!organizationId || !userId) return null;
  const snapshot = await getDoc(doc(getFirebaseDb(), 'organizations', organizationId, 'members', userId));
  if (!snapshot.exists()) return null;
  return (snapshot.data().role ?? null) as UserRole | null;
}
