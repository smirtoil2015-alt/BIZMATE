import { commandItems } from '@/lib/command-center';

const workflows = [
  { name: 'New lead follow-up', trigger: 'Customer created', actions: 3, status: 'active' },
  { name: 'At-risk project alert', trigger: 'Progress below 60%', actions: 2, status: 'active' },
  { name: 'Finance approval', trigger: 'Expense above threshold', actions: 1, status: 'approval required' },
];

export default function AutomationsPage() {
  return <main className="module-page"><header><div><small>BIZMATE / AUTOMATIONS</small><h1>Automations</h1><p>Turn repetitive work into controlled workflows with approval gates.</p></div><button className="primary">+ New workflow</button></header><section className="summary-row"><div><span>Active workflows</span><strong>{workflows.filter(w=>w.status==='active').length}</strong></div><div><span>Actions available</span><strong>{commandItems.length}</strong></div><div><span>Approval-first</span><strong>ON</strong></div></section><section className="data-card"><div className="data-head"><h2>Workflow library</h2><input placeholder="Search workflows..."/></div><div className="table"><div className="tr th"><span>Workflow</span><span>Trigger</span><span>Actions</span><span>Status</span></div>{workflows.map(w=><div className="tr" key={w.name}><span><b>{w.name}</b><small>Company automation</small></span><span>{w.trigger}</span><span>{w.actions}</span><span><em className={`status ${w.status==='active'?'active':'invited'}`}>{w.status}</em></span></div>)}</div></section></main>;
}
