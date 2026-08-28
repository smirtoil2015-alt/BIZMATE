import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { CustomerRecord } from '@/lib/crm-model';

export async function createCustomer(input: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(getFirebaseDb(), 'organizations', input.organizationId, 'customers'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
