import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { Task } from '@/lib/task-model';

export async function createTask(input: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
  if (!input.title.trim()) throw new Error('Task title is required.');
  const ref = await addDoc(collection(getFirebaseDb(), 'organizations', input.organizationId, 'tasks'), {
    ...input,
    title: input.title.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
