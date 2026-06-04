import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function Login() {
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
    <div
      className="min-h-screen flex items-center justify-center px-[20px]"
      style={{ backgroundColor: '#080808' }}
    >
      <div className="w-full max-w-[400px]">
        <h1
          className="text-[32px] mb-[8px] text-center"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            color: '#f0f0ec',
            letterSpacing: '0.06em',
          }}
        >
          CastView
        </h1>
        <p
          className="text-[11px] mb-[32px] text-center uppercase tracking-[0.1em]"
          style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
        >
          Agency Login
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-[16px]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-[12px] py-[12px] bg-[#111111] border border-[#2a2a2a] rounded-[4px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: '#f0f0ec',
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
              className="w-full px-[12px] py-[12px] bg-[#111111] border border-[#2a2a2a] rounded-[4px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: '#f0f0ec',
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
            className="w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: '#f0f0ec',
              color: '#080808',
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
              color: '#888880',
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
              className="w-full px-[12px] py-[10px] bg-[#111111] border border-[#2a2a2a] rounded-[4px]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#f0f0ec', outline: 'none' }}
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
          style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
        >
          No account yet?{' '}
          <Link to="/signup" style={{ color: '#f0f0ec', textDecoration: 'none' }}>
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
              color: '#555550',
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
              color: '#555550',
              textDecoration: 'none',
              letterSpacing: '0.05em',
            }}
          >
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}
