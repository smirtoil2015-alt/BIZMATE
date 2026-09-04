'use client';

import '../module.css';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { doc, getDoc } from 'firebase/firestore';
import { createOrgRecord, listOrgRecords } from '@/lib/firestore-service';
import type { Project } from '@/types/business';

type NewProject = { name: string; status: Project['status']; progress: string; dueDate: string; ownerId: string };
const emptyForm: NewProject = { name: '', status: 'planning', progress: '0', dueDate: '', ownerId: '' };

export default function ProjectsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState('');
  const [projects, setProjects] = useState<(Project & { id: string })[]>([]);
  const [form, setForm] = useState<NewProject>(emptyForm);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setBusy(true); setError('');
      try {
        const profile = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
        const orgId = String(profile.data()?.organizationId ?? '');
        if (!orgId) throw new Error('Your account is not connected to a company workspace.');
        const rows = await listOrgRecords<Project>(orgId, 'projects');
        if (!cancelled) { setOrganizationId(orgId); setProjects(rows); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load projects.');
      } finally { if (!cancelled) setBusy(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [user]);

  const active = projects.filter((p) => p.status === 'active').length;
  const atRisk = projects.filter((p) => p.status === 'at-risk').length;
  const average = projects.length ? Math.round(projects.reduce((sum, p) => sum + Number(p.progress || 0), 0) / projects.length) : 0;

  async function addProject(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !form.name.trim()) return;
    setSaving(true); setError('');
    try {
      const progress = Math.max(0, Math.min(100, Number(form.progress || 0)));
      const data: Omit<Project, 'id'> = { organizationId, name: form.name.trim(), status: form.status, progress: Number.isFinite(progress) ? progress : 0, dueDate: form.dueDate || undefined, ownerId: form.ownerId.trim() || undefined };
      const id = await createOrgRecord(organizationId, 'projects', data as Record<string, unknown>);
      setProjects((current) => [{ id, ...data }, ...current]); setForm(emptyForm); setShowNew(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create project.'); }
    finally { setSaving(false); }
  }

  if (busy) return <main className="module-page"><div className="module-empty"><span>◌</span><h1>Loading projects</h1><p>BIZMATE is loading your company projects from Firebase.</p></div></main>;
  if (error && !organizationId) return <main className="module-page"><div className="module-empty"><span>!</span><h1>Projects unavailable</h1><p>{error}</p></div></main>;

  return <main className="module-page">
    <header><div><small>BIZMATE / PROJECTS</small><h1>Projects</h1><p>Real project delivery data from your company workspace.</p></div><button className="primary" onClick={() => setShowNew(true)}>+ New project</button></header>
    {error && <div className="module-error">{error}</div>}
    <section className="summary-row"><div><span>Active</span><strong>{active}</strong></div><div><span>At risk</span><strong>{atRisk}</strong></div><div><span>Avg. progress</span><strong>{average}%</strong></div></section>
    <section className="project-list">{projects.map((p) => <article className="project-card" key={p.id}><div className="project-top"><div><small>{p.status.toUpperCase()}</small><h2>{p.name}</h2><p>{p.dueDate ? `Due ${p.dueDate}` : 'No deadline set'}</p></div><strong>{p.progress}%</strong></div><div className="progress"><span style={{ width: `${Math.max(0, Math.min(100, p.progress))}%` }} /></div><footer><span>Owner: {p.ownerId || 'Unassigned'}</span><span>Project record</span></footer></article>)}{!projects.length && <div className="module-empty compact"><h3>No projects yet</h3><p>Create the first real project for this company.</p></div>}</section>
    {showNew && <div className="module-overlay" onClick={() => !saving && setShowNew(false)}><form className="module-modal" onSubmit={addProject} onClick={(e) => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => !saving && setShowNew(false)}>×</button><small>BIZMATE / PROJECT</small><h2>New project</h2><p>This project will be stored in your company workspace.</p><label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Project name" /></label><label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Project['status'] })}><option value="planning">planning</option><option value="active">active</option><option value="at-risk">at-risk</option><option value="completed">completed</option></select></label><label>Progress %<input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} /></label><label>Due date<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label><label>Owner ID<input value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} placeholder="Optional member ID" /></label><button className="primary" disabled={saving} type="submit">{saving ? 'Saving...' : 'Create project →'}</button></form></div>}
  </main>;
}
