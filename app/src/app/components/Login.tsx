import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { GoogleGIcon } from './GoogleGIcon';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

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
      className="min-h-screen flex items-center justify-center px-[20px]"
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
          Agency Login
        </p>

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
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-[12px] mb-[24px]">
          <div className="flex-1 h-[1px]" style={{ backgroundColor: 'var(--cv-subtle-border)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}>
            or sign in with email
          </span>
          <div className="flex-1 h-[1px]" style={{ backgroundColor: 'var(--cv-subtle-border)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-[16px]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-[12px] py-[12px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--cv-primary-text)',
              }}
            />
          </div>

          <div className="mb-[24px]">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-[12px] py-[12px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--cv-primary-text)',
              }}
            />
          </div>

          {errorMsg && (
            <p
              className="mb-[16px] text-[12px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}
            >
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
              onChange={e => setForgotEmail(e.target.value)}
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

        <p
          className="mt-[32px] text-center text-[11px]"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
        >
          No account yet?{' '}
          <Link to="/signup" style={{ color: 'var(--cv-primary-text)', textDecoration: 'none' }}>
            Start free trial →
          </Link>
        </p>

        <div style={{
          marginTop: '32px',
          textAlign: 'center',
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
        }}>
          <a
            href="/privacy"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--cv-secondary-text)',
              textDecoration: 'none',
              letterSpacing: '0.05em',
            }}
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--cv-secondary-text)',
              textDecoration: 'none',
              letterSpacing: '0.05em',
            }}
          >
            Terms of Service
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
