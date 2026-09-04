'use client';

import './dashboard.css';
import { Suspense, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
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
type AuditNotification = { id: string; action?: string; resource?: string; actorId?: string; createdAt?: { toDate?: () => Date } | Date | null; metadata?: Record<string, unknown> };

function DashboardContent() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState<ModuleKey>('overview');
  const [assistant, setAssistant] = useState(false);
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
    const key = user ? `bizmate:notification-read:${user.uid}` : '';
    if (!key) return;
    try { setReadIds(JSON.parse(window.localStorage.getItem(key) || '[]')); } catch { setReadIds([]); }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setPendingApprovalCount(0);
      return;
    }
    let cancelled = false;
    let unsubscribe = () => {};
    const currentUser = user;

    async function watchApprovals() {
      try {
        const profileSnap = await getDoc(doc(getFirebaseDb(), 'users', currentUser.uid));
        const orgId = String(profileSnap.data()?.organizationId ?? organizationId ?? '');
        if (!orgId || cancelled) return;
        unsubscribe = onSnapshot(
          query(collection(getFirebaseDb(), 'organizations', orgId, 'approvals'), where('status', '==', 'pending')),
          snapshot => { if (!cancelled) setPendingApprovalCount(snapshot.size); },
          () => { if (!cancelled) setPendingApprovalCount(0); },
        );
      } catch {
        if (!cancelled) setPendingApprovalCount(0);
      }
    }

    void watchApprovals();
    return () => { cancelled = true; unsubscribe(); };
  }, [organizationId, user]);

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
        const org: Organization = { id: orgSnapshot.id, name: String(orgData.name ?? 'BIZMATE Workspace'), slug: String(orgData.slug ?? orgSnapshot.id), industry: orgData.industry ? String(orgData.industry) : undefined, country: orgData.country ? String(orgData.country) : undefined, currency: String(orgData.currency ?? 'USD'), timezone: String(orgData.timezone ?? 'UTC'), locale: String(orgData.locale ?? 'en-US'), createdAt: String(orgData.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString()) };
        const dashboard = await loadDashboardData(resolvedOrgId);
        let recentAudit: AuditNotification[] = [];
        try {
          const auditSnap = await getDocs(query(collection(getFirebaseDb(), 'organizations', resolvedOrgId, 'audit'), orderBy('createdAt', 'desc'), limit(12)));
          recentAudit = auditSnap.docs.map(item => ({ id: item.id, ...(item.data() as Omit<AuditNotification, 'id'>) }));
        } catch { recentAudit = []; }
        if (cancelled) return;
        setRole(resolvedRole);
        setOrganization(org);
        setData(dashboard);
        setNotifications(recentAudit);
      } catch (err) {
        if (cancelled) return;
        setRole(null); setOrganization(null); setError(err instanceof Error ? err.message : 'Unable to load this workspace.'); setData(null);
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [authReady, organizationId, user]);

  const companyName = organization?.name || 'Your company';
  const ownerName = useMemo(() => user?.displayName || user?.email?.split('@')[0] || 'Workspace owner', [user]);
  const visibleModules = role ? modules.filter(([, key]) => modulesForRole(role).includes(key as ModuleKey)) : [];
  const unreadCount = notifications.filter(item => !readIds.includes(item.id)).length;

  function markNotificationsRead() {
    const ids = notifications.map(item => item.id);
    setReadIds(ids);
    if (user) window.localStorage.setItem(`bizmate:notification-read:${user.uid}`, JSON.stringify(ids));
  }

  useEffect(() => { if (role && !canAccessModule(role, active)) setActive('overview'); }, [role, active]);

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
      <nav>
        {visibleModules.map(([label, key, href]) => <a key={key} href={href} className={active === key ? 'active' : ''} onClick={() => setActive(key)}>{label}</a>)}
        <a href="/dashboard/actions" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}><span>⚡ Action Center</span>{pendingApprovalCount ? <b style={{minWidth:18,height:18,padding:'0 5px',borderRadius:99,display:'grid',placeItems:'center',background:'#ff647c',color:'#07111f',fontSize:8,fontWeight:900}}>{pendingApprovalCount > 99 ? '99+' : pendingApprovalCount}</b> : null}</a>
      </nav>
      <div className="side-bottom"><a href={canAccessModule(role, 'settings') ? '/dashboard/settings' : '/dashboard'}>⚙ Settings</a><a href="/dashboard/knowledge">❔ Academy & Help</a><small>{ownerName} · {role}</small><small>Created by MAHMUD ELATVIL</small></div>
    </aside>
    <section className="biz-content">
      <header className="biz-header"><div><small>{companyName} / {active}</small><h1>{labelFor(active)}</h1></div><div className="header-actions"><input placeholder="Search your company..."/><button className="notification-button" aria-label="Company notifications" onClick={() => { setNotificationsOpen(current => !current); markNotificationsRead(); }}>◉{unreadCount ? <i>{unreadCount > 9 ? '9+' : unreadCount}</i> : null}</button><button aria-label="Ask BIZMATE" onClick={() => setAssistant(true)}>✦</button><div className="avatar">{ownerName.slice(0, 2).toUpperCase()}</div></div></header>
      {notificationsOpen && <div className="notification-panel"><div className="notification-head"><div><small>BIZMATE / ALERTS</small><h3>Company notifications</h3></div><button onClick={() => setNotificationsOpen(false)}>×</button></div>{notifications.length ? notifications.slice(0, 8).map(item => <div className={`notification-item ${readIds.includes(item.id) ? 'read' : 'unread'}`} key={item.id}><span>•</span><div><b>{formatAuditTitle(item)}</b><p>{item.actorId ? `Actor ${item.actorId.slice(0, 8)}` : 'Company activity'} · {formatDate(item.createdAt)}</p></div></div>) : <div className="notification-empty"><b>No new company alerts</b><p>Important workspace events will appear here.</p></div>}</div>}
      {active === 'overview' ? <>
        <section className="welcome"><div><span>● LIVE BUSINESS PULSE</span><h2>Welcome back, {ownerName}.</h2><p>{insights.length ? `BIZMATE found ${insights.length} business signals for ${companyName}.` : `Your ${companyName} workspace is connected and ready for business data.`}</p></div><button className="ask" onClick={() => setAssistant(true)}>✦ Ask BIZMATE</button></section>
        <div className="metrics"><Metric title="Business Health" value={`${metrics.healthScore}/100`} trend={metrics.healthScore >= 75 ? 'Healthy' : 'Needs attention'} /><Metric title="Pipeline Value" value={formatMoney(metrics.pipelineValue, organization.currency)} trend="Company-scoped"/><Metric title="Active Customers" value={String(metrics.activeCustomers)} trend={customers.length ? `${customers.length} total tracked` : 'Add customers'} /><Metric title="Projects at Risk" value={String(metrics.projectsAtRisk)} trend={metrics.projectsAtRisk ? 'Needs attention' : 'On track'} /></div>