'use client';

import { Suspense, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useSearchParams } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { acceptInvitation, getInvitationByToken } from '@/lib/invitation-service';

function InviteContent() {
  const search = useSearchParams();
  const orgId = search.get('org') || '';
  const invitationId = search.get('invitation') || '';
  const token = search.get('token') || '';
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<{ email: string; role: 'admin' | 'manager' | 'employee' } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!orgId || !invitationId || !token || !user) {
        setLoading(false);
        return;
      }
      try {
        const result = await getInvitationByToken(orgId, invitationId, token);
        if (!result) throw new Error('This invitation is invalid, expired, revoked, or no longer pending.');
        if (!cancelled) setInvitation({ email: result.email, role: result.role });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load this invitation.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [orgId, invitationId, token, user]);

  async function accept() {
    if (!user || !invitation) return;
    setAccepting(true);
    setError('');
    try {
      await acceptInvitation(orgId, invitationId, token, user.uid, user.email || '');
      window.location.href = `/dashboard?org=${orgId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept the invitation.');
      setAccepting(false);
    }
  }

  return <main className="invite-page"><section className="invite-card"><a href="/" className="invite-brand"><span>B</span>BIZMATE</a><p className="invite-kicker">TEAM INVITATION</p>{loading ? <><h1>Checking your invitation…</h1><p>Verifying the company invitation and your signed-in account.</p></> : !user ? <><h1>Sign in to continue.</h1><p>Use the email address that received this invitation, then return to this page.</p><a className="invite-button" href="/login">Go to sign in →</a></> : error ? <><h1>Invitation unavailable.</h1><p>{error}</p><a className="invite-secondary" href="/">Return to BIZMATE</a></> : invitation ? <><h1>You’re invited to BIZMATE.</h1><p><b>{invitation.email}</b> is invited as <b>{invitation.role}</b>. Accepting will connect your account to this company workspace.</p><button className="invite-button" disabled={accepting} onClick={() => void accept()}>{accepting ? 'Joining workspace…' : 'Accept invitation →'}</button><small>Signed in as {user.email}</small></> : null}<style jsx>{`.invite-page{min-height:100vh;display:grid;place-items:center;padding:28px;background:radial-gradient(circle at 50% 15%,rgba(66,217,255,.11),transparent 35%),#07111f;color:#eef6ff;font-family:Inter,system-ui,sans-serif}.invite-card{width:min(560px,100%);padding:42px;border:1px solid #1d344b;border-radius:26px;background:rgba(11,26,43,.94);box-shadow:0 30px 90px rgba(0,0,0,.38)}.invite-brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-size:21px;font-weight:900}.invite-brand span{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,#42d9ff,#9d8cff);color:#07111f}.invite-kicker{margin:30px 0 8px;color:#42d9ff;font-size:9px;letter-spacing:.18em;font-weight:900}.invite-card h1{font-size:42px;line-height:1.03;letter-spacing:-.05em;margin:0 0 12px}.invite-card p{color:#8fa2b5;line-height:1.7;font-size:14px;margin:0 0 26px}.invite-card small{display:block;color:#61778d;margin-top:16px;font-size:11px}.invite-button,.invite-secondary{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:12px;padding:14px 18px;font-weight:850;text-decoration:none;cursor:pointer}.invite-button{background:linear-gradient(135deg,#42d9ff,#6e9cff);color:#07111f}.invite-button:disabled{opacity:.55;cursor:not-allowed}.invite-secondary{background:#102235;border:1px solid #1d344b;color:#b8c8d7}`}</style></section></main>;
}

export default function InvitePage() {
  return <Suspense fallback={<main className="invite-page"><section className="invite-card"><a href="/" className="invite-brand"><span>B</span>BIZMATE</a><p className="invite-kicker">TEAM INVITATION</p><h1>Checking your invitation…</h1><p>Preparing your secure invitation page.</p></section></main>}><InviteContent /></Suspense>;
}
