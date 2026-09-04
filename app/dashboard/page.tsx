'use client';

import './dashboard.css';
import { Suspense, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { type User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { ensureAnonymousSession } from '@/lib/auth-flows';
import { ensureGuestWorkspace } from '@/lib/company-onboarding';
import { loadDashboardData } from '@/lib/dashboard-data';
import { canAccessModule, modulesForRole } from '@/lib/permissions';
import { getDictionary, interpolate, isRtl, languages, type LanguageCode } from '@/lib/i18n';
import type { ModuleKey, Organization, UserRole } from '@/types/business';

const modules = [
  ['Overview', 'overview', '/dashboard'], ['Intelligence', 'intelligence', '/dashboard/intelligence'], ['Customers', 'customers', '/dashboard/customers'], ['Projects', 'projects', '/dashboard/projects'], ['People', 'people', '/dashboard/people'], ['Finance', 'finance', '/dashboard/finance'], ['Automations', 'automations', '/dashboard/automations'], ['Knowledge', 'knowledge', '/dashboard/knowledge'], ['Reports', 'reports', '/dashboard/reports'],
] as const;

type DashboardState = Awaited<ReturnType<typeof loadDashboardData>>;
type AuditNotification = { id: string; action?: string; resource?: string; actorId?: string; createdAt?: { toDate?: () => Date } | Date | null; metadata?: Record<string, unknown> };

function DashboardContent() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState<ModuleKey>('overview');
  const [assistant, setAssistant] = useState(false);
  const [assistantText, setAssistantText] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AuditNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [organizationId, setOrganizationId] = useState(searchParams.get('org') || '');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [search, setSearch] = useState('');

  const t = getDictionary(language);
  const rtl = isRtl(language);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('bizmate:language') as LanguageCode | null : null;
    if (saved && languages.some(([code]) => code === saved)) setLanguage(saved);
  }, []);
  useEffect(() => { if (typeof window !== 'undefined') { window.localStorage.setItem('bizmate:language', language); document.documentElement.lang = language; document.documentElement.dir = rtl ? 'rtl' : 'ltr'; } }, [language, rtl]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const guest = await ensureAnonymousSession();
        const guestOrgId = await ensureGuestWorkspace(guest.uid);
        if (cancelled) return;
        setUser(guest);
        setOrganizationId(current => current || guestOrgId);
        if (typeof window !== 'undefined') window.localStorage.setItem('bizmate:organization', guestOrgId);
        setAuthReady(true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'BIZMATE could not start its secure workspace.');
        setAuthReady(true);
        setLoading(false);
      }
    }
    void bootstrap();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get('org');
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('bizmate:organization') : null;
    const resolved = fromUrl || saved || '';
    if (resolved) { setOrganizationId(resolved); window.localStorage.setItem('bizmate:organization', resolved); }
  }, [searchParams]);
  useEffect(() => {
    const key = user ? `bizmate:notification-read:${user.uid}` : '';
    if (!key) return;
    try { setReadIds(JSON.parse(window.localStorage.getItem(key) || '[]')); } catch { setReadIds([]); }
  }, [user]);
  useEffect(() => {
    if (!user) { setPendingApprovalCount(0); return; }
    let cancelled = false; let unsubscribe = () => {}; const currentUser = user;
    async function watchApprovals() {
      try {
        const profileSnap = await getDoc(doc(getFirebaseDb(), 'users', currentUser.uid));
        const orgId = String(profileSnap.data()?.organizationId ?? organizationId ?? '');
        if (!orgId || cancelled) return;
        unsubscribe = onSnapshot(query(collection(getFirebaseDb(), 'organizations', orgId, 'approvals'), where('status', '==', 'pending')), snapshot => { if (!cancelled) setPendingApprovalCount(snapshot.size); }, () => { if (!cancelled) setPendingApprovalCount(0); });
      } catch { if (!cancelled) setPendingApprovalCount(0); }
    }
    void watchApprovals(); return () => { cancelled = true; unsubscribe(); };
  }, [organizationId, user]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!authReady || !user || error) return;
      setLoading(true); setError('');
      try {
        let resolvedOrgId = organizationId;
        if (!resolvedOrgId) {
          resolvedOrgId = await ensureGuestWorkspace(user.uid);
          setOrganizationId(resolvedOrgId);
          window.localStorage.setItem('bizmate:organization', resolvedOrgId);
        }
        const memberSnap = await getDoc(doc(getFirebaseDb(), 'organizations', resolvedOrgId, 'members', user.uid));
        if (!memberSnap.exists()) throw new Error('BIZMATE workspace membership is unavailable.');
        const rawRole = String(memberSnap.data()?.role ?? 'owner');
        const resolvedRole: UserRole = ['owner', 'admin', 'manager', 'employee'].includes(rawRole) ? rawRole as UserRole : 'owner';
        const orgSnapshot = await getDoc(doc(getFirebaseDb(), 'organizations', resolvedOrgId));
        if (!orgSnapshot.exists()) throw new Error('BIZMATE workspace was not found.');
        const orgData = orgSnapshot.data();
        const org: Organization = { id: orgSnapshot.id, name: String(orgData.name ?? 'BIZMATE Workspace'), slug: String(orgData.slug ?? orgSnapshot.id), industry: orgData.industry ? String(orgData.industry) : undefined, country: orgData.country ? String(orgData.country) : undefined, currency: String(orgData.currency ?? 'USD'), timezone: String(orgData.timezone ?? 'UTC'), locale: String(orgData.locale ?? 'en-US'), createdAt: String(orgData.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString()) };
        const dashboard = await loadDashboardData(resolvedOrgId);
        let recentAudit: AuditNotification[] = [];
        try { const auditSnap = await getDocs(query(collection(getFirebaseDb(), 'organizations', resolvedOrgId, 'audit'), orderBy('createdAt', 'desc'), limit(12))); recentAudit = auditSnap.docs.map(item => ({ id: item.id, ...(item.data() as Omit<AuditNotification, 'id'>) })); } catch { recentAudit = []; }
        if (cancelled) return;
        setRole(resolvedRole); setOrganization(org); setData(dashboard); setNotifications(recentAudit);
      } catch (err) { if (cancelled) return; setRole(null); setOrganization(null); setError(err instanceof Error ? err.message : 'Unable to load this workspace.'); setData(null); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, [authReady, organizationId, user, error]);

  const companyName = organization?.name || 'BIZMATE Workspace';
  const ownerName = useMemo(() => user?.displayName || user?.email?.split('@')[0] || 'Workspace owner', [user]);
  const visibleModules = role ? modules.filter(([, key]) => modulesForRole(role).includes(key as ModuleKey)) : [];
  const unreadCount = notifications.filter(item => !readIds.includes(item.id)).length;
  const navigate = (href: string) => { if (typeof window !== 'undefined') window.location.assign(href); };
  function markNotificationsRead() { const ids = notifications.map(item => item.id); setReadIds(ids); if (user) window.localStorage.setItem(`bizmate:notification-read:${user.uid}`, JSON.stringify(ids)); }
  function setActiveAndNavigate(key: ModuleKey, href: string) { setActive(key); navigate(href); }
  function submitSearch() { const value = search.trim(); if (value) navigate(`/dashboard/customers?search=${encodeURIComponent(value)}`); }
  useEffect(() => { if (role && !canAccessModule(role, active)) setActive('overview'); }, [role, active]);

  if (error) return <main className="biz-dashboard-state"><div className="state-card"><span className="state-icon">!</span><p className="state-kicker">BIZMATE WORKSPACE</p><h1>We could not start BIZMATE.</h1><p>{error}</p><button className="ask" onClick={() => window.location.reload()}>Retry →</button><a className="secondary-link" href="/">Return to BIZMATE</a></div></main>;
  if (!authReady || loading) return <main className="biz-dashboard-state"><div className="state-card"><span className="state-icon">✦</span><p className="state-kicker">BIZMATE WORKSPACE</p><h1>Preparing your command center.</h1><p>Connecting your private workspace and business data.</p><div className="loader" aria-label="Loading" /></div></main>;
  if (!user) return <main className="biz-dashboard-state"><div className="state-card"><span className="state-icon">!</span><p className="state-kicker">BIZMATE WORKSPACE</p><h1>Workspace unavailable.</h1><p>BIZMATE could not create the local secure session.</p><button className="ask" onClick={() => window.location.reload()}>Retry →</button></div></main>;
  if (!organization || !data || !role) return <main className="biz-dashboard-state"><div className="state-card"><span className="state-icon">!</span><p className="state-kicker">WORKSPACE ATTENTION</p><h1>We could not open this workspace.</h1><p>Workspace data is unavailable right now.</p><button className="ask" onClick={() => window.location.reload()}>Retry →</button><a className="secondary-link" href="/">Return to BIZMATE</a></div></main>;

  const { customers, projects, insights, metrics } = data;
  const firstInsights = insights.slice(0, 5); const firstProjects = projects.slice(0, 5);
  const moduleLabel = (key: ModuleKey) => { const map: Record<string,string> = { overview:t.overview, intelligence:t.intelligence, customers:t.customers, projects:t.projects, people:t.people, finance:t.finance, automations:t.automations, knowledge:t.knowledge, reports:t.reports }; return map[key] || key; };

  return <main className="biz-dashboard">
    <aside className="biz-sidebar">
      <a href="/" className="biz-brand"><span>B</span><b>BIZMATE</b></a>
      <div className="company-card"><div className="company-logo">{companyName.slice(0,1).toUpperCase()}</div><div><b>{companyName}</b><small>{organization.industry || 'Executive workspace'} · {organization.country || t.global}</small></div></div>
      <nav>{visibleModules.map(([_, key, href]) => <button type="button" key={key} className={active === key ? 'active' : ''} onClick={() => setActiveAndNavigate(key, href)}><span className={`nav-icon nav-${key}`}></span>{moduleLabel(key)}</button>)}<button type="button" onClick={() => navigate('/dashboard/actions')} className="action-nav"><span className="nav-icon">⚡</span><span>Action Center</span>{pendingApprovalCount ? <b className="badge">{pendingApprovalCount > 99 ? '99+' : pendingApprovalCount}</b> : null}</button></nav>
      <div className="side-bottom"><button type="button" onClick={() => navigate(canAccessModule(role, 'settings') ? '/dashboard/settings' : '/dashboard')}>⚙ {t.settings}</button><button type="button" onClick={() => navigate('/dashboard/knowledge')}>❔ {t.help}</button><small>{ownerName} · {role}</small><small>Created by MAHMUD ELATVIL</small></div>
    </aside>
    <section className="biz-content">
      <header className="biz-header"><div><small>{companyName} / {moduleLabel(active)}</small><h1>{moduleLabel(active)}</h1></div><div className="header-actions"><form onSubmit={e => { e.preventDefault(); submitSearch(); }}><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} aria-label={t.search}/><button type="submit" className="search-submit">⌕</button></form><select className="language-select" value={language} onChange={e => setLanguage(e.target.value as LanguageCode)} aria-label={t.language}>{languages.map(([code,name]) => <option key={code} value={code}>{name}</option>)}</select><button type="button" className="notification-button" aria-label={t.notifications} onClick={() => { setNotificationsOpen(current => !current); markNotificationsRead(); }}>◉{unreadCount ? <i>{unreadCount > 9 ? '9+' : unreadCount}</i> : null}</button><button type="button" aria-label={t.ask} onClick={() => setAssistant(true)}>✦</button><div className="avatar">{ownerName.slice(0, 2).toUpperCase()}</div></div></header>
      {notificationsOpen && <div className="notification-panel"><div className="notification-head"><div><small>BIZMATE / ALERTS</small><h3>{t.notifications}</h3></div><button type="button" onClick={() => setNotificationsOpen(false)}>×</button></div>{notifications.length ? notifications.slice(0, 8).map(item => <div className={`notification-item ${readIds.includes(item.id) ? 'read' : 'unread'}`} key={item.id}><span>•</span><div><b>{formatAuditTitle(item)}</b><p>{item.actorId ? `Actor ${item.actorId.slice(0, 8)}` : t.activity} · {formatDate(item.createdAt)}</p></div></div>) : <div className="notification-empty"><b>{t.noAlerts}</b><p>Important workspace events will appear here.</p></div>}</div>}
      {active === 'overview' ? <>
        <section className="welcome"><div><span>● {t.livePulse}</span><h2>{interpolate(t.welcome, { name: ownerName })}</h2><p>{insights.length ? `BIZMATE found ${insights.length} business signals for ${companyName}.` : `Your ${companyName} workspace is connected and ready for business data.`}</p></div><button type="button" className="ask" onClick={() => setAssistant(true)}>✦ {t.ask}</button></section>
        <div className="metrics"><Metric title={t.businessHealth} value={`${metrics.healthScore}/100`} trend={metrics.healthScore >= 75 ? t.healthy : t.needsAttention}/><Metric title={t.pipeline} value={formatMoney(metrics.pipelineValue, organization.currency)} trend={t.companyScoped}/><Metric title={t.activeCustomers} value={String(metrics.activeCustomers)} trend={customers.length ? `${customers.length} total tracked` : t.addCustomers}/><Metric title={t.projectsRisk} value={String(metrics.projectsAtRisk)} trend={metrics.projectsAtRisk ? t.needsAttention : t.onTrack}/></div>
        <section className="company-showcase"><div className="showcase-copy"><span>GLOBAL BUSINESS NETWORK</span><h3>Built for every kind of company.</h3><p>From startups to enterprises, BIZMATE gives every team one premium command center.</p></div><div className="company-visuals"><CompanyVisual title="Technology" image="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80"/><CompanyVisual title="Finance" image="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80"/><CompanyVisual title="Retail" image="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"/></div></section>
        <div className="two-col"><Panel title={t.attention} empty={!firstInsights.length}>{firstInsights.map(i => <div className="insight" key={i.id}><strong>{i.severity.toUpperCase()}</strong><div><b>{i.title}</b><p>{i.description}</p></div><em>{i.metric || '—'}</em></div>)}</Panel><Panel title={t.activity} empty={!notifications.length}>{notifications.slice(0, 5).map(item => <div className="insight" key={item.id}><strong>ACTIVITY</strong><div><b>{formatAuditTitle(item)}</b><p>Recorded in the company audit trail.</p></div><em>{formatDate(item.createdAt)}</em></div>)}</Panel></div>
        <div className="two-col"><Panel title={t.projectsTitle} empty={!firstProjects.length}>{firstProjects.map(p => <div className="project" key={p.id}><div><b>{p.name}</b><small>{p.status} · {p.dueDate ? `due ${p.dueDate}` : 'no due date'}</small></div><div className="bar"><span style={{width: `${Math.max(0, Math.min(100, p.progress))}%`}}/></div><strong>{Math.round(p.progress)}%</strong></div>)}</Panel><div className="ai-card"><span>✦</span><h3>{t.intelligenceTitle}</h3><p>{t.intelligenceText}</p><button type="button" onClick={() => setAssistant(true)}>{t.openIntelligence}</button></div></div>
      </> : <section className="coming"><span>✦</span><h2>{moduleLabel(active)}</h2><p>This module is enabled for your {role} role and scoped to {companyName}. Sensitive actions remain protected by role permissions.</p><div><b>Role-aware</b><b>{t.companyScoped}</b><b>Approval-first</b></div></section>}
    </section>
    {assistant && <div className="overlay" onClick={() => setAssistant(false)}><div className="assistant" onClick={e => e.stopPropagation()}><button type="button" className="close" aria-label={t.close} onClick={() => setAssistant(false)}>×</button><span>✦ BIZMATE INTELLIGENCE</span><h2>{t.copilot}</h2><p>{t.intelligenceText}</p><div className="prompt"><input value={assistantText} onChange={e => setAssistantText(e.target.value)} placeholder={t.prompt}/><button type="button" onClick={() => { if (assistantText.trim()) { setAssistantText(''); } }}>{t.send}</button></div><small>{t.company}: {companyName} · {t.role}: {role} · {t.companyScoped}.</small></div></div>}
  </main>;
}

export default function Dashboard() { return <Suspense fallback={<main className="biz-dashboard-state"><div className="state-card"><span className="state-icon">✦</span><p className="state-kicker">BIZMATE WORKSPACE</p><h1>Preparing your command center.</h1><p>Loading your company workspace.</p><div className="loader" aria-label="Loading" /></div></main>}><DashboardContent /></Suspense>; }
function Metric({title,value,trend}:{title:string;value:string;trend:string}){return <div className="metric"><small>{title}</small><strong>{value}</strong><span>{trend}</span></div>}
function Panel({title,children,empty=false}:{title:string;children:ReactNode;empty?:boolean}){return <section className="panel"><div className="panel-title"><h3>{title}</h3><button type="button">View all →</button></div>{empty ? <div className="activity-empty">No records yet. Add data from this module to make BIZMATE smarter.</div> : children}</section>}
function CompanyVisual({title,image}:{title:string;image:string}){return <button type="button" className="company-visual" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}><img src={image} alt={title} loading="lazy"/><span>{title}</span></button>}
function formatMoney(value:number,currency='USD'){try{return new Intl.NumberFormat(undefined,{style:'currency',currency,maximumFractionDigits:0}).format(value || 0);}catch{return `${currency} ${Math.round(value || 0)}`;}}
function formatAuditTitle(item: AuditNotification) { const action = item.action || 'activity'; const resource = item.resource || 'workspace'; return `${action.replaceAll('_',' ')} · ${resource}`; }
function formatDate(value: AuditNotification['createdAt']) { try { const date = value && typeof (value as { toDate?: () => Date }).toDate === 'function' ? (value as {toDate:()=>Date}).toDate() : value instanceof Date ? value : null; return date ? date.toLocaleString() : 'recently'; } catch { return 'recently'; } }
