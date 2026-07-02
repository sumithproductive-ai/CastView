import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function Signup() {
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
      <div className="min-h-screen flex items-center justify-center px-[20px]" style={{ backgroundColor: 'var(--cv-background)' }}>
      <div className="w-full max-w-[400px]">
        <h1 className="text-[32px] mb-[8px] text-center" style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)', letterSpacing: '0.06em' }}>
          CastView
        </h1>
        <p className="text-[11px] mb-[32px] text-center uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}>
          Start your 14-day free trial
        </p>
        {needsConfirmation ? (
          <div className="text-center">
            <p
              className="mb-[24px] text-[13px] leading-relaxed"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
            >
              Check your email to confirm your account, then log in.
            </p>
            <Link
              to="/login"
              className="inline-block py-[14px] px-[24px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--cv-primary-text)',
                color: 'var(--cv-background)',
                textDecoration: 'none',
              }}
            >
              Go to Sign In →
            </Link>
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-[16px]">
            <input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Agency name" required className="w-full px-[12px] py-[12px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)', outline: 'none' }} />
          </div>
          <div className="mb-[16px]">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Work email" required className="w-full px-[12px] py-[12px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)', outline: 'none' }} />
          </div>
          <div className="mb-[16px]">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min. 8 characters)" required className="w-full px-[12px] py-[12px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)', outline: 'none' }} />
          </div>
          <div className="mb-[24px]">
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" required className="w-full px-[12px] py-[12px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)', outline: 'none' }} />
          </div>
          {errorMsg && <p className="mb-[16px] text-[12px]" style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}>{errorMsg}</p>}
          <button type="submit" disabled={loading} className="w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80" style={{ fontFamily: 'var(--font-mono)', backgroundColor: 'var(--cv-primary-text)', color: 'var(--cv-background)', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer', border: 'none' }}>
            {loading ? 'Creating account...' : 'Start Free Trial →'}
          </button>
        </form>
        )}
        <p className="mt-[24px] text-center text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--cv-primary-text)', textDecoration: 'none' }}>Sign in</Link>
        </p>
        <p className="mt-[12px] text-center text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}>
          No credit card required · Cancel anytime
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
