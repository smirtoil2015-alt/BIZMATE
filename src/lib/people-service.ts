import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { UserRole } from '@/types/business';

export interface CreateMemberInput {
  organizationId: string;
  userId: string;
  role: UserRole;
  department?: string;
  status?: 'active' | 'invited' | 'suspended';
}

export async function addOrganizationMember(input: CreateMemberInput) {
  const ref = await addDoc(collection(getFirebaseDb(), 'organizations', input.organizationId, 'members'), {
    userId: input.userId,
    role: input.role,
    department: input.department ?? null,
    status: input.status ?? 'active',
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
