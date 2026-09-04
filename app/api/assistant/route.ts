import { NextResponse } from 'next/server';
import { createOpenAICompatibleProvider } from '@/lib/ai-provider';

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      question?: string;
      context?: unknown;
    };

    const question = String(body.question ?? '').trim();
    if (!question) return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    if (question.length > 4000) return NextResponse.json({ error: 'Question is too long.' }, { status: 400 });

    const context = body.context;
    if (!context || typeof context !== 'object') {
      return NextResponse.json({ error: 'Company context is required.' }, { status: 400 });
    }

    const provider = createOpenAICompatibleProvider();
    if (!provider) {
      return NextResponse.json({
        answer: 'لم يتم تفعيل مزود الذكاء الاصطناعي بعد. لكن يمكنك استخدام التحليل المباشر لبيانات شركتك من داخل BIZMATE.',
        mode: 'data-only',
      });
    }

    const response = await provider.chat([
      {
        role: 'system',
        content: [
          'You are BIZMATE, an executive AI business partner.',
          'Answer in the same language as the user, preferably Arabic when the user writes Arabic.',
          'Use only the supplied company context. Never invent company facts, numbers, people, customers, projects, revenue, or risks.',
          'Clearly distinguish confirmed data from recommendations.',
          'Never execute or claim to execute actions. Money, communication, access, deletion, and other high-impact actions require explicit approval.',
          'Give concise, practical executive answers with clear next steps when useful.',
          `COMPANY CONTEXT:\n${JSON.stringify(context)}`,
        ].join('\n\n'),
      },
      { role: 'user', content: question },
    ]);

    return NextResponse.json({ answer: response.content, mode: 'ai', model: response.model });
  } catch (error) {
    console.error('BIZMATE assistant error', error);
    return NextResponse.json({ error: 'Unable to answer right now.' }, { status: 500 });
  }
}
