export interface KnowledgeDocument {
  id: string;
  organizationId: string;
  title: string;
  type: 'policy' | 'contract' | 'report' | 'guide' | 'other';
  status: 'processing' | 'ready' | 'archived';
  ownerId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSearchResult {
  documentId: string;
  title: string;
  snippet: string;
  score: number;
}

export function rankKnowledgeResults(results: KnowledgeSearchResult[]) {
  return [...results].sort((a, b) => b.score - a.score);
}
