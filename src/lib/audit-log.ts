import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';

export interface AuditEventInput {
  organizationId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEvent extends AuditEventInput {
  id: string;
  createdAt?: unknown;
}

function auditCollection(organizationId: string) {
  return collection(getFirebaseDb(), 'organizations', organizationId, 'audit');
}

export async function recordAuditEvent(input: AuditEventInput) {
  const ref = await addDoc(auditCollection(input.organizationId), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listAuditEvents(organizationId: string, count = 50) {
  const snapshot = await getDocs(query(auditCollection(organizationId), orderBy('createdAt', 'desc'), limit(count)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as AuditEvent[];
}
