'use client';

import { FormEvent, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { createOrgRecord } from '@/lib/firestore-service';

export default function NewKnowledgePage() {
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('guide');
  const [tags, setTags] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setBusy(true); setError('');
    try {
      const profile = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
      const orgId = String(profile.data()?.organizationId ?? '');
      if (!orgId) throw new Error('Your account is not connected to a company workspace.');
      await createOrgRecord(orgId, 'knowledge', {
        organizationId: orgId,
        title: title.trim(),
        type,
        status: 'ready',
        ownerId: user.uid,
        tags: tags.split(',').map(item => item.trim()).filter(Boolean),
      });
      window.location.href = '/dashboard/knowledge';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add this document.');
    } finally { setBusy(false); }
  }

  if (!user) return <main className="module-page"><div className="module-empty"><span>🔐</span><h1>Sign in required</h1><p>Sign in before adding company knowledge.</p><a className="primary" href="/login">Sign in →</a></div></main>;

  return <main className="module-page"><header><div><small>BIZMATE / KNOWLEDGE / NEW</small><h1>Add document</h1><p>Add a company knowledge record that can be searched and used as business context.</p></div><a className="secondary-link" href="/dashboard/knowledge">← Back to knowledge</a></header><section className="data-card" style={{maxWidth:720}}><form onSubmit={submit} style={{display:'grid',gap:16}}><label>Document title<input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Company Operations Handbook" /></label><label>Type<select value={type} onChange={e=>setType(e.target.value)}><option value="guide">Guide</option><option value="policy">Policy</option><option value="contract">Contract</option><option value="report">Report</option><option value="other">Other</option></select></label><label>Tags<input value={tags} onChange={e=>setTags(e.target.value)} placeholder="operations, team, sales" /></label>{error && <div className="module-error">{error}</div>}<div style={{display:'flex',gap:10}}><a className="secondary-link" href="/dashboard/knowledge">Cancel</a><button className="primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save document →'}</button></div></form></section></main>;
}
