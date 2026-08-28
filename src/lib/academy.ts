export interface LearningModule {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  role: 'all' | 'owner' | 'admin' | 'manager' | 'employee';
}

export const academyModules: LearningModule[] = [
  { id: 'getting-started', title: 'Getting started with BIZMATE', description: 'Understand your workspace and first-day setup.', durationMinutes: 5, role: 'all' },
  { id: 'executive-intelligence', title: 'Executive Intelligence', description: 'Turn company signals into priorities and decisions.', durationMinutes: 7, role: 'owner' },
  { id: 'crm', title: 'Customer management', description: 'Manage customers, opportunities and follow-ups.', durationMinutes: 6, role: 'manager' },
  { id: 'automations', title: 'Safe automation', description: 'Build workflows with approval gates.', durationMinutes: 8, role: 'admin' },
  { id: 'ai', title: 'Working with BIZMATE AI', description: 'Ask better questions and understand AI action approvals.', durationMinutes: 7, role: 'all' },
];
