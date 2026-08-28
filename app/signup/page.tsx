'use client';

import { FormEvent, useState } from 'react';
import { registerWithEmail } from '@/lib/auth-flows';
import { createOrganizationForOwner } from '@/lib/company-onboarding';

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [country, setCountry] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const credential = await registerWithEmail(email, password);
      const organizationId = await createOrganizationForOwner(credential.user.uid, {
        companyName: name,
        industry,
        country,
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        locale: navigator.language || 'en-US',
      });
      window.location.href = `/dashboard?org=${organizationId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your company.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page"><section className="auth-card wide"><a href="/" className="auth-brand"><span>B</span>BIZMATE</a><p className="auth-kicker">START YOUR WORKSPACE</p><h1>{step === 1 ? 'Create your BIZMATE account.' : 'Tell us about your company.'}</h1><p className="auth-copy">One setup. One workspace. A clear operating picture for your team.</p><form onSubmit={step === 1 ? e => { e.preventDefault(); setError(''); setStep(2); } : submit}>{step === 1 ? <><label>Your name<input value={name} onChange={e=>setName(e.target.value)} required placeholder="Alex Morgan" /></label><label>Work email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@company.com" /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required placeholder="At least 8 characters" /></label><button className="auth-submit">Continue →</button></> : <><label>Company name<input value={name} onChange={e=>setName(e.target.value)} required placeholder="Acme Group" /></label><label>Industry<select value={industry} onChange={e=>setIndustry(e.target.value)}><option>Technology</option><option>Retail</option><option>Professional Services</option><option>Construction</option><option>Marketing</option><option>Manufacturing</option><option>Healthcare</option><option>Education</option><option>Other</option></select></label><label>Country<input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Turkey" /></label>{error && <div className="auth-error">{error}</div>}<div className="form-actions"><button type="button" className="auth-secondary" onClick={()=>setStep(1)}>Back</button><button className="auth-submit" disabled={busy}>{busy ? 'Creating workspace…' : 'Create company →'}</button></div></>}</form><p className="auth-foot">Already have an account? <a href="/login">Sign in</a></p></section><style jsx>{` .auth-page{min-height:100vh;display:grid;place-items:center;padding:28px;background:radial-gradient(circle at 50% 15%,rgba(66,217,255,.10),transparent 35%),#07111f;color:#eef6ff;font-family:Inter,system-ui,sans-serif}.auth-card{width:min(460px,100%);padding:38px;border:1px solid #1d344b;border-radius:24px;background:rgba(11,26,43,.92);box-shadow:0 30px 90px rgba(0,0,0,.36)}.auth-card.wide{width:min(520px,100%)}.auth-brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-size:21px;font-weight:900}.auth-brand span{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,#42d9ff,#9d8cff);color:#07111f}.auth-kicker{margin:28px 0 7px;color:#42d9ff;font-size:9px;letter-spacing:.18em;font-weight:800}.auth-card h1{font-size:36px;line-height:1.05;letter-spacing:-.05em;margin:0 0 10px}.auth-copy{color:#8195a9;font-size:13px;line-height:1.7;margin:0 0 24px}.auth-card form{display:grid;gap:16px}.auth-card label{display:grid;gap:7px;color:#a7b8c9;font-size:11px;font-weight:700}.auth-card input,.auth-card select{width:100%;box-sizing:border-box;background:#071522;border:1px solid #1d344b;color:#eef6ff;border-radius:11px;padding:13px 14px;outline:none}.auth-card input:focus,.auth-card select:focus{border-color:#42d9ff;box-shadow:0 0 0 3px rgba(66,217,255,.08)}.auth-submit,.auth-secondary{border:0;border-radius:11px;padding:13px 16px;font-weight:800;cursor:pointer}.auth-submit{background:linear-gradient(135deg,#42d9ff,#6e9cff);color:#07111f}.auth-submit:disabled{opacity:.55;cursor:not-allowed}.auth-secondary{background:#102235;color:#b8c8d7;border:1px solid #1d344b}.form-actions{display:flex;gap:10px}.form-actions .auth-submit{flex:1}.auth-error{background:rgba(255,113,139,.08);border:1px solid rgba(255,113,139,.3);color:#ffb4c1;border-radius:10px;padding:10px;font-size:11px}.auth-foot{margin:18px 0 0;color:#657b91;font-size:11px;text-align:center}.auth-foot a{color:#42d9ff;text-decoration:none}`}</style></main>;
}
