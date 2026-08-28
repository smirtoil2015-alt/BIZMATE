'use client';

import { useState } from 'react';
import { demoCustomers, demoInsights, demoOrganization, demoProjects } from '@/lib/demo-data';

const modules = ['Overview','Intelligence','Customers','Projects','People','Finance','Automations','Knowledge','Reports'];

export default function Dashboard() {
  const [active, setActive] = useState('Overview');
  const [assistant, setAssistant] = useState(false);
  return <main className="biz-dashboard">
    <aside className="biz-sidebar">
      <a href="/" className="biz-brand"><span>B</span>BIZMATE</a>
      <div className="company"><b>{demoOrganization.name}</b><small>Executive workspace</small></div>
      <nav>{modules.map(m => <button key={m} className={active === m ? 'active' : ''} onClick={() => setActive(m)}>{m}</button>)}</nav>
      <div className="side-bottom"><button>⚙ Settings</button><button>❔ Academy & Help</button><small>Alex Morgan · Owner</small></div>
    </aside>
    <section className="biz-content">
      <header className="biz-header"><div><small>BIZMATE / {active}</small><h1>{active}</h1></div><div className="header-actions"><input placeholder="Search your company..."/><button>◔</button><button className="avatar">AM</button></div></header>
      {active === 'Overview' ? <>
        <section className="welcome"><div><span>● LIVE BUSINESS PULSE</span><h2>Good morning, Alex.</h2><p>Your company is performing strongly. BIZMATE found 3 items that deserve attention.</p></div><button className="ask" onClick={() => setAssistant(true)}>✦ Ask BIZMATE</button></section>
        <div className="metrics"><Metric title="Business Health" value="87/100" trend="+4.8%"/><Metric title="Revenue" value="$428.6K" trend="+18.4%"/><Metric title="Customers" value={String(demoCustomers.length)} trend="+12.5%"/><Metric title="Projects" value={String(demoProjects.length)} trend="2 at risk"/></div>
        <div className="two-col"><Panel title="What needs your attention">{demoInsights.map(i => <div className="insight" key={i.id}><strong>{i.severity.toUpperCase()}</strong><div><b>{i.title}</b><p>{i.description}</p></div><em>{i.metric}</em></div>)}</Panel><Panel title="Company activity"><Activity text="Atlas Platform moved to 78%" time="12 min ago"/><Activity text="New sales opportunity added" time="48 min ago"/><Activity text="Finance report generated" time="2 hr ago"/><Activity text="3 customer follow-ups completed" time="4 hr ago"/></Panel></div>
        <div className="two-col"><Panel title="Projects">{demoProjects.map(p => <div className="project" key={p.id}><div><b>{p.name}</b><small>{p.status} · due {p.dueDate}</small></div><div className="bar"><span style={{width: `${p.progress}%`}}/></div><strong>{p.progress}%</strong></div>)}</Panel><div className="ai-card"><span>✦</span><h3>BIZMATE Intelligence</h3><p>Understand what is happening, why it matters, and what to do next.</p><button onClick={() => setAssistant(true)}>Open Intelligence →</button></div></div>
      </> : <section className="coming"><span>✦</span><h2>{active}</h2><p>This workspace is part of the BIZMATE platform. Its production data layer will be connected to the company workspace in the next build phase.</p><div><b>Company-scoped</b><b>Permissions-ready</b><b>AI-ready</b></div></section>}
    </section>
    {assistant && <div className="overlay" onClick={() => setAssistant(false)}><div className="assistant" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setAssistant(false)}>×</button><span>✦ BIZMATE INTELLIGENCE</span><h2>Your business copilot</h2><p>Ask about revenue, customers, projects, risks, opportunities, or what your company should do next.</p><div className="prompt"><input placeholder="Ask BIZMATE..."/><button>Send</button></div><small>AI actions will be permission-aware and approval-first.</small></div></div>}
  </main>;
}
function Metric({title,value,trend}:{title:string;value:string;trend:string}){return <div className="metric"><small>{title}</small><strong>{value}</strong><span>{trend}</span></div>}
function Panel({title,children}:{title:string;children:React.ReactNode}){return <section className="panel"><div className="panel-title"><h3>{title}</h3><button>View all →</button></div>{children}</section>}
function Activity({text,time}:{text:string;time:string}){return <div className="activity"><span/> <div><b>{text}</b><small>{time}</small></div></div>}
