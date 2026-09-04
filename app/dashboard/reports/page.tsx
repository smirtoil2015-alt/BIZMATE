'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { loadDashboardData } from '@/lib/dashboard-data';

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [company, setCompany] = useState('Your company');
  const [currency, setCurrency] = useState('USD');
  const [metrics, setMetrics] = useState({ healthScore: 0, pipelineValue: 0, activeCustomers: 0, projectsAtRisk: 0, urgentInsights: 0 });

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const profile = await getDoc(doc(getFirebaseDb(), 'users', user!.uid));
        const orgId = String(profile.data()?.organizationId ?? '');
        if (!orgId) throw new Error('Your account is not connected to a company workspace.');
        const orgSnap = await getDoc(doc(getFirebaseDb(), 'organizations', orgId));
        if (!orgSnap.exists()) throw new Error('Company workspace was not found.');
        const data = await loadDashboardData(orgId);
        if (cancelled) return;
        setCompany(String(orgSnap.data()?.name ?? 'Your company'));
        setCurrency(String(orgSnap.data()?.currency ?? 'USD'));
        setMetrics(data.metrics);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load reports.');
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [user]);

  function openReport(destination: string) { window.location.assign(destination); }
  function generateReport() { window.print(); }
  function money(value: number) { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value); } catch { return `${currency} ${Math.round(value).toLocaleString()}`; } }

  if (loading) return <main className="module-page"><div className="module-empty"><span>◌</span><h1>Loading reports</h1><p>BIZMATE is preparing your company report.</p></div></main>;
  if (!user) return <main className="module-page"><div className="module-empty"><span>🔐</span><h1>Sign in required</h1><p>Sign in to access company reports.</p><a className="primary" href="/login">Sign in →</a></div></main>;
  if (error) return <main className="module-page"><div className="module-empty"><span>!</span><h1>Reports unavailable</h1><p>{error}</p><a className="primary" href="/dashboard">Back to dashboard →</a></div></main>;

  return <main className="module-page"><header><div><small>BIZMATE / REPORTS</small><h1>Reports</h1><p>Executive reporting for <b>{company}</b>, generated from your live workspace data.</p></div><button type="button" className="primary" onClick={generateReport}>Generate report</button></header><section className="summary-row"><div><span>Health score</span><strong>{metrics.healthScore}/100</strong></div><div><span>Tracked value</span><strong>{money(metrics.pipelineValue)}</strong></div><div><span>Active customers</span><strong>{metrics.activeCustomers}</strong></div><div><span>Risk signals</span><strong>{metrics.projectsAtRisk + metrics.urgentInsights}</strong></div></section><section className="report-grid"><article className="report-card"><small>EXECUTIVE BRIEF</small><h2>Business Pulse</h2><p>Current health, customer value, delivery risk and priority signals.</p><button type="button" onClick={() => openReport('/dashboard/intelligence')}>Open report →</button></article><article className="report-card"><small>OPERATIONS</small><h2>Project Delivery</h2><p>Progress, deadlines and projects requiring intervention.</p><button type="button" onClick={() => openReport('/dashboard/projects')}>Open report →</button></article><article className="report-card"><small>COMMERCIAL</small><h2>Customer &amp; Pipeline</h2><p>Customer portfolio, follow-up and weighted sales opportunities.</p><button type="button" onClick={() => openReport('/dashboard/customers')}>Open report →</button></article></section></main>;
}
