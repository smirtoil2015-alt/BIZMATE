'use client';

import '../module.css';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { createOrgRecord, listOrgRecords } from '@/lib/firestore-service';

type Transaction = { id: string; organizationId: string; type: 'income' | 'expense'; amount: number; currency: string; category: string; description: string; occurredAt: string; status: 'posted' | 'pending' };
type FormState = { type: Transaction['type']; amount: string; category: string; description: string; occurredAt: string };
const emptyForm: FormState = { type: 'income', amount: '', category: 'Sales', description: '', occurredAt: new Date().toISOString().slice(0, 10) };

export default function FinancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [orgId, setOrgId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
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
        const id = String(profile.data()?.organizationId ?? '');
        if (!id) throw new Error('Your account is not connected to a company workspace.');
        const org = await getDoc(doc(getFirebaseDb(), 'organizations', id));
        const rows = await listOrgRecords<Transaction>(id, 'transactions');
        if (!cancelled) { setOrgId(id); setCurrency(String(org.data()?.currency ?? 'USD')); setTransactions(rows.sort((a,b) => String(b.occurredAt).localeCompare(String(a.occurredAt)))); }
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load finance data.'); }
      finally { if (!cancelled) setBusy(false); }
    }
    void load(); return () => { cancelled = true; };
  }, [user]);

  const income = useMemo(() => transactions.filter(t => t.type === 'income' && t.status === 'posted').reduce((s,t) => s + Number(t.amount || 0), 0), [transactions]);
  const expenses = useMemo(() => transactions.filter(t => t.type === 'expense' && t.status === 'posted').reduce((s,t) => s + Number(t.amount || 0), 0), [transactions]);
  const net = income - expenses;

  async function addTransaction(event: FormEvent) {
    event.preventDefault(); if (!orgId || !user || !form.description.trim() || Number(form.amount) <= 0) return;
    setSaving(true); setError('');
    try {
      const data = { organizationId: orgId, type: form.type, amount: Number(form.amount), currency, category: form.category.trim() || 'Other', description: form.description.trim(), occurredAt: form.occurredAt, status: 'posted' as const };
      const id = await createOrgRecord(orgId, 'transactions', data);
      setTransactions(current => [{ id, ...data }, ...current].sort((a,b) => String(b.occurredAt).localeCompare(String(a.occurredAt))));
      setForm(emptyForm); setShowNew(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create transaction.'); }
    finally { setSaving(false); }
  }

  function exportReport() {
    const rows = [['Description','Type','Category','Amount','Currency','Date'], ...transactions.map(t => [t.description,t.type,t.category,String(t.amount),t.currency,t.occurredAt])];
    const csv = rows.map(r => r.map(v => `"${v.replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'bizmate-finance.csv'; a.click(); URL.revokeObjectURL(url);
  }

  if (busy) return <main className="module-page"><div className="module-empty"><h1>Loading finance</h1><p>BIZMATE is loading your company transactions.</p></div></main>;
  if (error && !orgId) return <main className="module-page"><div className="module-empty"><h1>Finance unavailable</h1><p>{error}</p></div></main>;
  return <main className="module-page"><header><div><small>BIZMATE / FINANCE</small><h1>Finance</h1><p>Real income and expense records from your company workspace.</p></div><button className="primary" onClick={() => setShowNew(true)}>+ Add transaction</button></header>
    {error && <div className="module-error">{error}</div>}
    <section className="summary-row"><div><span>Income</span><strong>{currency} {income.toLocaleString()}</strong></div><div><span>Expenses</span><strong>{currency} {expenses.toLocaleString()}</strong></div><div><span>Net</span><strong>{currency} {net.toLocaleString()}</strong></div><div><span>Transactions</span><strong>{transactions.length}</strong></div></section>
    <section className="data-card"><div className="data-head"><h2>Recent transactions</h2><button className="ghost" onClick={exportReport}>Export report</button></div><div className="table"><div className="tr th"><span>Description</span><span>Category</span><span>Amount</span><span>Date</span></div>{transactions.map(t => <div className="tr" key={t.id}><span><b>{t.description}</b><small>{t.type}</small></span><span>{t.category}</span><span className={t.type === 'expense' ? 'expense' : ''}>{t.type === 'expense' ? '-' : '+'}{currency} {Number(t.amount).toLocaleString()}</span><span>{t.occurredAt}</span></div>)}{!transactions.length && <div className="module-empty compact"><h3>No transactions yet</h3><p>Add your first real income or expense record.</p></div>}</div></section>
    {showNew && <div className="module-overlay" onClick={() => !saving && setShowNew(false)}><form className="module-modal" onSubmit={addTransaction} onClick={e => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => !saving && setShowNew(false)}>×</button><small>BIZMATE / FINANCE</small><h2>Add transaction</h2><label>Type<select value={form.type} onChange={e => setForm({...form,type:e.target.value as Transaction['type']})}><option value="income">Income</option><option value="expense">Expense</option></select></label><label>Description<input required value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Transaction description" /></label><label>Category<input value={form.category} onChange={e => setForm({...form,category:e.target.value})} placeholder="Sales, Payroll, Operations..." /></label><label>Amount<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} /></label><label>Date<input required type="date" value={form.occurredAt} onChange={e => setForm({...form,occurredAt:e.target.value})} /></label><button className="primary" disabled={saving} type="submit">{saving ? 'Saving...' : 'Save transaction →'}</button></form></div>}
  </main>;
}
