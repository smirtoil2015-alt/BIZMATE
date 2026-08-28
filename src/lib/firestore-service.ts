import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';

export type OrgRecord = { id: string };

function orgCollection(orgId: string, name: string) {
  if (!orgId) throw new Error('Organization is required.');
  return collection(getFirebaseDb(), 'organizations', orgId, name);
}

export async function createOrgRecord(orgId: string, collectionName: string, data: Record<string, unknown>) {
  const ref = await addDoc(orgCollection(orgId, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listOrgRecords<T = unknown>(
  orgId: string,
  collectionName: string,
): Promise<(T & { id: string })[]> {
  const snapshot = await getDocs(orgCollection(orgId, collectionName));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as (T & { id: string })[];
}

export async function getOrgRecord<T = unknown>(
  orgId: string,
  collectionName: string,
  id: string,
): Promise<(T & { id: string }) | null> {
  const snapshot = await getDoc(doc(orgCollection(orgId, collectionName), id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T & { id: string }) : null;
}

export async function updateOrgRecord(orgId: string, collectionName: string, id: string, data: Record<string, unknown>) {
  await updateDoc(doc(orgCollection(orgId, collectionName), id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function findOrgRecords<T = unknown>(
  orgId: string,
  collectionName: string,
  field: string,
  value: string,
): Promise<(T & { id: string })[]> {
  const snapshot = await getDocs(query(orgCollection(orgId, collectionName), where(field, '==', value)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as (T & { id: string })[];
}
