'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase-db';
import { answerFromBusinessContext, buildBusinessContext } from '@/lib/ai-business-context';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

type Props = { initialOrganizationId?: string };

const suggestions = [
  'ما وضع الشركة حالياً؟',
  'ما أهم المخاطر التي يجب أن أتابعها؟',
  'من العملاء الذين يحتاجون اهتماماً؟',
  'ما المشاريع المتأخرة أو المعرضة للخطر؟',
  'أعطني 3 أولويات للإدارة اليوم',
];

export default function AssistantChat({ initialOrganizationId = '' }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState(initialOrganizationId);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), currentUser => setUser(currentUser)), []);

  useEffect(() => {
    let cancelled = false;
    async function resolveOrganization() {
      if (!user) return;
      try {
        const profile = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
        const fromProfile = String(profile.data()?.organizationId ?? '');
        const fromStorage = typeof window !== 'undefined' ? window.localStorage.getItem('bizmate:organization') ?? '' : '';
        const resolved = fromProfile || initialOrganizationId || fromStorage;
        if (!cancelled && resolved) {
          setOrganizationId(resolved);
          window.localStorage.setItem('bizmate:organization', resolved);
        }
      } catch {
        if (!cancelled) setError('تعذر تحديد مساحة الشركة. افتح لوحة BIZMATE بعد تسجيل الدخول.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (user) resolveOrganization();
    else if (!user) setLoading(false);
    return () => { cancelled = true; };
  }, [user, initialOrganizationId]);

  const greeting = useMemo(() => {
    if (user?.displayName) return `مرحباً ${user.displayName} 👋`;
    return 'مرحباً بك في BIZMATE 👋';
  }, [user]);

  async function sendMessage(rawQuestion = question) {
    const text = rawQuestion.trim();
    if (!text || sending) return;
    setQuestion('');
    setError('');
    setMessages(prev => [...prev, { id: `${Date.now()}-u`, role: 'user', content: text }]);
    setSending(true);

    try {
      if (!organizationId) throw new Error('لا توجد مساحة شركة مرتبطة بهذا الحساب.');
      const context = await buildBusinessContext(organizationId);
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, context }),
      });
      const data = await response.json() as { answer?: string; error?: string };
      if (!response.ok) throw new Error(data.error || 'تعذر الحصول على الإجابة.');

      const answer = data.answer || answerFromBusinessContext(text, context);
      setMessages(prev => [...prev, { id: `${Date.now()}-a`, role: 'assistant', content: answer }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      setError(message);
      setMessages(prev => [...prev, {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: 'تعذر إكمال التحليل الآن. تأكد من تسجيل الدخول ووجود بيانات الشركة، ثم حاول مرة أخرى.',
      }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="data-card bizmate-chat" dir="rtl">
      <div className="data-head">
        <div>
          <span className="chat-kicker">✦ BIZMATE INTELLIGENCE</span>
          <h2>{greeting}</h2>
        </div>
        <span className={`status ${organizationId ? 'active' : ''}`}>{organizationId ? 'Company connected' : 'Connecting'}</span>
      </div>

      <div className="chat-window" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-orb">B</div>
            <h3>شو بدك تعرف عن شركتك؟</h3>
            <p>اسأل BIZMATE عن العملاء، المشاريع، المخاطر، الأولويات وأداء الشركة. الإجابات مبنية على بيانات مساحة شركتك.</p>
            <div className="suggestion-grid">
              {suggestions.map(item => (
                <button key={item} type="button" onClick={() => sendMessage(item)} disabled={sending || loading}>{item} <span>↗</span></button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <div className={`chat-message ${message.role}`} key={message.id}>
            <span className="chat-avatar">{message.role === 'assistant' ? 'B' : 'أ'}</span>
            <div><small>{message.role === 'assistant' ? 'BIZMATE' : 'أنت'}</small><p>{message.content}</p></div>
          </div>
        ))}

        {sending && <div className="chat-message assistant"><span className="chat-avatar">B</span><div><small>BIZMATE</small><p className="typing">أحلل بيانات الشركة<span>.</span><span>.</span><span>.</span></p></div></div>}
      </div>

      {error && <p className="chat-error">{error}</p>}

      <form className="chat-composer" onSubmit={event => { event.preventDefault(); void sendMessage(); }}>
        <input value={question} onChange={event => setQuestion(event.target.value)} placeholder="اكتب سؤالك عن شركتك..." disabled={sending || loading} aria-label="سؤال BIZMATE" />
        <button className="primary" type="submit" disabled={!question.trim() || sending || loading}>{sending ? '...' : 'إرسال ↗'}</button>
      </form>

      <p className="chat-note">BIZMATE لا ينفذ إجراءات حساسة تلقائياً. أي إجراء مالي أو حذف أو رسالة أو تغيير صلاحيات يحتاج موافقة صريحة.</p>
    </section>
  );
}
