import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

function guessAgencyName(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null): string {
  if (!user) return 'My Agency';
  const metaName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined);
  if (metaName && metaName.trim()) return `${metaName.trim()}'s Agency`;
  const email = user.email ?? 'agency';
  const local = email.split('@')[0] ?? 'agency';
  const derived = local.replace(/[._-]/g, ' ').trim();
  return derived ? `${derived}'s Agency` : 'My Agency';
}

export function WelcomeSetup() {
  const { user, needsAgencyName, completeAgencySetup } = useAuth();
  const navigate = useNavigate();
  const [agencyNameInput, setAgencyNameInput] = useState(() => guessAgencyName(user));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!needsAgencyName) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsAgencyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyNameInput.trim()) {
      setErrorMsg('Agency name is required');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const { error } = await completeAgencySetup(agencyNameInput.trim());
    setLoading(false);
    if (error) {
      setErrorMsg(error);
      return;
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-[20px]" style={{ backgroundColor: 'var(--cv-background)' }}>
      <div className="w-full max-w-[400px]">
        <h1 className="text-[32px] mb-[8px] text-center" style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)', letterSpacing: '0.06em' }}>
          CastView
        </h1>
        <p className="text-[11px] mb-[32px] text-center uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}>
          One last thing
        </p>
        <form onSubmit={handleSubmit}>
          <p className="mb-[16px] text-[13px] leading-relaxed" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}>
            What's your agency called? You can change this anytime in Settings.
          </p>
          <div className="mb-[16px]">
            <input
              type="text"
              value={agencyNameInput}
              onChange={(e) => setAgencyNameInput(e.target.value)}
              placeholder="Agency name"
              required
              autoFocus
              className="w-full px-[12px] py-[12px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)', outline: 'none' }}
            />
          </div>
          {errorMsg && <p className="mb-[16px] text-[12px]" style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}>{errorMsg}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{ fontFamily: 'var(--font-mono)', backgroundColor: 'var(--cv-primary-text)', color: 'var(--cv-background)', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer', border: 'none' }}
          >
            {loading ? 'Setting up...' : 'Continue →'}
          </button>
        </form>
      </div>
    </div>
  );
}
