import '../module.css';
import { demoProjects } from '@/lib/demo-data';

export default function ProjectsPage() {
  return <main className="module-page"><header><div><small>BIZMATE / PROJECTS</small><h1>Projects</h1><p>See delivery progress, deadlines and project risk at a glance.</p></div><button className="primary">+ New project</button></header><section className="summary-row"><div><span>Active</span><strong>{demoProjects.filter(p=>p.status==='active').length}</strong></div><div><span>At risk</span><strong>{demoProjects.filter(p=>p.status==='at-risk').length}</strong></div><div><span>Avg. progress</span><strong>{Math.round(demoProjects.reduce((s,p)=>s+p.progress,0)/demoProjects.length)}%</strong></div></section><section className="project-list">{demoProjects.map(p=><article className="project-card" key={p.id}><div className="project-top"><div><small>{p.status.toUpperCase()}</small><h2>{p.name}</h2><p>Due {p.dueDate}</p></div><strong>{p.progress}%</strong></div><div className="progress"><span style={{width:`${p.progress}%`}}/></div><footer><span>Owner: {p.ownerId ?? 'Unassigned'}</span><span>Open project →</span></footer></article>)}</section></main>;
}
