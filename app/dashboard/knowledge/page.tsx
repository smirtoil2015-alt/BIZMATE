'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { listOrgRecords } from '@/lib/firestore-service';
import type { KnowledgeDocument } from '@/lib/knowledge-model';

export default function KnowledgePage() {
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const profile = await getDoc(doc(getFirebaseDb(), 'users', user!.uid));
        const orgId = String(profile.data()?.organizationId ?? '');
        if (!orgId) throw new Error('Your account is not connected to a company workspace.');
        const rows = await listOrgRecords<KnowledgeDocument>(orgId, 'knowledge');
        if (!cancelled) setDocuments(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load company knowledge.');
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return documents;
    return documents.filter(d => `${d.title} ${d.type} ${d.tags.join(' ')}`.toLowerCase().includes(value));
  }, [documents, search]);

  if (loading) return <main className="module-page"><div className="module-empty"><span>◌</span><h1>Loading knowledge</h1><p>BIZMATE is opening your company memory.</p></div></main>;
  if (!user) return <main className="module-page"><div className="module-empty"><span>🔐</span><h1>Sign in required</h1><p>Sign in to access private company knowledge.</p><a className="primary" href="/login">Sign in →</a></div></main>;

  return <main className="module-page"><header><div><small>BIZMATE / KNOWLEDGE</small><h1>Knowledge</h1><p>Build a searchable company memory for people, decisions and AI assistance.</p></div><a className="primary" href="/dashboard/knowledge/new">+ Add document</a></header>{error && <div className="module-error">{error}</div>}<section className="summary-row"><div><span>Documents</span><strong>{documents.length}</strong></div><div><span>Ready for AI</span><strong>{documents.filter(d=>d.status==='ready').length}</strong></div><div><span>Tags</span><strong>{new Set(documents.flatMap(d=>d.tags)).size}</strong></div></section><section className="data-card"><div className="data-head"><h2>Company knowledge</h2><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents..."/></div><div className="table"><div className="tr th"><span>Document</span><span>Type</span><span>Status</span><span>Updated</span></div>{filtered.map(d=><div className="tr" key={d.id}><span><b>{d.title}</b><small>{d.tags.join(' · ')}</small></span><span>{d.type}</span><span><em className={`status ${d.status==='ready'?'active':'invited'}`}>{d.status}</em></span><span>{d.updatedAt}</span></div>)}{!filtered.length && <div className="module-empty compact"><h3>No documents yet</h3><p>Add your first company document to start building the knowledge base.</p><a className="primary" href="/dashboard/knowledge/new">Add document →</a></div>}</div></section></main>;
}
