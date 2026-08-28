'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { doc, getDoc } from 'firebase/firestore';
import { canAccessModule } from '@/lib/permissions';
import { inviteTeamMember, listTeamInvitations, listTeamMembers, revokeInvitation, updateTeamMemberRole, type TeamInvitation, type TeamMember } from '@/lib/team-service';
import type { UserRole } from '@/types/business';
import '../module.css';

const roles: UserRole[] = ['admin', 'manager', 'employee'];

export default function PeoplePage() {
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('employee');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setBusy(true);
      try {
        const profile = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
        const orgId = String(profile.data()?.organizationId ?? '');
        if (!orgId) throw new Error('Your account is not connected to a company workspace.');
        const member = await getDoc(doc(getFirebaseDb(), 'organizations', orgId, 'members', user.uid));
        const memberRole = String(member.data()?.role ?? 'employee') as UserRole;
        if (!canAccessModule(memberRole, 'people')) throw new Error('You do not have permission to manage people.');
        const [team, pending] = await Promise.all([listTeamMembers(orgId), listTeamInvitations(orgId)]);
        if (cancelled) return;
        setOrganizationId(orgId);
        setRole(memberRole);
        setMembers(team);
        setInvitations(pending);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load the team.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [user]);

  const active = useMemo(() => members.filter((m) => m.status !== 'inactive').length, [members]);
  const managers = useMemo(() => members.filter((m) => m.role === 'manager' || m.role === 'admin').length, [members]);
  const canManage = role === 'owner' || role === 'admin';

  async function submitInvite(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !user || !canManage) return;
    setError('');
    setNotice('');
    try {
      const result = await inviteTeamMember(organizationId, email, inviteRole, user.uid);
      const normalizedEmail = email.trim().toLowerCase();
      setInvitations((current) => [{ id: result.id, email: normalizedEmail, role: inviteRole, token: result.token, status: 'pending' }, ...current]);
      const origin = window.location.origin;
      setInviteLink(`${origin}/invite?org=${encodeURIComponent(organizationId)}&invitation=${encodeURIComponent(result.id)}&token=${encodeURIComponent(result.token)}`);
      setEmail('');
      setShowInvite(false);
      setNotice('Invitation created. Share the secure link below with your teammate.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create invitation.');
    }
  }

  async function changeRole(memberId: string, nextRole: UserRole) {
    if (!organizationId || !canManage || memberId === user?.uid) return;
    try {
      await updateTeamMemberRole(organizationId, memberId, nextRole);
      setMembers((current) => current.map((item) => item.id === memberId ? { ...item, role: nextRole } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update role.');
    }
  }

  async function revoke(id: string) {
    if (!organizationId || !canManage) return;
    try {
      await revokeInvitation(organizationId, id);
      setInvitations((current) => current.map((item) => item.id === id ? { ...item, status: 'revoked' } : item));
      if (invitations.find((item) => item.id === id)?.token && inviteLink.includes(id)) setInviteLink('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revoke invitation.');
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setNotice('Secure invitation link copied.');
  }

  if (busy) return <main className="module-page"><div className="module-empty"><span>◌</span><h1>Loading team workspace</h1><p>BIZMATE is loading company-scoped people and permissions.</p></div></main>;
  if (error && !organizationId) return <main className="module-page"><div className="module-empty"><span>!</span><h1>People unavailable</h1><p>{error}</p></div></main>;

  return <main className="module-page">
    <header><div><small>BIZMATE / PEOPLE</small><h1>People</h1><p>Manage your team, roles and organizational capacity.</p></div>{canManage && <button className="primary" onClick={() => setShowInvite(true)}>+ Invite member</button>}</header>
    {notice && <div className="module-notice">{notice}{inviteLink && <div className="invite-link-row"><code>{inviteLink}</code><button className="secondary" onClick={() => void copyLink()}>Copy link</button></div>}</div>}
    {error && <div className="module-error">{error}</div>}
    <section className="summary-row"><div><span>Team size</span><strong>{members.length}</strong></div><div><span>Active</span><strong>{active}</strong></div><div><span>Managers & admins</span><strong>{managers}</strong></div></section>
    <section className="data-card"><div className="data-head"><h2>Team directory</h2><span className="role-badge">Your role: {role}</span></div>
      <div className="table"><div className="tr th"><span>Member</span><span>Role</span><span>Status</span><span>Access</span></div>
        {members.map((m) => <div className="tr" key={m.id}><span><b>{m.name || (m.userId ? `Member ${m.userId.slice(0, 8)}` : 'Workspace member')}</b><small>{m.email || 'Email hidden until profile sync'}</small></span><span>{canManage && m.id !== user?.uid ? <select value={m.role} onChange={(e) => void changeRole(m.id, e.target.value as UserRole)}><option value="admin">admin</option><option value="manager">manager</option><option value="employee">employee</option></select> : m.role}</span><span><em className={`status ${m.status || 'active'}`}>{m.status || 'active'}</em></span><span>{m.role === 'owner' ? 'Full control' : m.role === 'admin' ? 'Administrative' : m.role === 'manager' ? 'Operational' : 'Standard'}</span></div>)}
        {!members.length && <div className="module-empty compact"><h3>No team members yet</h3><p>Invite your first colleague to start building the company workspace.</p></div>}
      </div>
    </section>
    {canManage && <section className="data-card"><div className="data-head"><h2>Pending invitations</h2><span>{invitations.filter((i) => i.status === 'pending').length} pending</span></div><div className="table"><div className="tr th"><span>Email</span><span>Role</span><span>Status</span><span>Action</span></div>{invitations.map((invite) => <div className="tr" key={invite.id}><span><b>{invite.email}</b><small>Secure invitation ready</small></span><span>{invite.role}</span><span><em className={`status ${invite.status}`}>{invite.status}</em></span><span>{invite.status === 'pending' ? <button className="secondary" onClick={() => void revoke(invite.id)}>Revoke</button> : '—'}</span></div>)}{!invitations.length && <div className="module-empty compact"><p>No invitations yet.</p></div>}</div></section>}
    {showInvite && <div className="module-overlay" onClick={() => setShowInvite(false)}><form className="module-modal" onSubmit={submitInvite} onClick={(e) => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowInvite(false)}>×</button><small>BIZMATE / INVITE</small><h2>Invite a teammate</h2><p>Create a company-scoped invitation and assign the access level before they join.</p><label>Work email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" required /></label><label>Role<select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)}>{roles.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><button className="primary" type="submit">Create invitation →</button><small>The secure link can be copied after creation. Connect an email provider later for automatic delivery.</small></form></div>}
  </main>;
}
