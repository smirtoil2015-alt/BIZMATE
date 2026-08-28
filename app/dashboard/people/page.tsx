import { demoMembers } from '@/lib/demo-data';

export default function PeoplePage() {
  const active = demoMembers.filter((m) => m.status === 'active').length;
  return <main className="module-page"><header><div><small>BIZMATE / PEOPLE</small><h1>People</h1><p>Manage your team, roles and organizational capacity.</p></div><button className="primary">+ Invite member</button></header><section className="summary-row"><div><span>Team size</span><strong>{demoMembers.length}</strong></div><div><span>Active</span><strong>{active}</strong></div><div><span>Managers</span><strong>{demoMembers.filter(m=>m.role==='manager').length}</strong></div></section><section className="data-card"><div className="data-head"><h2>Team directory</h2><input placeholder="Search people..."/></div><div className="table"><div className="tr th"><span>Person</span><span>Role</span><span>Department</span><span>Status</span></div>{demoMembers.map(m=><div className="tr" key={m.id}><span><b>{m.name}</b><small>{m.email}</small></span><span>{m.role}</span><span>{m.department ?? '—'}</span><span><em className={`status ${m.status}`}>{m.status}</em></span></div>)}</div></section></main>;
}
