import AssistantChat from './assistant-chat';
import '../module.css';

export default function AssistantPage() {
  return (
    <main className="module-page">
      <header>
        <div>
          <small>BIZMATE / AI BUSINESS PARTNER</small>
          <h1>AI Business Partner</h1>
          <p>مساعد تنفيذي يفهم شركتك، يحلل بياناتها، ويحوّل الأرقام إلى قرارات واضحة.</p>
        </div>
      </header>

      <section className="ai-hero">
        <div>
          <span>● COMPANY-GROUNDED INTELLIGENCE</span>
          <h2>شركة واحدة. عقل واحد.</h2>
          <p>من العملاء والمشاريع إلى المخاطر والأولويات — اسأل BIZMATE عن أي شيء داخل مساحة شركتك.</p>
        </div>
        <div className="ai-score">
          <small>Operating Mode</small>
          <strong>LIVE</strong>
        </div>
      </section>

      <AssistantChat />
    </main>
  );
}
