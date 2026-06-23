import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../../lib/admin';
import { supabase } from '../../lib/supabase';

type WaitlistRow = {
  id: string;
  name: string;
  agency_name: string;
  email: string;
  agency_size: string | null;
  created_at: string;
  approved_at: string | null;
};

function formatRequestedAt(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildInviteMailto(name: string, email: string): string {
  const body = [
    `Hi ${name},`,
    '',
    'Your CastView access is ready. Click here to create your account:',
    'https://app.castview.org/signup',
    '',
    'Reply to this email if you have any questions.',
    '',
    'CastView Team',
  ].join('\n');

  const params = new URLSearchParams({
    subject: 'Your CastView Access Is Ready',
    body,
  });

  return `mailto:${email}?${params.toString()}`;
}

export function AdminRequests() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => rows.filter((row) => !row.approved_at).length,
    [rows],
  );

  useEffect(() => {
    if (authLoading || !isAdminUser(user?.email)) return;

    const loadWaitlist = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[AdminRequests] waitlist fetch error:', fetchError);
        setError(fetchError.message);
        setRows([]);
      } else {
        setRows((data ?? []) as WaitlistRow[]);
      }

      setLoading(false);
    };

    loadWaitlist();
  }, [authLoading, user?.email]);

  const handleToggleApproved = async (row: WaitlistRow) => {
    setUpdatingId(row.id);
    const nextApprovedAt = row.approved_at ? null : new Date().toISOString();

    const { error: updateError } = await supabase
      .from('waitlist')
      .update({ approved_at: nextApprovedAt })
      .eq('id', row.id);

    if (updateError) {
      console.error('[AdminRequests] approved_at update error:', updateError);
      setError(updateError.message);
    } else {
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, approved_at: nextApprovedAt } : item,
        ),
      );
      setError(null);
    }

    setUpdatingId(null);
  };

  if (authLoading) {
    return (
      <div className="p-[48px]">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)' }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!isAdminUser(user?.email)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-[48px]">
      <h1
        className="text-[48px] mb-[12px]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
      >
        Waitlist Requests
      </h1>
      <p
        className="mb-[32px] text-[13px]"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
      >
        {pendingCount} request{pendingCount === 1 ? '' : 's'} pending
      </p>

      <div className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[24px]">
        <div className="flex items-center gap-[16px] pb-[12px] border-b border-[var(--cv-subtle-border)]">
          <div
            className="w-[140px] text-[10px] uppercase tracking-[0.05em]"
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
          >
            Name
          </div>
          <div
            className="w-[160px] text-[10px] uppercase tracking-[0.05em]"
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
          >
            Agency
          </div>
          <div
            className="flex-1 min-w-0 text-[10px] uppercase tracking-[0.05em]"
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
          >
            Email
          </div>
          <div
            className="w-[80px] text-[10px] uppercase tracking-[0.05em]"
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
          >
            Size
          </div>
          <div
            className="w-[110px] text-[10px] uppercase tracking-[0.05em]"
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
          >
            Requested
          </div>
          <div
            className="w-[200px] text-[10px] uppercase tracking-[0.05em] text-right"
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
          >
            Action
          </div>
        </div>

        {error && (
          <p
            className="py-[16px] text-[12px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}
          >
            {error}
          </p>
        )}

        {loading ? (
          <div
            className="py-[24px] text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            —
          </div>
        ) : rows.length === 0 ? (
          <div
            className="py-[24px] text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            No requests yet.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-[16px] border-b border-[var(--cv-subtle-border)] py-[12px]"
            >
              <div
                className="w-[140px] text-[13px] truncate"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
                title={row.name}
              >
                {row.name}
              </div>
              <div
                className="w-[160px] text-[13px] truncate"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-accent)' }}
                title={row.agency_name}
              >
                {row.agency_name}
              </div>
              <div
                className="flex-1 min-w-0 text-[13px] truncate"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-accent)' }}
                title={row.email}
              >
                {row.email}
              </div>
              <div
                className="w-[80px] text-[13px] truncate"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-accent)' }}
              >
                {row.agency_size || '—'}
              </div>
              <div
                className="w-[110px] text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-accent)' }}
              >
                {formatRequestedAt(row.created_at)}
              </div>
              <div className="w-[200px] flex items-center justify-end gap-[8px]">
                {row.approved_at ? (
                  <div
                    className="px-[10px] py-[4px] rounded-full text-[9px] uppercase tracking-[0.1em] border"
                    style={{
                      fontFamily: 'var(--font-label)',
                      borderColor: '#4a7a4a',
                      color: '#4a7a4a',
                      backgroundColor: 'rgba(74,122,74,0.1)',
                    }}
                  >
                    Approved
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleToggleApproved(row)}
                  disabled={updatingId === row.id}
                  className="px-[10px] py-[6px] rounded-[4px] text-[10px] uppercase tracking-[0.08em] border border-[var(--cv-subtle-border)] hover:border-[var(--cv-primary-text)] transition-colors disabled:opacity-50"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: row.approved_at ? 'var(--cv-secondary-text)' : 'var(--cv-primary-text)',
                    cursor: updatingId === row.id ? 'not-allowed' : 'pointer',
                    background: 'transparent',
                  }}
                >
                  {row.approved_at ? 'UNDO' : 'APPROVED'}
                </button>
                <a
                  href={buildInviteMailto(row.name, row.email)}
                  className="px-[10px] py-[6px] rounded-[4px] text-[10px] uppercase tracking-[0.08em] transition-opacity hover:opacity-80"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'var(--cv-primary-text)',
                    color: 'var(--cv-background)',
                  }}
                >
                  INVITE
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
