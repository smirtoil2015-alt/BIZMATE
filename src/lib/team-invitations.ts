import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { UserRole } from '@/types/business';

export interface TeamInvitation {
  organizationId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'revoked';
}

export async function createTeamInvitation(input: Omit<TeamInvitation, 'status'>) {
  if (!input.email.trim()) throw new Error('Email is required.');
  const ref = await addDoc(collection(getFirebaseDb(), 'organizations', input.organizationId, 'invitations'), {
    ...input,
    email: input.email.trim().toLowerCase(),
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
