export type WorkspaceRole = 'owner' | 'accountant' | 'manager' | 'employee';

export interface LocalWorkspace {
  id: string;
  name: string;
  role: WorkspaceRole;
  locale: string;
  createdAt: string;
}

const KEY = 'bizmate.workspace';

export function getLocalWorkspace(): LocalWorkspace {
  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      try { return JSON.parse(raw) as LocalWorkspace; } catch { /* recreate */ }
    }
  }
  const workspace: LocalWorkspace = {
    id: `workspace_${crypto.randomUUID()}`,
    name: 'BIZMATE Workspace',
    role: 'owner',
    locale: typeof navigator !== 'undefined' ? navigator.language : 'ar',
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(workspace));
  return workspace;
}

export function setWorkspaceRole(role: WorkspaceRole) {
  const workspace = getLocalWorkspace();
  const next = { ...workspace, role };
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearLocalWorkspace() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
}
