'use client';

import '../module.css';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { doc, getDoc } from 'firebase/firestore';
import { createOrgRecord, listOrgRecords } from '@/lib/firestore-service';
import type { Customer } from '@/types/business';

type NewCustomer = { name: string; company: string; email: string; status: Customer['status']; value: string };

const emptyForm: NewCustomer = { name: '', company: '', email: '', status: 'lead', value: '' };

export default function CustomersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState('');
  const [customers, setCustomers] = useState<(Customer & { id: string })[]>([]);
  const [form, setForm] = useState<NewCustomer>(emptyForm);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setBusy(true);
      setError('');
      try {
        const profile = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
        const orgId = String(profile.data()?.organizationId ?? '');
        if (!orgId) throw new Error('Your account is not connected to a company workspace.');
        const rows = await listOrgRecords<Customer>(orgId, 'customers');
        if (!cancelled) {
          setOrganizationId(orgId);
          setCustomers(rows);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load customers.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => `${c.name} ${c.company ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q));
  }, [customers, search]);

  const pipeline = useMemo(() => customers.reduce((sum, c) => sum + Number(c.value ?? 0), 0), [customers]);
  const active = customers.filter((c) => c.status === 'active').length;
  const leads = customers.filter((c) => c.status === 'lead').length;

  async function addCustomer(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !user || !form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const value = Number(form.value || 0);
      const data: Omit<Customer, 'id'> = {
        organizationId,
        name: form.name.trim(),
        company: form.company.trim() || undefined,
        email: form.email.trim() || undefined,
        status: form.status,
        value: Number.isFinite(value) ? value : 0,
        lastContactAt: new Date().toISOString().slice(0, 10),
      };
      const id = await createOrgRecord(organizationId, 'customers', data as Record<string, unknown>);
      setCustomers((current) => [{ id, ...data }, ...current]);
      setForm(emptyForm);
      setShowNew(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create customer.');
    } finally {
      setSaving(false);
    }
  }

  if (busy) return <main className="module-page"><div className="module-empty"><span>◌</span><h1>Loading customers</h1><p>BIZMATE is loading your company data from Firebase.</p></div></main>;
  if (error && !organizationId) return <main className="module-page"><div className="module-empty"><span>!</span><h1>Customers unavailable</h1><p>{error}</p></div></main>;

  return <main className="module-page">
    <header><div><small>BIZMATE / CUSTOMERS</small><h1>Customers</h1><p>Real customer records from your company workspace.</p></div><button className="primary" onClick={() => setShowNew(true)}>+ New customer</button></header>
    {error && <div className="module-error">{error}</div>}
    <section className="module-grid"><div className="summary-card"><span>Active</span><strong>{active}</strong><small>customers</small></div><div className="summary-card"><span>Pipeline value</span><strong>${pipeline.toLocaleString()}</strong><small>tracked value</small></div><div className="summary-card"><span>Follow-up</span><strong>{leads}</strong><small>leads</small></div></section>
    <section className="data-card"><div className="data-head"><h2>Customer portfolio</h2><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." /></div><div className="table"><div className="tr th"><span>Customer</span><span>Status</span><span>Value</span><span>Last contact</span></div>{filtered.map((c) => <div className="tr" key={c.id}><span><b>{c.name}</b><small>{c.company || c.email || 'No company details'}</small></span><span><em className={`status ${c.status}`}>{c.status}</em></span><span>${Number(c.value ?? 0).toLocaleString()}</span><span>{c.lastContactAt ?? '—'}</span></div>)}{!filtered.length && <div className="module-empty compact"><h3>No customers yet</h3><p>Create the first real customer record for this company.</p></div>}</div></section>
    {showNew && <div className="module-overlay" onClick={() => !saving && setShowNew(false)}><form className="module-modal" onSubmit={addCustomer} onClick={(e) => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => !saving && setShowNew(false)}>×</button><small>BIZMATE / CUSTOMER</small><h2>New customer</h2><p>This record will be stored in your company workspace.</p><label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" /></label><label>Company<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" /></label><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="customer@company.com" /></label><label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Customer['status'] })}><option value="lead">lead</option><option value="active">active</option><option value="inactive">inactive</option></select></label><label>Value<input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0" /></label><button className="primary" disabled={saving} type="submit">{saving ? 'Saving...' : 'Create customer →'}</button></form></div>}
  </main>;
}
