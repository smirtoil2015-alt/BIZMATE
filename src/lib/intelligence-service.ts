import { createOpenAICompatibleProvider, type AIMessage } from '@/lib/ai-provider';
import type { BusinessInsight, Customer, Project } from '@/types/business';

export interface IntelligenceContext { customers: Customer[]; projects: Project[]; insights: BusinessInsight[]; }

export function buildDecisionBrief(context: IntelligenceContext) {
  const atRiskProjects = context.projects.filter((p) => p.status === 'at-risk');
  const critical = context.insights.filter((i) => i.severity === 'critical');
  return {
    headline: critical.length ? `${critical.length} critical business signal${critical.length > 1 ? 's' : ''} need attention.` : 'No critical business signals detected.',
    priorities: [...critical.map((i) => i.title), ...atRiskProjects.map((p) => `Project at risk: ${p.name}`)].slice(0, 5),
    nextActions: ['Review urgent customer follow-ups', 'Review at-risk project delivery', 'Check the latest financial and sales KPIs'],
  };
}

export async function askBusinessCopilot(question: string, context: IntelligenceContext) {
  const provider = createOpenAICompatibleProvider();
  if (!provider) return { mode: 'fallback' as const, content: 'AI provider is not configured. BIZMATE can still show rule-based business insights.' };

  const messages: AIMessage[] = [
    { role: 'system', content: 'You are BIZMATE Intelligence. Separate confirmed company facts from recommendations. Be concise, business-focused, and never claim actions were performed unless they were actually executed.' },
    { role: 'user', content: JSON.stringify({ question, context }) },
  ];
  const result = await provider.chat(messages);
  return { mode: 'ai' as const, ...result };
}
