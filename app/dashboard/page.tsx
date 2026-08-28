'use client';

import './dashboard.css';
import { Suspense, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { loadDashboardData } from '@/lib/dashboard-data';
import { canAccessModule, modulesForRole } from '@/lib/permissions';
import type { ModuleKey, Organization, UserRole } from '@/types/business';

const modules = [
  ['Overview', 'overview', '/dashboard'],
  ['Intelligence', 'intelligence', '/dashboard/intelligence'],
  ['Customers', 'customers', '/dashboard/customers'],
  ['Projects', 'projects', '/dashboard/projects'],
  ['People', 'people', '/dashboard/people'],
  ['Finance', 'finance', '/dashboard/finance'],
  ['Automations', 'automations', '/dashboard/automations'],
  ['Knowledge', 'knowledge', '/dashboard/knowledge'],
  ['Reports', 'reports', '/dashboard/reports'],
] as const;

type DashboardState = Awaited<ReturnType<typeof loadDashboardData>>;

function DashboardContent() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState<ModuleKey>('overview');
  const [assistant, setAssistant] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [organizationId, setOrganizationId] = useState(searchParams.get('org') || '');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), currentUser => {
    setUser(currentUser);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    const fromUrl = searchParams.get('org');
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('bizmate:organization') : null;
    const resolved = fromUrl || saved || '';
    if (resolved) {
      setOrganizationId(resolved);
      window.localStorage.setItem('bizmate:organization', resolved);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!authReady) return;
      if (!user) {
        setLoading(false);
        setData(null);
        return;
      }
      setLoading(true);
      setError('');
      try {
        let resolvedOrgId = organizationId;
        if (!resolvedOrgId) {
          const profileSnap = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
          resolvedOrgId = String(profileSnap.data()?.organizationId ?? '');
          if (resolvedOrgId) {
            setOrganizationId(resolvedOrgId);
            window.localStorage.setItem('bizmate:organization', resolvedOrgId);
          }
        }
        if (!resolvedOrgId) throw new Error('Your account is not connected to a company workspace yet.');

        const memberSnap = await getDoc(doc(getFirebaseDb(), 'organizations', resolvedOrgId, 'members', user.uid));
        if (!memberSnap.exists()) throw new Error('You are not a member of this company workspace.');
        const rawRole = String(memberSnap.data()?.role ?? 'employee');
        const resolvedRole: UserRole = ['owner', 'admin', 'manager', 'employee'].includes(rawRole) ? (rawRole as UserRole) : 'employee';

        const orgSnapshot = await getDoc(doc(getFirebaseDb(), 'organizations', resolvedOrgId));
        if (!orgSnapshot.exists()) throw new Error('Company workspace was not found.');
        const orgData = orgSnapshot.data();
        const org: Organization = {
          id: orgSnapshot.id,
          name: String(orgData.name ?? 'BIZMATE Workspace'),
          slug: String(orgData.slug ?? orgSnapshot.id),
          industry: orgData.industry ? String(orgData.industry) : undefined,
          country: orgData.country ? String(orgData.country) : undefined,
          currency: String(orgData.currency ?? 'USD'),
          timezone: String(orgData.timezone ?? 'UTC'),
          locale: String(orgData.locale ?? 'en-US'),
          createdAt: String(orgData.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString()),
        };
        const dashboard = await loadDashboardData(resolvedOrgId);
        if (cancelled) return;
        setRole(resolvedRole);
        setOrganization(org);
        setData(dashboard);
      } catch (err) {
        if (cancelled) return;
        setRole(null);
        setOrganization(null);
        setError(err instanceof Error ? err.message : 'Unable to load this workspace.');
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [authReady, organizationId, user]);

  const companyName = organization?.name || 'Your company';
  const ownerName = useMemo(() => user?.displayName || user?.email?.split('@')[0] || 'Workspace owner', [user]);
  const visibleModules = role ? modules.filter(([, key]) => modulesForRole(role).includes(key as ModuleKey)) : [];

  useEffect(() => {
    if (role && !canAccessModule(role, active)) setActive('overview');
  }, [role, active]);

  if (!authReady || loading) return <main className="biz-dashboard-state"><div className="state-card"><span className="state-icon">✦</span><p className="state-kicker">BIZMATE SECURE WORKSPACE</p><h1>Preparing your command center.</h1><p>Loading your company identity, permissions and business data.</p><div className="loader" aria-label="Loading" /></div></main>;
  if (!user) return <main className="biz-dashboard-state"><div className="state-card"><span className="state-icon">B</span><p className="state-kicker">BIZMATE SECURE WORKSPACE</p><h1>Sign in to your company.</h1><p>Access your company workspace, intelligence and approvals through your secure account.</p><a className="ask" href="/login">Go to sign in →</a></div></main>;
  if (error || !organization || !data || !role) return <main className="biz-dashboard-state"><div className="state-card"><span className="state-icon">!</span><p className="state-kicker">WORKSPACE ATTENTION</p><h1>We could not open this workspace.</h1><p>{error || 'Your workspace data is unavailable right now.'}</p><button className="ask" onClick={() => window.location.reload()}>Retry →</button><a className="secondary-link" href="/">Return to BIZMATE</a></div></main>;

  const { customers, projects, insights, metrics } = data;
  const firstInsights = insights.slice(0, 5);
  const firstProjects = projects.slice(0, 5);

  return <main className="biz-dashboard">
    <aside className="biz-sidebar">
      <a href="/" className="biz-brand"><span>B</span>BIZMATE</a>
      <div className="company"><b>{companyName}</b><small>{organization.industry || 'Executive workspace'} · {organization.country || 'Global'}</small></div>
      <nav>{visibleModules.map(([label, key, href]) => <a key={key} href={href} className={active === key ? 'active' : ''} onClick={() => setActive(key)}>{label}</a>)}</nav>
      <div className="side-bottom"><a href={canAccessModule(role, 'settings') ? '/dashboard/settings' : '/dashboard'}>⚙ Settings</a><a href="/dashboard/knowledge">❔ Academy & Help</a><small>{ownerName} · {role}</small><small>Created by MAHMUD ELATVIL</small></div>
    </aside>
    <section className="biz-content">
      <header className="biz-header"><div><small>{companyName} / {active}</small><h1>{labelFor(active)}</h1></div><div className="header-actions"><input placeholder="Search your company..."/><button aria-label="Ask BIZMATE" onClick={() => setAssistant(true)}>✦</button><div className="avatar">{ownerName.slice(0, 2).toUpperCase()}</div></div></header>
      {active === 'overview' ? <>
        <section className="welcome"><div><span>● LIVE BUSINESS PULSE</span><h2>Welcome back, {ownerName}.</h2><p>{insights.length ? `BIZMATE found ${insights.length} business signals for ${companyName}.` : `Your ${companyName} workspace is connected and ready for business data.`}</p></div><button className="ask" onClick={() => setAssistant(true)}>✦ Ask BIZMATE</button></section>
        <div className="metrics"><Metric title="Business Health" value={`${metrics.healthScore}/100`} trend={metrics.healthScore >= 75 ? 'Healthy' : 'Needs attention'} /><Metric title="Pipeline Value" value={formatMoney(metrics.pipelineValue, organization.currency)} trend="Company-scoped"/><Metric title="Active Customers" value={String(metrics.activeCustomers)} trend={customers.length ? `${customers.length} total tracked` : 'Add customers'} /><Metric title="Projects at Risk" value={String(metrics.projectsAtRisk)} trend={metrics.projectsAtRisk ? 'Needs attention' : 'On track'} /></div>
        <div className="two-col"><Panel title="What needs your attention" empty={!firstInsights.length}>{firstInsights.map(i => <div className="insight" key={i.id}><strong>{i.severity.toUpperCase()}</strong><div><b>{i.title}</b><p>{i.description}</p></div><em>{i.metric || '—'}</em></div>)}</Panel><Panel title="Company activity" empty><div className="activity-empty">New team activity will appear here as your company uses BIZMATE.</div></Panel></div>
        <div className="two-col"><Panel title="Projects" empty={!firstProjects.length}>{firstProjects.map(p => <div className="project" key={p.id}><div><b>{p.name}</b><small>{p.status} · {p.dueDate ? `due ${p.dueDate}` : 'no due date'}</small></div><div className="bar"><span style={{width: `${Math.max(0, Math.min(100, p.progress))}%`}}/></div><strong>{Math.round(p.progress)}%</strong></div>)}</Panel><div className="ai-card"><span>✦</span><h3>BIZMATE Intelligence</h3><p>Understand what is happening, why it matters, and what to do next.</p><button onClick={() => setAssistant(true)}>Open Intelligence →</button></div></div>
      </> : <section className="coming"><span>✦</span><h2>{labelFor(active)}</h2><p>This module is enabled for your {role} role and scoped to {companyName}. Sensitive actions remain protected by role permissions.</p><div><b>Role-aware</b><b>Company-scoped</b><b>Approval-first</b></div></section>}
    </section>
    {assistant && <div className="overlay" onClick={() => setAssistant(false)}><div className="assistant" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setAssistant(false)}>×</button><span>✦ BIZMATE INTELLIGENCE</span><h2>Your business copilot</h2><p>Ask about revenue, customers, projects, risks, opportunities, or your next best action.</p><div className="prompt"><input placeholder="Ask BIZMATE..."/><button>Send</button></div><small>Workspace: {companyName} · Role: {role} · Intelligence is company-scoped.</small></div></div>}
  </main>;
}

export default function Dashboard() {
  return <Suspense fallback={<main className="biz-dashboard-state"><div className="state-card"><span className="state-icon">✦</span><p className="state-kicker">BIZMATE SECURE WORKSPACE</p><h1>Preparing your command center.</h1><p>Loading your company workspace.</p><div className="loader" aria-label="Loading" /></div></main>}><DashboardContent /></Suspense>;
}

function labelFor(key: ModuleKey) { const item = modules.find(([, value]) => value === key); return item?.[0] || 'Overview'; }
function Metric({title,value,trend}:{title:string;value:string;trend:string}){return <div className="metric"><small>{title}</small><strong>{value}</strong><span>{trend}</span></div>}
function Panel({title,children,empty=false}:{title:string;children:ReactNode;empty?:boolean}){return <section className="panel"><div className="panel-title"><h3>{title}</h3><button>View all →</button></div>{empty ? <div className="activity-empty">No records yet. Add data from this module to make BIZMATE smarter.</div> : children}</section>}
function formatMoney(value:number,currency='USD'){try{return new Intl.NumberFormat(undefined,{style:'currency',currency,maximumFractionDigits:0}).format(value || 0);}catch{return `${currency} ${Math.round(value || 0)}`;}}
