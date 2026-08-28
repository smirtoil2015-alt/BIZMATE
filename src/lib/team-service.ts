import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import type { UserRole } from '@/types/business';

export interface TeamMember {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  role: UserRole;
  status?: string;
  department?: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  status: 'pending' | 'accepted' | 'revoked';
}

function membersCollection(orgId: string) {
  return collection(getFirebaseDb(), 'organizations', orgId, 'members');
}

function invitationsCollection(orgId: string) {
  return collection(getFirebaseDb(), 'organizations', orgId, 'invitations');
}

export async function listTeamMembers(orgId: string) {
  const snapshot = await getDocs(membersCollection(orgId));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as TeamMember[];
}

export async function listTeamInvitations(orgId: string) {
  const snapshot = await getDocs(query(invitationsCollection(orgId), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as TeamInvitation[];
}

export async function inviteTeamMember(orgId: string, email: string, role: UserRole, inviterId: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('Enter a valid work email.');
  const existing = await getDocs(query(invitationsCollection(orgId), where('email', '==', normalizedEmail), where('status', '==', 'pending')));
  if (!existing.empty) throw new Error('This email already has a pending invitation.');

  const token = crypto.randomUUID();
  const ref = await addDoc(invitationsCollection(orgId), {
    email: normalizedEmail,
    role,
    token,
    status: 'pending',
    invitedBy: inviterId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, token };
}

export async function updateTeamMemberRole(orgId: string, userId: string, role: UserRole) {
  await updateDoc(doc(membersCollection(orgId), userId), { role, updatedAt: serverTimestamp() });
}

export async function revokeInvitation(orgId: string, invitationId: string) {
  await updateDoc(doc(invitationsCollection(orgId), invitationId), { status: 'revoked', updatedAt: serverTimestamp() });
}

export async function removeTeamMember(orgId: string, userId: string) {
  await deleteDoc(doc(membersCollection(orgId), userId));
}
