export type CustomerStatus = 'lead' | 'prospect' | 'active' | 'at-risk' | 'inactive';

export interface CustomerRecord {
  id: string;
  organizationId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: CustomerStatus;
  ownerId?: string;
  estimatedValue: number;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOpportunity {
  id: string;
  organizationId: string;
  customerId: string;
  title: string;
  stage: 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value: number;
  probability: number;
  expectedCloseAt?: string;
  ownerId?: string;
}

export function weightedPipeline(opportunities: SalesOpportunity[]) {
  return opportunities.reduce((sum, opportunity) => sum + opportunity.value * opportunity.probability, 0);
}
