import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { supabase } from '../../lib/supabase';
import { rememberPlanFromUrl } from '../../lib/pendingPlan';
import { useAuth } from '../context/AuthContext';
import { GoogleGIcon } from './GoogleGIcon';

type AuthTab = 'login' | 'signup';

const inputClass =
  'w-full px-[12px] py-[12px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]';
const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  color: 'var(--cv-primary-text)',
  outline: 'none',
};
const footerLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  color: 'var(--cv-secondary-text)',
  textDecoration: 'none',
  letterSpacing: '0.05em',
};

// Single entry point for auth: castview.org sends every LOG IN / START FREE
// TRIAL / pricing button here. ?tab=signup opens the sign-up tab, and
// ?upgrade=<tier> carries a pricing-section plan through to Stripe checkout.
export function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: AuthTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { signInWithGoogle, user, session, loading } = useAuth();

  useEffect(() => {
    rememberPlanFromUrl();
  }, []);

  const switchTab = (next: AuthTab) => {
    setErrorMsg('');
    const params = new URLSearchParams(searchParams);
    if (next === 'signup') params.set('tab', 'signup');
    else params.delete('tab');
    setSearchParams(params, { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMsg(error);
      setGoogleLoading(false);
    }
    // on success, the browser redirects away to Google — no further action needed here
  };

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    background: 'none',
    border: 'none',
    borderBottom: `1px solid ${active ? 'var(--cv-primary-text)' : 'transparent'}`,
    color: active ? 'var(--cv-primary-text)' : 'var(--cv-secondary-text)',
    padding: '0 0 10px',
    cursor: 'pointer',
  });

  // Already signed in (e.g. returning from an email confirmation link).
  if (!loading && user && session) return <Navigate to="/" replace />;

  return (
    <>
      <a
        href="https://castview.org"
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--cv-secondary-text)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          zIndex: 10,
        }}
      >
        ← BACK
      </a>
      <div
        className="min-h-screen flex items-center justify-center px-[20px] py-[64px]"
        style={{ backgroundColor: 'var(--cv-background)' }}
      >
        <div className="w-full max-w-[400px]">
          <h1
            className="text-[32px] mb-[8px] text-center"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              color: 'var(--cv-primary-text)',
              letterSpacing: '0.06em',
            }}
          >
            CastView
          </h1>
          <p
            className="text-[11px] mb-[32px] text-center uppercase tracking-[0.1em]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            {tab === 'signup' ? 'Start your 14-day free trial' : 'Agency Login'}
          </p>

          <div
            role="tablist"
            className="flex justify-center gap-[32px] mb-[28px] border-b border-[var(--cv-subtle-border)]"
          >
            <button type="button" role="tab" aria-selected={tab === 'login'} onClick={() => switchTab('login')} style={tabButtonStyle(tab === 'login')}>
              Log in
            </button>
            <button type="button" role="tab" aria-selected={tab === 'signup'} onClick={() => switchTab('signup')} style={tabButtonStyle(tab === 'signup')}>
              Sign up
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-[14px] mb-[24px] rounded-[4px] text-[13px] transition-opacity hover:opacity-80 flex items-center justify-center gap-[10px]"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)',
              opacity: googleLoading ? 0.6 : 1,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            <GoogleGIcon size={16} />
            {googleLoading
              ? 'Redirecting...'
              : tab === 'signup'
                ? 'Sign up with Google'
                : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-[12px] mb-[24px]">
            <div className="flex-1 h-[1px]" style={{ backgroundColor: 'var(--cv-subtle-border)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}>
              {tab === 'signup' ? 'or create an account with email' : 'or sign in with email'}
            </span>
            <div className="flex-1 h-[1px]" style={{ backgroundColor: 'var(--cv-subtle-border)' }} />
          </div>

          {errorMsg && (
            <p className="mb-[16px] text-[12px]" style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}>
              {errorMsg}
            </p>
          )}

          {tab === 'signup' ? (
            <SignupForm onSwitchToLogin={() => switchTab('login')} />
          ) : (
            <LoginForm />
          )}

          {tab === 'signup' && (
            <p className="mt-[24px] text-center text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}>
              No credit card required · Cancel anytime
            </p>
          )}

          <div style={{ marginTop: '32px', textAlign: 'center', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <a href="/privacy" style={footerLinkStyle}>Privacy Policy</a>
            <a href="/terms" style={footerLinkStyle}>Terms of Service</a>
          </div>
        </div>
      </div>
    </>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: 'https://app.castview.org/reset-password',
    });
    setForgotLoading(false);
    setForgotSent(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const { error } = await signIn(email, password);
    if (error) setErrorMsg(error);
    else navigate('/');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-[16px]">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className={inputClass} style={inputStyle} />
      </div>
      <div className="mb-[24px]">
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className={inputClass} style={inputStyle} />
      </div>

      {errorMsg && (
        <p className="mb-[16px] text-[12px]" style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}>
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        className="w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[var(--cv-elevated)]"
        style={{
          fontFamily: 'var(--font-mono)',
          backgroundColor: 'transparent',
          color: 'var(--cv-primary-text)',
          border: '1px solid var(--cv-subtle-border)',
        }}
      >
        Sign In
      </button>

      {!showForgot ? (
        <button
          type="button"
          onClick={() => setShowForgot(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--cv-secondary-text)',
            padding: 0,
            marginTop: '12px',
          }}
        >
          Forgot password?
        </button>
      ) : forgotSent ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#4a7a4a', marginTop: '12px' }}>
          ✓ Check your email for a reset link.
        </p>
      ) : (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            className="w-full px-[12px] py-[10px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-primary-text)', outline: 'none' }}
          />
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={forgotLoading || !forgotEmail}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#C8A96E',
              padding: 0,
              textAlign: 'left',
            }}
          >
            {forgotLoading ? 'Sending...' : 'Send reset link →'}
          </button>
        </div>
      )}
    </form>
  );
}

function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setNeedsConfirmation(false);
    if (password.length < 8) { setErrorMsg('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setErrorMsg('Passwords do not match'); return; }
    if (!agencyName.trim()) { setErrorMsg('Agency name is required'); return; }
    setLoading(true);
    const result = await signUp(email, password, agencyName.trim());
    setLoading(false);
    if (result.error) {
      setErrorMsg(result.error);
    } else if (result.needsConfirmation) {
      setNeedsConfirmation(true);
    } else {
      navigate('/');
    }
  };

  if (needsConfirmation) {
    return (
      <div className="text-center">
        <p className="mb-[24px] text-[13px] leading-relaxed" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}>
          Check your email to confirm your account, then log in.
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="inline-block py-[14px] px-[24px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
          style={{
            fontFamily: 'var(--font-mono)',
            backgroundColor: 'var(--cv-primary-text)',
            color: 'var(--cv-background)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Go to Sign In →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-[16px]">
        <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Agency name" required className={inputClass} style={inputStyle} />
      </div>
      <div className="mb-[16px]">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work email" required className={inputClass} style={inputStyle} />
      </div>
      <div className="mb-[16px]">
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 8 characters)" required className={inputClass} style={inputStyle} />
      </div>
      <div className="mb-[24px]">
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required className={inputClass} style={inputStyle} />
      </div>
      {errorMsg && (
        <p className="mb-[16px] text-[12px]" style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}>
          {errorMsg}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[var(--cv-elevated)]"
        style={{
          fontFamily: 'var(--font-mono)',
          backgroundColor: 'transparent',
          color: 'var(--cv-primary-text)',
          border: '1px solid var(--cv-subtle-border)',
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Creating account...' : 'Start Free Trial →'}
      </button>
    </form>
  );
}
