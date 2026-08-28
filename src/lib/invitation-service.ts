import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-db';
import { recordAuditEvent } from '@/lib/audit-log';

export async function getInvitationByToken(orgId: string, invitationId: string, token: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), 'organizations', orgId, 'invitations', invitationId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (data.token !== token || data.status !== 'pending') return null;
  return { id: snapshot.id, ...data } as { id: string; email: string; role: 'admin' | 'manager' | 'employee'; token: string; status: 'pending' | 'accepted' | 'revoked' };
}

export async function acceptInvitation(orgId: string, invitationId: string, token: string, userId: string, email: string) {
  if (!userId || !email) throw new Error('Sign in before accepting an invitation.');
  const db = getFirebaseDb();
  let role: 'admin' | 'manager' | 'employee' = 'employee';
  const normalizedEmail = email.trim().toLowerCase();
  await runTransaction(db, async (transaction) => {
    const invitationRef = doc(db, 'organizations', orgId, 'invitations', invitationId);
    const memberRef = doc(db, 'organizations', orgId, 'members', userId);
    const profileRef = doc(db, 'users', userId);
    const invitation = await transaction.get(invitationRef);
    if (!invitation.exists()) throw new Error('Invitation not found.');
    const data = invitation.data();
    if (data.token !== token || data.status !== 'pending') throw new Error('This invitation is no longer valid.');
    if (String(data.email).toLowerCase() !== normalizedEmail) throw new Error('This invitation belongs to a different email address.');
    role = data.role as 'admin' | 'manager' | 'employee';
    transaction.set(memberRef, {
      userId,
      email: normalizedEmail,
      role,
      status: 'active',
      acceptedInvitationId: invitationId,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    transaction.update(invitationRef, { status: 'accepted', acceptedBy: userId, acceptedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    transaction.set(profileRef, { organizationId: orgId, role, onboardingComplete: true, updatedAt: serverTimestamp() }, { merge: true });
  });
  await recordAuditEvent({ organizationId: orgId, actorId: userId, action: 'team.invitation_accepted', resource: 'invitation', resourceId: invitationId, metadata: { email: normalizedEmail, role } });
}
