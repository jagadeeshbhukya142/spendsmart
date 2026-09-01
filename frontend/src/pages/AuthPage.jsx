import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ChartLine, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Target, UserRound, WalletMinimal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePageTitle } from '../utils/usePageTitle';

export default function AuthPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { signIn, signUp, showToast } = useApp();
  const [mode, setMode] = useState(pathname === '/register' ? 'signup' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signup = mode === 'signup';
  usePageTitle(signup ? 'Create account - SpendSmart' : 'Log in - SpendSmart');

  const submit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get('email')?.trim();
    const password = data.get('password');
    const name = data.get('name')?.trim();
    if (!email || !password || (signup && !name)) return setError('Please fill in all fields.');
    setError('');
    setLoading(true);
    try {
      if (signup) await signUp({ name, email, password }); else await signIn({ email, password });
      showToast(signup ? 'Account created. Welcome to SpendSmart.' : 'Welcome back.', 'success');
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    navigate(next === 'signup' ? '/register' : '/login');
  };

  return <main className="auth-page">
    <section className="auth-intro" aria-label="SpendSmart">
      <div className="auth-intro-top">
        <div className="auth-brand"><div className="auth-brand-mark" aria-hidden="true"><WalletMinimal size={20} strokeWidth={1.9} /></div><span>Spend<span>Smart</span></span></div>
        <div className="auth-intro-copy"><p className="auth-eyebrow">Personal finance workspace</p><h1>Manage your money with clarity.</h1><p>Track transactions, plan budgets, and review your financial activity in one focused workspace.</p></div>
        <ul className="auth-feature-list">
          <li><span className="auth-feature-icon"><ChartLine size={16} strokeWidth={2} /></span>See income vs. expenses at a glance</li>
          <li><span className="auth-feature-icon"><Target size={16} strokeWidth={2} /></span>Set category budgets that flag overspend early</li>
          <li><span className="auth-feature-icon"><ShieldCheck size={16} strokeWidth={2} /></span>Your data stays private to your account</li>
        </ul>
      </div>
      <svg className="auth-intro-graphic" viewBox="0 0 360 120" fill="none" aria-hidden="true">
        <path d="M0 90 L45 68 L90 78 L135 40 L180 55 L225 20 L270 34 L315 8 L360 22" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M0 90 L45 68 L90 78 L135 40 L180 55 L225 20 L270 34 L315 8 L360 22 L360 120 L0 120 Z" fill="rgba(255,255,255,0.08)" />
      </svg>
      <p className="auth-intro-note">Your account keeps personal preferences and financial data separate from other users.</p>
    </section>
    <section className="auth-form-panel"><div className="auth-form-content"><div className="auth-mobile-brand"><div className="auth-brand-mark" aria-hidden="true"><WalletMinimal size={20} strokeWidth={1.9} /></div><span>Spend<span>Smart</span></span></div><div className="auth-mode-switch" role="tablist" aria-label="Authentication mode"><button type="button" role="tab" aria-selected={!signup} className={!signup ? 'active' : ''} onClick={() => switchMode('login')}>Log in</button><button type="button" role="tab" aria-selected={signup} className={signup ? 'active' : ''} onClick={() => switchMode('signup')}>Create account</button></div><div className="auth-form-heading"><h2>{signup ? 'Create your account' : 'Log in to SpendSmart'}</h2><p>{signup ? 'Enter your details to start organizing your finances.' : 'Enter your account details to continue.'}</p></div><form className="auth-form" onSubmit={submit} noValidate>{signup && <Field label="Full name" icon={<UserRound size={17} strokeWidth={1.9} />} name="name" placeholder="Your name" error={error} autoComplete="name" />}<Field label="Email address" icon={<Mail size={17} strokeWidth={1.9} />} name="email" type="email" placeholder="you@example.com" error={error} autoComplete="email" /><label className="form-group"><span>Password</span><div className="input-wrap"><LockKeyhole className="input-icon" size={17} strokeWidth={1.9} aria-hidden="true" /><input name="password" type={showPassword ? 'text' : 'password'} placeholder={signup ? 'At least 8 characters' : 'Enter your password'} autoComplete={signup ? 'new-password' : 'current-password'} aria-invalid={Boolean(error)} /><button className="toggle-pw" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} strokeWidth={1.9} /> : <Eye size={17} strokeWidth={1.9} />}</button></div></label>{error && <p className="form-error show" role="alert">{error}</p>}<button className="btn-auth" disabled={loading}><span>{loading ? (signup ? 'Creating account…' : 'Logging in…') : (signup ? 'Create account' : 'Log in')}</span>{!loading && <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />}</button></form><p className="auth-switch-copy">{signup ? 'Already have an account?' : 'New to SpendSmart?'} <button type="button" onClick={() => switchMode(signup ? 'login' : 'signup')}>{signup ? 'Log in' : 'Create an account'}</button></p></div></section>
  </main>;
}

function Field({ label, icon, error, ...props }) { return <label className="form-group"><span>{label}</span><div className="input-wrap"><span className="input-icon" aria-hidden="true">{icon}</span><input {...props} aria-invalid={Boolean(error)} /></div></label>; }
