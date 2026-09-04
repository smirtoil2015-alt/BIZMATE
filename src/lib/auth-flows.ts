export type LocalUser = {
  uid: string;
  isAnonymous: true;
};

const KEY = 'bizmate.local-user';

export async function ensureAnonymousSession(): Promise<LocalUser> {
  if (typeof window !== 'undefined') {
    const existing = window.localStorage.getItem(KEY);
    if (existing) {
      try { return JSON.parse(existing) as LocalUser; } catch { /* recreate */ }
    }
  }
  const user = { uid: `local_${crypto.randomUUID()}`, isAnonymous: true as const };
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export async function registerWithEmail(_email: string, _password: string): Promise<LocalUser> {
  return ensureAnonymousSession();
}

export async function loginWithEmail(_email: string, _password: string): Promise<LocalUser> {
  return ensureAnonymousSession();
}

export function logout() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
}
