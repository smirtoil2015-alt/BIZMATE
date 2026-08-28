import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { FinancialTransaction } from '@/lib/finance-model';

export async function createFinancialTransaction(input: Omit<FinancialTransaction, 'id'>) {
  const ref = await addDoc(collection(getFirebaseDb(), 'organizations', input.organizationId, 'transactions'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
