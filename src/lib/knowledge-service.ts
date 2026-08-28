import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { KnowledgeDocument } from '@/lib/knowledge-model';

export async function createKnowledgeDocument(input: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(getFirebaseDb(), 'organizations', input.organizationId, 'documents'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
