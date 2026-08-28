'use client';

import './dashboard.css';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getOrgRecord } from '@/lib/firestore-service';
import { loadDashboardData } from '@/lib/dashboard-data';
import type { Organization, BusinessInsight, Customer, Project } from '@/types/business';

const modules = [
  ['Overview', '/dashboard'],
  ['Intelligence', '/dashboard/intelligence'],
  ['Customers', '/dashboard/customers'],
  ['Projects', '/dashboard/projects'],
  ['People', '/dashboard/people'],
  ['Finance', '/dashboard/finance'],
  ['Automations', '/dashboard/automations'],
  ['Knowledge', '/dashboard/knowledge'],
  ['Reports', '/dashboard/reports'],
] as const;

type DashboardState = {
  customers: Customer[];
  projects: Project[];
  insights: BusinessInsight[];
  metrics: { health: number; revenue: number; customers: number; projects: number };
};

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState('Overview');
  const [assistant, setAssistant] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState(searchParams.get('org') || '');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), setUser);
  }, []);

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
      if (!organizationId) {
        setLoading(false);
        setData(null);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const [org, dashboard] = await Promise.all([
          getOrgRecord<Organization>(organizationId, 'profile', organizationId),
          loadDashboardData(organizationId),
        ]);
        if (cancelled) return;
        setOrganization(org);
        setData(dashboard);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load this workspace.');
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [organizationId]);

  const companyName = organization?.name || 'Your company';
  const ownerName = useMemo(() => user?.displayName || user?.email?.split('@')[0] || 'Workspace owner', [user]);

  return <main className="biz-dashboard">
    <aside className="biz-sidebar">
      <a href="/" className="biz-brand"><span>B</span>BIZMATE</a>
      <div className="company"><b>{companyName}</b><small>{organization?.industry || 'Executive workspace'}</small></div>
      <nav>{modules.map(([label, href]) => <a key={label} href={href} className={active === label ? 'active' : ''} onClick={() => setActive(label)}>{label}</a>)}</nav>
      <div className="side-bottom"><a href="/dashboard/settings">⚙ Settings</a><a href="/dashboard/knowledge">❔ Academy & Help</a><small>{ownerName} · {user ? 'Authenticated' : 'Guest'}</small></div>
    </aside>
    <section className="biz-content">
      <header className="biz-header"><div><small>BIZMATE / {active}</small><h1>{active}</h1></div><div className="header-actions"><input placeholder="Search your company..."/><button aria-label="Notifications">◔</button><button className="avatar">{ownerName.slice(0, 2).toUpperCase()}</button></div></header>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => window.location.reload()} /> : !data ? <EmptyWorkspace orgId={organizationId} /> : active === 'Overview' ? <>
        <section className="welcome"><div><span>● LIVE BUSINESS PULSE</span><h2>Welcome back, {ownerName}.</h2><p>{data.insights.length ? `BIZMATE found ${data.insights.length} business signal${data.insights.length === 1 ? '' : 's'} that deserve attention.` : 'Your workspace is ready. Add customers, projects and team data to unlock the full business picture.'}</p></div><button className="ask" onClick={() => setAssistant(true)}>✦ Ask BIZMATE</button></section>
        <div className="metrics"><Metric title="Business Health" value={`${data.metrics.health}/100`} trend={data.metrics.health >= 75 ? 'Healthy' : 'Needs attention'} /><Metric title="Revenue" value={formatMoney(data.metrics.revenue, organization?.currency)} trend="Live workspace"/><Metric title="Customers" value={String(data.metrics.customers)} trend={data.customers.length ? 'Tracked' : 'Add customers'} /><Metric title="Projects" value={String(data.metrics.projects)} trend={data.projects.some(p => p.status === 'at-risk') ? 'At risk' : 'On track'} /></div>
        <div className="two-col"><Panel title="What needs your attention" empty={!data.insights.length}>{data.insights.slice(0, 5).map(i => <div className="insight" key={i.id}><strong>{i.severity.toUpperCase()}</strong><div><b>{i.title}</b><p>{i.description}</p></div><em>{i.metric || '—'}</em></div>)}</Panel><Panel title="Company activity" empty><div className="activity-empty">Activity will appear here as your team uses BIZMATE.</div></Panel></div>
        <div className="two-col"><Panel title="Projects" empty={!data.projects.length}>{data.projects.slice(0, 5).map(p => <div className="project" key={p.id}><div><b>{p.name}</b><small>{p.status} · {p.dueDate ? `due ${p.dueDate}` : 'no due date'}</small></div><div className="bar"><span style={{width: `${Math.max(0, Math.min(100, p.progress))}%`}}/></div><strong>{Math.round(p.progress)}%</strong></div>)}</Panel><div className="ai-card"><span>✦</span><h3>BIZMATE Intelligence</h3><p>Understand what is happening, why it matters, and what to do next.</p><button onClick={() => setAssistant(true)}>Open Intelligence →</button></div></div>
      </> : <section className="coming"><span>✦</span><h2>{active}</h2><p>Open this module to work with company-scoped data, permissions and BIZMATE intelligence.</p><div><b>Company-scoped</b><b>Permissions-ready</b><b>AI-ready</b></div></section>}
    </section>
    {assistant && <div className="overlay" onClick={() => setAssistant(false)}><div className="assistant" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setAssistant(false)}>×</button><span>✦ BIZMATE INTELLIGENCE</span><h2>Your business copilot</h2><p>Ask about revenue, customers, projects, risks, opportunities, or what your company should do next.</p><div className="prompt"><input placeholder="Ask BIZMATE..."/><button>Send</button></div><small>AI actions are permission-aware and approval-first.</small></div></div>}
  </main>;
}

function LoadingState() { return <section className="coming"><span>◌</span><h2>Loading your workspace</h2><p>BIZMATE is securely loading company-scoped business data.</p></section>; }
function ErrorState({message,onRetry}:{message:string;onRetry:()=>void}) { return <section className="coming"><span>!</span><h2>Workspace unavailable</h2><p>{message}</p><button className="ask" onClick={onRetry}>Try again</button></section>; }
function EmptyWorkspace({orgId}:{orgId:string}) { return <section className="coming"><span>✦</span><h2>Connect your company workspace</h2><p>{orgId ? 'Your company profile is not available yet. Finish onboarding or confirm the organization data in Firestore.' : 'Sign in and create a company workspace to start using BIZMATE.'}</p><div><b>Secure</b><b>Company-scoped</b><b>AI-ready</b></div></section>; }
function Metric({title,value,trend}:{title:string;value:string;trend:string}){return <div className="metric"><small>{title}</small><strong>{value}</strong><span>{trend}</span></div>}
function Panel({title,children,empty=false}:{title:string;children:ReactNode;empty?:boolean}){return <section className="panel"><div className="panel-title"><h3>{title}</h3><button>View all →</button></div>{empty ? <div className="activity-empty">No records yet. Add data from this module to make BIZMATE smarter.</div> : children}</section>}
function formatMoney(value:number,currency='USD'){return new Intl.NumberFormat(undefined,{style:'currency',currency,maximumFractionDigits:0}).format(value || 0);}
