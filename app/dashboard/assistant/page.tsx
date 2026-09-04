import { buildBusinessContext, answerFromBusinessContext } from '@/lib/ai-business-context';

export default async function AssistantPage() {
  const demoOrganizationId = process.env.NEXT_PUBLIC_DEMO_ORGANIZATION_ID;
  const context = demoOrganizationId ? await buildBusinessContext(demoOrganizationId) : null;

  return (
    <main className="module-page">
      <header>
        <div>
          <small>BIZMATE / AI BUSINESS PARTNER</small>
          <h1>AI Business Partner</h1>
          <p>مساعد يفهم أرقام شركتك وبياناتها، وليس مجرد روبوت محادثة عام.</p>
        </div>
      </header>

      <section className="ai-hero">
        <div>
          <span>● COMPANY-GROUNDED AI</span>
          <h2>اسأل شركتك.</h2>
          <p>الردود مبنية على بيانات العملاء والمشاريع والإشارات المسجلة داخل BIZMATE.</p>
        </div>
        <div className="ai-score">
          <small>Context</small>
          <strong>{context ? 'LIVE' : 'READY'}</strong>
        </div>
      </section>

      <section className="data-card">
        <div className="data-head">
          <h2>جرّب أسئلة المدير</h2>
          <span className="status active">Approval-first</span>
        </div>
        <div className="insight-grid">
          {['ما وضع الشركة حالياً؟', 'كم عدد العملاء والمشاريع؟', 'ما هي المخاطر الحالية؟'].map((question) => (
            <article className="insight-card opportunity" key={question}>
              <span>ASK BIZMATE</span>
              <h3>{question}</h3>
              <p>{context ? answerFromBusinessContext(question, context) : 'اربط مساحة الشركة لعرض إجابة مبنية على بياناتها.'}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
