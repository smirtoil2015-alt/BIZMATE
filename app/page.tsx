const features = [
  ["01", "Business Intelligence", "See the health of your company, identify what needs attention, and turn data into clear priorities."],
  ["02", "AI Business Partner", "Ask BIZMATE why something changed, what to do next, and get answers grounded in your company data."],
  ["03", "Action & Automation", "Turn decisions into workflows with approvals, assignments, alerts, and repeatable automations."],
  ["04", "Company Memory", "Keep decisions, documents, projects, customers, and operational context connected in one knowledge layer."],
  ["05", "Executive Command Center", "Give owners and managers a focused view of revenue, people, projects, risks, and opportunities."],
  ["06", "Global by Design", "Multi-language, multi-currency, time-zone aware, and built with a path toward global teams and enterprise use."],
];

function Logo() {
  return <div className="logo" aria-label="BIZMATE">B</div>;
}

export default function Home() {
  return (
    <main className="page">
      <nav className="nav">
        <div className="brand"><Logo /> BIZMATE</div>
        <div className="navlinks">
          <a href="#platform">Platform</a>
          <a href="#intelligence">Intelligence</a>
          <a href="#security">Security</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="navactions">
          <button className="btn">Sign in</button>
          <button className="btn primary">Start free</button>
        </div>
      </nav>

      <section className="hero">
        <div>
          <div className="eyebrow"><span className="dot" /> Built for modern business</div>
          <h1>Run your company with <span className="gradient">one intelligent mind.</span></h1>
          <p className="lead">BIZMATE brings business intelligence, AI assistance, workflows, company knowledge and executive decision-making into one powerful operating system.</p>
          <div className="cta">
            <button className="btn primary">Create your company →</button>
            <button className="btn">Explore the platform</button>
          </div>
          <div className="trust"><span>✓ Built for teams</span><span>✓ Approval-first automation</span><span>✓ Enterprise-ready foundation</span></div>
        </div>

        <div className="window" aria-label="BIZMATE dashboard preview">
          <div className="windowbar"><i/><i/><i/></div>
          <div className="dashboard">
            <aside className="side">
              <h4>BIZMATE</h4>
              <div className="active">Overview</div><div>Intelligence</div><div>Customers</div><div>Projects</div><div>People</div><div>Finance</div><div>Automations</div><div>Knowledge</div>
            </aside>
            <div className="main">
              <div className="score"><div className="scoretop"><span>Business Health</span><span>Live</span></div><strong>87<span style={{fontSize:18,color:"#6df5a9"}}>/100</span></strong><div style={{color:"#71869c",fontSize:10}}>Strong performance · 4 areas need attention</div></div>
              <div className="minirow"><div className="card"><small>Revenue</small><b>+18.4%</b></div><div className="card"><small>Open risks</small><b>03</b></div><div className="card"><small>Tasks done</small><b>91%</b></div></div>
              <div className="insights">
                <div className="insight"><span className="tag">● PRIORITY</span><h5>3 high-value customers need follow-up</h5><p>BIZMATE found a drop in recent engagement.</p></div>
                <div className="insight"><span className="tag">● RISK</span><h5>Project Atlas is trending late</h5><p>Deadline risk increased over the last 7 days.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="platform">
        <div className="sectionhead"><div className="kicker">The operating layer</div><h2>From scattered work to one clear business picture.</h2><p>BIZMATE is designed around the problems leaders actually face: fragmented information, slow decisions, missed follow-ups and too many tools that do not understand each other.</p></div>
        <div className="features">
          {features.map(([num,title,text]) => <article className="feature" key={num}><div className="icon">{num}</div><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className="section" id="intelligence">
        <div className="sectionhead"><div className="kicker">BIZMATE Intelligence</div><h2>Ask what is happening. Understand why. Decide what comes next.</h2><p>The product will be built around grounded business context, permissions and human approval for sensitive actions — not a generic chatbot dropped into a dashboard.</p></div>
      </section>

      <footer className="footer" id="security"><span>© 2026 BIZMATE</span><span>Created by MAHMUD ELATVIL</span><span>Intelligent Operating System for Business</span></footer>
    </main>
  );
}
