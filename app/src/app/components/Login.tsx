import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

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
      </div>
    </div>
  );
}
