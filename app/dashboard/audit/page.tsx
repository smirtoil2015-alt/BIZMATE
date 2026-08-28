'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { listAuditEvents, type AuditEvent } from '@/lib/audit-log';
import '../module.css';

function label(action: string) {
  return action.replaceAll('.', ' · ').replaceAll('_', ' ');
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      try {
        const profile = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
        const orgId = String(profile.data()?.organizationId ?? '');
        if (!orgId) throw new Error('Your account is not connected to a company workspace.');
        const rows = await listAuditEvents(orgId);
        if (!cancelled) setEvents(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load the audit log.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [user]);

  if (busy) return <main className="module-page"><div className="module-empty"><span>◌</span><h1>Loading audit log</h1><p>BIZMATE is loading company activity.</p></div></main>;
  if (error) return <main className="module-page"><div className="module-empty"><span>!</span><h1>Audit log unavailable</h1><p>{error}</p></div></main>;

  return <main className="module-page">
    <header><div><small>BIZMATE / AUDIT</small><h1>Audit Log</h1><p>A durable record of important workspace actions and role changes.</p></div></header>
    <section className="data-card"><div className="data-head"><h2>Recent activity</h2><span>{events.length} recorded events</span></div>
      <div className="table"><div className="tr th"><span>Action</span><span>Resource</span><span>Actor</span><span>Time</span></div>
        {events.map((event) => <div className="tr" key={event.id}><span><b>{label(event.action)}</b><small>{event.metadata ? JSON.stringify(event.metadata) : 'No extra details'}</small></span><span>{event.resource}{event.resourceId ? ` · ${event.resourceId.slice(0, 10)}` : ''}</span><span>{event.actorId === user?.uid ? 'You' : event.actorId.slice(0, 10)}</span><span>{formatDate(event.createdAt)}</span></div>)}
        {!events.length && <div className="module-empty compact"><h3>No audit events yet</h3><p>Team invitations, role changes, revocations and accepted invitations will appear here.</p></div>}
      </div>
    </section>
  </main>;
}

function formatDate(value: unknown) {
  const raw = value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function' ? (value as { toDate: () => Date }).toDate() : value instanceof Date ? value : null;
  return raw ? raw.toLocaleString() : 'Just now';
}
