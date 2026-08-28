import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { Notification } from '@/lib/notifications-model';

export async function createNotification(input: Omit<Notification, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(getFirebaseDb(), 'organizations', input.organizationId, 'notifications'), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
