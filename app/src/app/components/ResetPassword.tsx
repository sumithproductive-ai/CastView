import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-[20px]" style={{ backgroundColor: '#080808' }}>
      <div className="w-full max-w-[400px]">
        <h1 className="text-[32px] mb-[8px] text-center" style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}>
          CastView
        </h1>
        <p className="text-[11px] mb-[32px] text-center uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}>
          Set a new password
        </p>
        {success ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#4a7a4a', textAlign: 'center' }}>
            ✓ Password updated. Redirecting...
          </p>
        ) : (
          <>
            <div className="mb-[16px]">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New password (min. 8 characters)"
                className="w-full px-[12px] py-[12px] bg-[#111111] border border-[#2a2a2a] rounded-[4px]"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec', outline: 'none' }}
              />
            </div>
            <div className="mb-[24px]">
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-[12px] py-[12px] bg-[#111111] border border-[#2a2a2a] rounded-[4px]"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec', outline: 'none' }}
              />
            </div>
            {error && (
              <p className="mb-[16px] text-[12px]" style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}>
                {error}
              </p>
            )}
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:opacity-80 transition-opacity"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: '#f0f0ec',
                color: '#080808',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Updating...' : 'Update Password →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
