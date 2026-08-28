export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export function isOverdue(task: Task, today = new Date()) {
  return Boolean(task.dueDate && task.status !== 'done' && new Date(task.dueDate) < today);
}
