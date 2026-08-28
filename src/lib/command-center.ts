export type CommandAction =
  | 'create_customer'
  | 'create_project'
  | 'create_task'
  | 'open_report'
  | 'open_finance'
  | 'open_intelligence'
  | 'invite_member'
  | 'search_company';

export interface CommandItem {
  id: string;
  label: string;
  description: string;
  action: CommandAction;
  shortcut?: string;
}

export const commandItems: CommandItem[] = [
  { id: 'customer', label: 'New customer', description: 'Add a customer to CRM', action: 'create_customer', shortcut: 'C' },
  { id: 'project', label: 'New project', description: 'Create a delivery project', action: 'create_project', shortcut: 'P' },
  { id: 'task', label: 'New task', description: 'Create an actionable task', action: 'create_task', shortcut: 'T' },
  { id: 'search', label: 'Search company', description: 'Find anything across your workspace', action: 'search_company', shortcut: '/' },
  { id: 'intelligence', label: 'Open Intelligence', description: 'Review risks and opportunities', action: 'open_intelligence', shortcut: 'I' },
  { id: 'finance', label: 'Open Finance', description: 'Review financial health', action: 'open_finance', shortcut: 'F' },
  { id: 'reports', label: 'Open Reports', description: 'Review KPIs and reports', action: 'open_report', shortcut: 'R' },
  { id: 'invite', label: 'Invite team member', description: 'Add a person to your company', action: 'invite_member' },
];
