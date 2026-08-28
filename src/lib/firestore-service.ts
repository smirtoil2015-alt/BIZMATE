import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';

function orgCollection(orgId: string, name: string) {
  if (!orgId) throw new Error('Organization is required.');
  return collection(getFirebaseDb(), 'organizations', orgId, name);
}

export async function createOrgRecord(orgId: string, collectionName: string, data: Record<string, unknown>) {
  const ref = await addDoc(orgCollection(orgId, collectionName), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function listOrgRecords(orgId: string, collectionName: string) {
  const snapshot = await getDocs(orgCollection(orgId, collectionName));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getOrgRecord(orgId: string, collectionName: string, id: string) {
  const snapshot = await getDoc(doc(orgCollection(orgId, collectionName), id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function updateOrgRecord(orgId: string, collectionName: string, id: string, data: Record<string, unknown>) {
  await updateDoc(doc(orgCollection(orgId, collectionName), id), { ...data, updatedAt: serverTimestamp() });
}

export async function findOrgRecords(orgId: string, collectionName: string, field: string, value: string) {
  const snapshot = await getDocs(query(orgCollection(orgId, collectionName), where(field, '==', value)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}
