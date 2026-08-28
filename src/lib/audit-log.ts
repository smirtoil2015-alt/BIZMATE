import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';

export interface AuditEventInput {
  organizationId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export async function recordAuditEvent(input: AuditEventInput) {
  const ref = await addDoc(collection(getFirebaseDb(), 'organizations', input.organizationId, 'audit'), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
