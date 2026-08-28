import { demoOrganization } from '@/lib/demo-data';
import { financialSummary } from '@/lib/finance-model';

const transactions = [
  { id:'1', organizationId:'org_demo', type:'income' as const, amount:184000, currency:'USD', category:'Sales', description:'Enterprise renewal', occurredAt:'2026-08-24', status:'posted' as const },
  { id:'2', organizationId:'org_demo', type:'income' as const, amount:92000, currency:'USD', category:'Sales', description:'New contract', occurredAt:'2026-08-19', status:'posted' as const },
  { id:'3', organizationId:'org_demo', type:'expense' as const, amount:31000, currency:'USD', category:'Operations', description:'Operations', occurredAt:'2026-08-18', status:'posted' as const },
  { id:'4', organizationId:'org_demo', type:'expense' as const, amount:22000, currency:'USD', category:'Payroll', description:'Payroll', occurredAt:'2026-08-15', status:'posted' as const },
];

export default function FinancePage() { const s=financialSummary(transactions); return <main className="module-page"><header><div><small>BIZMATE / FINANCE</small><h1>Finance</h1><p>Monitor posted income, expenses and operating margin.</p></div><button className="primary">+ Add transaction</button></header><section className="summary-row"><div><span>Income</span><strong>${s.income.toLocaleString()}</strong></div><div><span>Expenses</span><strong>${s.expenses.toLocaleString()}</strong></div><div><span>Net</span><strong>${s.net.toLocaleString()}</strong></div><div><span>Currency</span><strong>{demoOrganization.currency}</strong></div></section><section className="data-card"><div className="data-head"><h2>Recent transactions</h2><button className="ghost">Export report</button></div><div className="table"><div className="tr th"><span>Description</span><span>Category</span><span>Amount</span><span>Date</span></div>{transactions.map(t=><div className="tr" key={t.id}><span><b>{t.description}</b><small>{t.type}</small></span><span>{t.category}</span><span className={t.type==='expense'?'expense':''}>{t.type==='expense'?'-':'+'}${t.amount.toLocaleString()}</span><span>{t.occurredAt}</span></div>)}</div></section></main>; }
