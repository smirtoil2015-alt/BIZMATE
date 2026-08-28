'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { canResolveApproval, type ApprovalRequest, type ApprovalStatus } from '@/lib/approval-center';
import { recordAuditEvent } from '@/lib/audit-log';
import '../module.css';

function approvalsCollection(orgId: string) {
  return collection(getFirebaseDb(), 'organizations', orgId, 'approvals');
}

type ApprovalDisplay = ApprovalRequest;

export default function ActionCenterPage() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState('employee');
  const [items, setItems] = useState<ApprovalDisplay[]>([]);
  const [company, setCompany] = useState('Your company');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    let cancelled = false;
    let unsubscribe = () => {};

    async function connect() {
      setBusy(true);
      try {
        const db = getFirebaseDb();
        const profile = await getDoc(doc(db, 'users', currentUser.uid));
        const orgId = String(profile.data()?.organizationId ?? '');
        if (!orgId) throw new Error('Your account is not connected to a company workspace.');
        const member = await getDoc(doc(db, 'organizations', orgId, 'members', currentUser.uid));
        const org = await getDoc(doc(db, 'organizations', orgId));
        if (cancelled) return;
        setRole(String(member.data()?.role ?? 'employee'));
        setCompany(String(org.data()?.name ?? 'Your company'));

        unsubscribe = onSnapshot(
          query(approvalsCollection(orgId), orderBy('createdAt', 'desc')),
          (snapshot) => {
            if (cancelled) return;
            setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as ApprovalDisplay[]);
            setBusy(false);
            setError('');
          },
          (err) => {
            if (!cancelled) {
              setError(err instanceof Error ? err.message : 'Unable to live-update the action center.');
              setBusy(false);
            }
          },
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load the action center.');
          setBusy(false);
        }
      }
    }

    void connect();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  const pending = useMemo(() => items.filter((item) => item.status === 'pending'), [items]);
  const resolved = useMemo(() => items.filter((item) => item.status !== 'pending'), [items]);

  async function resolve(id: string, status: Extract<ApprovalStatus, 'approved' | 'rejected'>) {
    if (!user) return;
    const request = items.find((item) => item.id === id);
    if (!request || !canResolveApproval(role, request)) return;
    try {
      const currentUser = user;
      const db = getFirebaseDb();
      const profile = await getDoc(doc(db, 'users', currentUser.uid));
      const orgId = String(profile.data()?.organizationId ?? '');
      if (!orgId) throw new Error('Your account is not connected to a company workspace.');
      await updateDoc(doc(approvalsCollection(orgId), id), {
        status,
        resolvedBy: currentUser.uid,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await recordAuditEvent({
        organizationId: orgId,
        actorId: currentUser.uid,
        action: status === 'approved' ? 'approval.approved' : 'approval.rejected',
        resource: 'approval',
        resourceId: id,
        metadata: {
          requestedBy: request.requestedBy,
          approverRole: request.approverRole,
          requestedAction: request.action,
          summary: request.summary,
          source: request.source ?? null,
          metric: request.metric ?? null,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resolve this approval.');
    }
  }

  if (busy) return <main className="module-page"><div className="module-empty"><span>◌</span><h1>Loading action center</h1><p>BIZMATE is preparing company approvals and next actions.</p></div></main>;
  if (error && !user) return <main className="module-page"><div className="module-empty"><span>!</span><h1>Action center unavailable</h1><p>{error}</p></div></main>;

  return <main className="module-page">
    <header><div><small>BIZMATE / ACTION CENTER</small><h1>Action Center</h1><p>Turn important signals into accountable actions for {company}. Sensitive operations remain approval-first.</p></div><span className="status processing">LIVE</span></header>
    {error && <div className="module-error">{error}</div>}
    <section className="summary-row"><div><span>Pending</span><strong>{pending.length}</strong></div><div><span>Resolved</span><strong>{resolved.length}</strong></div><div><span>Your role</span><strong>{role}</strong></div><div><span>Workspace</span><strong>{company}</strong></div></section>
    <section className="data-card"><div className="data-head"><h2>Pending approvals</h2><span>{pending.length ? 'Needs a decision' : 'Nothing waiting'}</span></div>
      <div className="table"><div className="tr th"><span>Action</span><span>Requested by</span><span>Approver</span><span>Decision</span></div>
        {pending.map((item) => <div className="tr" key={item.id}><span><b>{item.action.replaceAll('_', ' ')}</b><small>{item.summary}</small>{item.source && <small>Source: {item.source}{item.metric ? ` · ${item.metric}` : ''}</small>}</span><span>{item.requestedBy === user?.uid ? 'You' : item.requestedBy.slice(0, 10)}</span><span>{item.approverRole}</span><span>{canResolveApproval(role, item) ? <div style={{display:'flex',gap:6}}><button className="secondary" onClick={() => void resolve(item.id, 'approved')}>Approve</button><button className="secondary" onClick={() => void resolve(item.id, 'rejected')}>Reject</button></div> : 'Awaiting approver'}</span></div>)}
        {!pending.length && <div className="module-empty compact"><h3>No pending approvals</h3><p>When an approved-required action is requested, it will appear here for the correct role.</p></div>}
      </div>
    </section>
    <section className="data-card"><div className="data-head"><h2>Recent decisions</h2><span>{resolved.length} resolved</span></div>
      <div className="table"><div className="tr th"><span>Action</span><span>Status</span><span>Approver</span><span>Time</span></div>
        {resolved.slice(0, 20).map((item) => <div className="tr" key={item.id}><span><b>{item.action.replaceAll('_', ' ')}</b><small>{item.summary}</small>{item.source && <small>Source: {item.source}{item.metric ? ` · ${item.metric}` : ''}</small>}</span><span><em className={`status ${item.status === 'approved' ? 'active' : item.status === 'rejected' ? 'at-risk' : ''}`}>{item.status}</em></span><span>{item.approverRole}</span><span>{formatDate(item.createdAt)}</span></div>)}
        {!resolved.length && <div className="module-empty compact"><p>No decisions recorded yet.</p></div>}
      </div>
    </section>
    <section className="data-card"><div className="data-head"><h2>Execution policy</h2></div><p className="brief">BIZMATE may recommend and queue an action, but financial changes, external communications, access changes and other sensitive operations must receive explicit approval before execution.</p></section>
  </main>;
}

function formatDate(value: unknown) {
  const raw = value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function' ? (value as { toDate: () => Date }).toDate() : value instanceof Date ? value : null;
  return raw ? raw.toLocaleString() : 'Just now';
}

// Build verification: Action Center displays decision history using ApprovalRequest.createdAt.
