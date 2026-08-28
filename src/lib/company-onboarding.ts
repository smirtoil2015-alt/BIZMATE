import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { OrganizationSetup } from '@/lib/auth-model';

export async function createOrganizationForOwner(userId: string, setup: OrganizationSetup) {
  if (!userId) throw new Error('User is required.');
  if (!setup.companyName.trim()) throw new Error('Company name is required.');

  const db = getFirebaseDb();
  const organizationRef = doc(collection(db, 'organizations'));
  const memberRef = doc(db, 'organizations', organizationRef.id, 'members', userId);
  const profileRef = doc(db, 'users', userId);

  await setDoc(organizationRef, {
    name: setup.companyName.trim(),
    industry: setup.industry,
    country: setup.country,
    currency: setup.currency,
    timezone: setup.timezone,
    locale: setup.locale,
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(memberRef, {
    userId,
    role: 'owner',
    status: 'active',
    joinedAt: serverTimestamp(),
  });

  await setDoc(profileRef, {
    organizationId: organizationRef.id,
    role: 'owner',
    onboardingComplete: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return organizationRef.id;
}
