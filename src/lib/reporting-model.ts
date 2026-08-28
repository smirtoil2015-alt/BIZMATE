export interface KPI {
  id: string;
  organizationId: string;
  name: string;
  value: number;
  unit: 'number' | 'currency' | 'percent';
  trend: 'up' | 'down' | 'flat';
  changePercent: number;
  period: string;
}

export interface ReportDefinition {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  sections: string[];
  schedule?: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
}

export function kpiDirection(changePercent: number): KPI['trend'] {
  if (changePercent > 0.5) return 'up';
  if (changePercent < -0.5) return 'down';
  return 'flat';
}
