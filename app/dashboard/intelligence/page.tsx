'use client';

import '../module.css';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { loadDashboardData } from '@/lib/dashboard-data';
import type { Organization } from '@/types/business';

export default function IntelligencePage() {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof loadDashboardData>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        const profile = await getDoc(doc(getFirebaseDb(), 'users', user!.uid));
        const organizationId = String(profile.data()?.organizationId ?? '');
        if (!organizationId) throw new Error('Your account is not connected to a company workspace yet.');
        const organizationSnap = await getDoc(doc(getFirebaseDb(), 'organizations', organizationId));
        if (!organizationSnap.exists()) throw new Error('Company workspace was not found.');
        const raw = organizationSnap.data();
        const workspace: Organization = {
          id: organizationSnap.id,
          name: String(raw.name ?? 'BIZMATE Workspace'),
          slug: String(raw.slug ?? organizationSnap.id),
          industry: raw.industry ? String(raw.industry) : undefined,
          country: raw.country ? String(raw.country) : undefined,
          currency: String(raw.currency ?? 'USD'),
          timezone: String(raw.timezone ?? 'UTC'),
          locale: String(raw.locale ?? 'en-US'),
          createdAt: String(raw.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString()),
        };
        const dashboard = await loadDashboardData(organizationId);
        if (cancelled) return;
        setOrganization(workspace);
        setData(dashboard);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load company intelligence.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <main className="module-page"><section className="coming"><span>✦</span><h2>Preparing company intelligence…</h2><p>BIZMATE is loading your organization-scoped signals.</p></section></main>;
  if (!user) return <main className="module-page"><section className="coming"><span>🔐</span><h2>Sign in required</h2><p>Sign in to view private company intelligence.</p><a className="primary" href="/login">Sign in →</a></section></main>;
  if (error || !data || !organization) return <main className="module-page"><section className="coming"><span>!</span><h2>Intelligence unavailable</h2><p>{error || 'No company workspace could be loaded.'}</p><a className="primary" href="/dashboard">Back to dashboard →</a></section></main>;

  const { insights, metrics, customers, projects } = data;
  const critical = insights.filter(item => item.severity === 'critical').length;
  const opportunities = insights.filter(item => item.severity === 'opportunity').length;
  const atRiskProjects = projects.filter(item => item.status === 'at-risk').length;

  function reviewSignal(severity: string) {
    const destination = severity === 'critical' || severity === 'warning' ? '/dashboard/projects' : '/dashboard/customers';
    window.location.assign(destination);
  }

  return <main className="module-page">
    <header><div><small>BIZMATE / INTELLIGENCE</small><h1>Intelligence</h1><p>Live signals from <b>{organization.name}</b>. Confirmed company data stays separate from AI recommendations.</p></div><a className="primary" href="/dashboard">Open command center →</a></header>

    <section className="summary-row">
      <div><span>Business health</span><strong>{metrics.healthScore}/100</strong></div>
      <div><span>Signals detected</span><strong>{insights.length}</strong></div>
      <div><span>Critical risks</span><strong>{critical}</strong></div>
      <div><span>Opportunities</span><strong>{opportunities}</strong></div>
    </section>

    <section className="ai-hero"><div><span>● LIVE COMPANY INTELLIGENCE</span><h2>{critical ? 'Priority risks need attention.' : opportunities ? 'Growth opportunities are visible.' : 'Your business picture is stable.'}</h2><p>{atRiskProjects ? `${atRiskProjects} project${atRiskProjects === 1 ? '' : 's'} currently show an at-risk status.` : 'No projects are currently marked at risk.'} BIZMATE is using your company workspace data only.</p></div><div className="ai-score"><small>Health score</small><strong>{metrics.healthScore}</strong><span>/ 100</span></div></section>

    <section className="insight-grid">{insights.length ? insights.map(item => <article className={`insight-card ${item.severity}`} key={item.id}><div><span>{item.severity.toUpperCase()}</span><h3>{item.title}</h3><p>{item.description}</p></div><strong>{item.metric || 'Company signal'}</strong><button type="button" onClick={() => reviewSignal(item.severity)}>Review signal →</button></article>) : <section className="data-card"><div className="data-head"><h2>No intelligence signals yet</h2></div><p className="brief">Add customers, projects and company activity. BIZMATE will use those records to surface meaningful business signals.</p></section>}</section>

    <section className="summary-row">
      <div><span>Active customers</span><strong>{metrics.activeCustomers}</strong></div>
      <div><span>Tracked customers</span><strong>{customers.length}</strong></div>
      <div><span>Projects at risk</span><strong>{metrics.projectsAtRisk}</strong></div>
      <div><span>Pipeline value</span><strong>{formatMoney(metrics.pipelineValue, organization.currency)}</strong></div>
    </section>

    <section className="data-card"><div className="data-head"><div><h2>Decision brief</h2><p className="brief">BIZMATE follows an approval-first model: recommendations can be generated from company data, while sensitive actions remain subject to explicit permissions and approval.</p></div><span className="status active">Company-scoped</span></div></section>
  </main>;
}

function formatMoney(value: number, currency: string) {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value); }
  catch { return `${currency} ${Math.round(value).toLocaleString()}`; }
}
