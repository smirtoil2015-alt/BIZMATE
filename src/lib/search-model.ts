export type SearchEntity = 'customer' | 'project' | 'person' | 'document' | 'report' | 'insight';

export interface GlobalSearchResult {
  id: string;
  organizationId: string;
  entity: SearchEntity;
  title: string;
  subtitle?: string;
  url: string;
  score: number;
}

export function rankGlobalSearch(results: GlobalSearchResult[]) {
  return [...results].sort((a, b) => b.score - a.score);
}
