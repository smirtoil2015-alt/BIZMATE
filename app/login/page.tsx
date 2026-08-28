'use client';

import { FormEvent, useState } from 'react';
import { loginWithEmail } from '@/lib/auth-flows';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await loginWithEmail(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page"><section className="auth-card"><a href="/" className="auth-brand"><span>B</span>BIZMATE</a><p className="auth-kicker">BUSINESS OPERATING SYSTEM</p><h1>Welcome back.</h1><p className="auth-copy">Sign in to your company workspace and continue where your team left off.</p><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@company.com" /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" /></label>{error && <div className="auth-error">{error}</div>}<button className="auth-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in →'}</button></form><p className="auth-foot">Need an account? <a href="/signup">Create your company</a></p></section></main>;
}
