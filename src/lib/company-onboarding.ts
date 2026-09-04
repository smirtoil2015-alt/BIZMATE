import { collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
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

export async function ensureGuestWorkspace(userId: string) {
  if (!userId) throw new Error('User is required.');
  const db = getFirebaseDb();
  const profileRef = doc(db, 'users', userId);
  const profileSnap = await getDoc(profileRef);
  const existingOrganizationId = String(profileSnap.data()?.organizationId ?? '');
  if (existingOrganizationId) return existingOrganizationId;

  const organizationId = `guest_${userId}`;
  const organizationRef = doc(db, 'organizations', organizationId);
  const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
  const now = serverTimestamp();

  await setDoc(organizationRef, {
    name: 'BIZMATE Workspace',
    industry: 'General Business',
    country: '',
    currency: 'USD',
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : 'UTC',
    locale: typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US',
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  await setDoc(memberRef, {
    userId,
    role: 'owner',
    status: 'active',
    joinedAt: now,
  }, { merge: true });

  await setDoc(profileRef, {
    organizationId,
    role: 'owner',
    onboardingComplete: true,
    updatedAt: now,
  }, { merge: true });

  return organizationId;
}
