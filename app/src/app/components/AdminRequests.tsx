import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../../lib/admin';
import { supabase } from '../../lib/supabase';
import { authFetch } from '../../lib/apiAuth';

type WaitlistRow = {
  id: string;
  name: string;
  agency_name: string;
  email: string;
  agency_size: string | null;
  created_at: string;
  approved_at: string | null;
  trial_days: number | null;
};

type AgencyRow = {
  id: string;
  name: string | null;
  owner_email: string | null;
  plan: string;
  plan_status: string;
  trial_ends_at: string | null;
  created_at: string;
};

const EXTEND_PRESETS = [14, 30, 60];

function formatTrialEndsAt(trialEndsAt: string | null): string {
  if (!trialEndsAt) return '—';
  const end = new Date(trialEndsAt);
  const daysRemaining = Math.round((end.getTime() - Date.now()) / 86_400_000);
  const dateLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (daysRemaining < 0) return `${dateLabel} (expired ${Math.abs(daysRemaining)}d ago)`;
  if (daysRemaining === 0) return `${dateLabel} (today)`;
  return `${dateLabel} (${daysRemaining}d left)`;
}

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
  const [trialDaysDrafts, setTrialDaysDrafts] = useState<Record<string, string>>({});

  const [agencyRows, setAgencyRows] = useState<AgencyRow[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(true);
  const [agenciesError, setAgenciesError] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);

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

    const loadAgencies = async () => {
      setAgenciesLoading(true);
      setAgenciesError(null);
      try {
        const res = await authFetch('/api/admin/agencies');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to load agencies');
        setAgencyRows(data.agencies ?? []);
      } catch (err) {
        console.error('[AdminRequests] agencies fetch error:', err);
        setAgenciesError(err instanceof Error ? err.message : 'Failed to load agencies');
      } finally {
        setAgenciesLoading(false);
      }
    };

    loadWaitlist();
    loadAgencies();
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

  const handleSaveTrialDays = async (row: WaitlistRow) => {
    const draft = trialDaysDrafts[row.id];
    if (draft === undefined) return;
    const nextTrialDays = draft.trim() === '' ? null : Number(draft);
    if (nextTrialDays !== null && (!Number.isFinite(nextTrialDays) || nextTrialDays <= 0)) return;
    if (nextTrialDays === row.trial_days) return;

    const { error: updateError } = await supabase
      .from('waitlist')
      .update({ trial_days: nextTrialDays })
      .eq('id', row.id);

    if (updateError) {
      console.error('[AdminRequests] trial_days update error:', updateError);
      setError(updateError.message);
      return;
    }

    setRows((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, trial_days: nextTrialDays } : item)),
    );
  };

  const handleExtendTrial = async (row: AgencyRow, days: number) => {
    setExtendingId(row.id);
    const base = Math.max(
      row.trial_ends_at ? new Date(row.trial_ends_at).getTime() : Date.now(),
      Date.now(),
    );
    const trialEndsAt = new Date(base + days * 86_400_000).toISOString();

    try {
      const res = await authFetch('/api/admin/agencies', {
        method: 'POST',
        body: JSON.stringify({ agencyId: row.id, trialEndsAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Extend failed');

      setAgencyRows((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, trial_ends_at: trialEndsAt, plan_status: 'trialing' } : item,
        ),
      );
      setAgenciesError(null);
    } catch (err) {
      console.error('[AdminRequests] extend trial error:', err);
      setAgenciesError(err instanceof Error ? err.message : 'Extend failed');
    } finally {
      setExtendingId(null);
    }
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
            className="w-[90px] text-[10px] uppercase tracking-[0.05em]"
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
          >
            Trial (days)
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
              <div className="w-[90px]">
                <input
                  type="number"
                  min={1}
                  placeholder="14"
                  value={trialDaysDrafts[row.id] ?? row.trial_days ?? ''}
                  onChange={(e) =>
                    setTrialDaysDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                  }
                  onBlur={() => handleSaveTrialDays(row)}
                  className="w-[70px] px-[8px] py-[6px] rounded-[4px] text-[12px] border border-[var(--cv-subtle-border)] bg-transparent"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)', outline: 'none' }}
                />
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

      <h1
        className="text-[48px] mb-[12px] mt-[64px]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
      >
        Agencies
      </h1>
      <p
        className="mb-[32px] text-[13px]"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
      >
        {agencyRows.length} agenc{agencyRows.length === 1 ? 'y' : 'ies'}
      </p>

      <div className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[24px]">
        <div className="flex items-center gap-[16px] pb-[12px] border-b border-[var(--cv-subtle-border)]">
          <div className="w-[180px] text-[10px] uppercase tracking-[0.05em]" style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}>
            Agency
          </div>
          <div className="flex-1 min-w-0 text-[10px] uppercase tracking-[0.05em]" style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}>
            Owner Email
          </div>
          <div className="w-[110px] text-[10px] uppercase tracking-[0.05em]" style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}>
            Plan
          </div>
          <div className="w-[200px] text-[10px] uppercase tracking-[0.05em]" style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}>
            Trial Status
          </div>
          <div className="w-[220px] text-[10px] uppercase tracking-[0.05em] text-right" style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}>
            Extend
          </div>
        </div>

        {agenciesError && (
          <p className="py-[16px] text-[12px]" style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}>
            {agenciesError}
          </p>
        )}

        {agenciesLoading ? (
          <div className="py-[24px] text-[13px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}>
            —
          </div>
        ) : agencyRows.length === 0 ? (
          <div className="py-[24px] text-[13px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}>
            No agencies yet.
          </div>
        ) : (
          agencyRows.map((row) => (
            <div key={row.id} className="flex items-center gap-[16px] border-b border-[var(--cv-subtle-border)] py-[12px]">
              <div className="w-[180px] text-[13px] truncate" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }} title={row.name ?? ''}>
                {row.name || '—'}
              </div>
              <div className="flex-1 min-w-0 text-[13px] truncate" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-accent)' }} title={row.owner_email ?? ''}>
                {row.owner_email || '—'}
              </div>
              <div className="w-[110px] text-[13px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-accent)' }}>
                {row.plan} / {row.plan_status}
              </div>
              <div className="w-[200px] text-[13px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-accent)' }}>
                {formatTrialEndsAt(row.trial_ends_at)}
              </div>
              <div className="w-[220px] flex items-center justify-end gap-[6px]">
                {EXTEND_PRESETS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleExtendTrial(row, days)}
                    disabled={extendingId === row.id}
                    className="px-[10px] py-[6px] rounded-[4px] text-[10px] uppercase tracking-[0.08em] border border-[var(--cv-subtle-border)] hover:border-[var(--cv-primary-text)] transition-colors disabled:opacity-50"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--cv-primary-text)',
                      cursor: extendingId === row.id ? 'not-allowed' : 'pointer',
                      background: 'transparent',
                    }}
                  >
                    +{days}d
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
