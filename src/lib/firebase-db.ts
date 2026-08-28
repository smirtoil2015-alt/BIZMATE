import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase-config';

let db: Firestore | undefined;

export function getFirebaseDb() {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}
