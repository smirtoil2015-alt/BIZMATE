import type { KnowledgeDocument } from '@/lib/knowledge-model';

const documents: KnowledgeDocument[] = [
  { id:'d1', organizationId:'org_demo', title:'Company Operations Handbook', type:'guide', status:'ready', tags:['operations','team'], createdAt:'2026-08-10', updatedAt:'2026-08-21' },
  { id:'d2', organizationId:'org_demo', title:'Enterprise Contract Template', type:'contract', status:'ready', tags:['legal','sales'], createdAt:'2026-08-08', updatedAt:'2026-08-18' },
  { id:'d3', organizationId:'org_demo', title:'Q3 Executive Report', type:'report', status:'processing', tags:['finance','executive'], createdAt:'2026-08-28', updatedAt:'2026-08-28' },
];

export default function KnowledgePage() {
  return <main className="module-page"><header><div><small>BIZMATE / KNOWLEDGE</small><h1>Knowledge</h1><p>Build a searchable company memory for people, decisions and AI assistance.</p></div><button className="primary">+ Upload document</button></header><section className="summary-row"><div><span>Documents</span><strong>{documents.length}</strong></div><div><span>Ready for AI</span><strong>{documents.filter(d=>d.status==='ready').length}</strong></div><div><span>Tags</span><strong>{new Set(documents.flatMap(d=>d.tags)).size}</strong></div></section><section className="data-card"><div className="data-head"><h2>Company knowledge</h2><input placeholder="Search documents..."/></div><div className="table"><div className="tr th"><span>Document</span><span>Type</span><span>Status</span><span>Updated</span></div>{documents.map(d=><div className="tr" key={d.id}><span><b>{d.title}</b><small>{d.tags.join(' · ')}</small></span><span>{d.type}</span><span><em className={`status ${d.status==='ready'?'active':'invited'}`}>{d.status}</em></span><span>{d.updatedAt}</span></div>)}</div></section></main>;
}
