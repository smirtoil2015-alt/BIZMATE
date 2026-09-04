import { createUserWithEmailAndPassword, signInAnonymously, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-auth';

export async function registerWithEmail(email: string, password: string) {
  if (!email.trim() || password.length < 8) throw new Error('A valid email and a password of at least 8 characters are required.');
  return createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export async function loginWithEmail(email: string, password: string) {
  if (!email.trim() || !password) throw new Error('Email and password are required.');
  return signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export async function ensureAnonymousSession(): Promise<User> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export function logout() {
  return signOut(getFirebaseAuth());
}
