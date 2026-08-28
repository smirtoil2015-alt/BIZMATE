'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { loadDashboardData } from '@/lib/dashboard-data';
import type { BusinessInsight, Project } from '@/types/business';
import '../module.css';

type SmartAlert = {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'positive';
  title: string;
  description: string;
  source: string;
  metric?: string;
};

function buildAlerts(insights: BusinessInsight[], projects: Project[]): SmartAlert[] {
  const alerts: SmartAlert[] = insights.map((item) => ({
    id: `insight-${item.id}`,
    priority: item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'high' : item.severity === 'opportunity' ? 'positive' : 'medium',
    title: item.title,
    description: item.description,
    source: 'Business Insight',
    metric: item.metric,
  }));

  projects.filter((project) => project.status === 'at-risk').forEach((project) => {
    alerts.push({
      id: `project-${project.id}`,
      priority: 'critical',
      title: `${project.name} needs attention`,
      description: 'This project is marked at-risk. Review progress, ownership and next action before the delay compounds.',
      source: 'Project Health',
      metric: `${Math.round(project.progress)}% complete`,
    });
  });

  return alerts.sort((a, b) => score(b.priority) - score(a.priority));
}

function score(priority: SmartAlert['priority']) {
  return { critical: 4, high: 3, medium: 2, positive: 1 }[priority];
}

function approvalsCollection(orgId: string) {
  return collection(getFirebaseDb(), 'organizations', orgId, 'approvals');
}

export default function AlertsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [company, setCompany] = useState('Your company');
  const [organizationId, setOrganizationId] = useState('');
  const [queued, setQueued] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      try {
        const profile = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
        const orgId = String(profile.data()?.organizationId ?? '');
        if (!orgId) throw new Error('Your account is not connected to a company workspace.');
        const orgSnap = await getDoc(doc(getFirebaseDb(), 'organizations', orgId));
        const orgName = String(orgSnap.data()?.name ?? 'Your company');
        const data = await loadDashboardData(orgId);
        const approvalSnap = await getDocs(query(approvalsCollection(orgId), where('requestedBy', '==', user.uid), where('status', '==', 'pending')));
        const pendingBySummary = new Set(approvalSnap.docs.map((item) => String(item.data().sourceAlertId ?? '')));
        if (!cancelled) {
          setOrganizationId(orgId);
          setCompany(orgName);
          setAlerts(buildAlerts(data.insights, data.projects));
          setQueued(Object.fromEntries([...pendingBySummary].filter(Boolean).map((id) => [id, true])));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load smart alerts.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [user]);

  const counts = useMemo(() => ({
    critical: alerts.filter((a) => a.priority === 'critical').length,
    high: alerts.filter((a) => a.priority === 'high').length,
    positive: alerts.filter((a) => a.priority === 'positive').length,
  }), [alerts]);

  async function queueAction(alert: SmartAlert) {
    if (!user || !organizationId || queued[alert.id]) return;
    setError('');
    setNotice('');
    try {
      const approverRole = alert.priority === 'critical' ? 'owner' : 'manager';
      await addDoc(approvalsCollection(organizationId), {
        organizationId,
        requestedBy: user.uid,
        approverRole,
        action: alert.source === 'Project Health' ? 'review_project_risk' : 'review_business_alert',
        summary: `${alert.title} — ${alert.description}`,
        sourceAlertId: alert.id,
        source: alert.source,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setQueued((current) => ({ ...current, [alert.id]: true }));
      setNotice('Action queued in the Action Center for approval.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to queue the action.');
    }
  }

  if (busy) return <main className="module-page"><div className="module-empty"><span>◌</span><h1>Analyzing business signals</h1><p>BIZMATE is evaluating your company-scoped risks and opportunities.</p></div></main>;
  if (error && !organizationId) return <main className="module-page"><div className="module-empty"><span>!</span><h1>Smart alerts unavailable</h1><p>{error}</p></div></main>;

  return <main className="module-page">
    <header><div><small>BIZMATE / SMART ALERTS</small><h1>Smart Alerts</h1><p>Priority signals generated only from the connected {company} workspace.</p></div><span className="status processing">LIVE SIGNALS</span></header>
    {notice && <div className="module-notice">{notice}</div>}
    {error && <div className="module-error">{error}</div>}
    <section className="summary-row"><div><span>Critical</span><strong>{counts.critical}</strong></div><div><span>High priority</span><strong>{counts.high}</strong></div><div><span>Opportunities</span><strong>{counts.positive}</strong></div><div><span>Total signals</span><strong>{alerts.length}</strong></div></section>
    <section className="data-card"><div className="data-head"><h2>What needs attention</h2><span>{alerts.length ? 'Ranked by urgency' : 'No active alerts'}</span></div>
      <div className="insight-grid">{alerts.map((alert) => <article className={`insight-card ${alert.priority === 'critical' ? 'critical' : alert.priority === 'high' ? 'warning' : alert.priority === 'positive' ? 'opportunity' : ''}`} key={alert.id}><div><span>{alert.priority.toUpperCase()}</span><h3>{alert.title}</h3><p>{alert.description}</p></div>{alert.metric && <strong>{alert.metric}</strong>}<small>{alert.source}</small><button onClick={() => void queueAction(alert)} disabled={Boolean(queued[alert.id])}>{queued[alert.id] ? 'Queued for approval ✓' : alert.priority === 'positive' ? 'Review opportunity →' : 'Create action →'}</button></article>)}{!alerts.length && <div className="module-empty compact"><h3>Everything is quiet.</h3><p>No critical risks or active signals were found in the current company data.</p></div>}</div>
    </section>
    <section className="data-card"><div className="data-head"><h2>How BIZMATE prioritizes</h2></div><p className="brief">Critical project risks and critical business insights rise to the top. Warnings follow, while opportunities remain visible without being confused with confirmed risks. BIZMATE queues sensitive actions for explicit approval instead of executing them automatically.</p></section>
  </main>;
}
