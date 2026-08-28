import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { Project } from '@/types/business';

export async function createProject(input: Omit<Project, 'id'>) {
  const ref = await addDoc(collection(getFirebaseDb(), 'organizations', input.organizationId, 'projects'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
