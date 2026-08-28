export interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string; }

export interface AIProviderResponse { content: string; model?: string; usage?: { inputTokens?: number; outputTokens?: number }; }

export interface AIProvider {
  chat(messages: AIMessage[]): Promise<AIProviderResponse>;
}

export function createOpenAICompatibleProvider(): AIProvider | null {
  const endpoint = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  if (!endpoint || !apiKey) return null;

  return {
    async chat(messages) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: process.env.AI_MODEL ?? 'default', messages }),
      });
      if (!response.ok) throw new Error(`AI provider request failed: ${response.status}`);
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; model?: string; usage?: AIProviderResponse['usage'] };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('AI provider returned no content.');
      return { content, model: data.model, usage: data.usage };
    },
  };
}
