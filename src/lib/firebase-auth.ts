import { getAuth, type Auth } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase-config';

let auth: Auth | undefined;

export function getFirebaseAuth() {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}
