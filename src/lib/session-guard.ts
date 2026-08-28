import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-auth';

export function watchAuthSession(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function requireAuthenticatedUser(user: User | null): User {
  if (!user) throw new Error('Authentication required.');
  return user;
}
