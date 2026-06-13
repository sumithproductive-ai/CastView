import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { authFetch } from '../../lib/apiAuth';
import { isAdminUser } from '../../lib/admin';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTutorial } from '../context/TutorialContext';
import { MARKET_SUGGESTIONS } from './LocationMarketField';

const BILLING_TIERS = [
  { id: 'solo' as const, name: 'SOLO', price: '$99', description: 'For independent agents' },
  { id: 'studio' as const, name: 'STUDIO', price: '$349', description: 'For growing agencies', recommended: true },
  { id: 'agency' as const, name: 'AGENCY', price: '$699', description: 'For established agencies' },
];

type TeamProfileRow = {
  id: string;
  email: string;
  role: string;
  lastActiveAt: string | null;
  evaluationsThisMonth: number;
};

function formatPlanLabel(plan: string): string {
  const normalized = plan.toLowerCase();
  if (normalized === 'founding_beta') return 'FOUNDING BETA';
  return plan.replace(/_/g, ' ').toUpperCase();
}

function planSeatLimit(plan: string, seatCount: number | null): number | null {
  if (seatCount != null && seatCount > 0) return seatCount;
  const normalized = plan.toLowerCase();
  if (normalized === 'solo') return 1;
  if (normalized === 'studio') return 4;
  if (normalized === 'agency') return 10;
  if (normalized === 'founding_beta') return null;
  return 1;
}

function formatSeatLimit(limit: number | null): string {
  if (limit == null) return '∞';
  return String(limit);
}

function getPlanStatusDisplay(plan: string, planStatus: string): { label: string; color: string } {
  const normalizedPlan = plan.toLowerCase();
  if (normalizedPlan === 'founding_beta') {
    return { label: 'ACTIVE', color: '#c8a96e' };
  }
  const normalizedStatus = planStatus.toLowerCase();
  if (normalizedStatus === 'active' || normalizedStatus === 'trialing') {
    return { label: planStatus.replace(/_/g, ' ').toUpperCase(), color: '#c8a96e' };
  }
  return { label: planStatus.replace(/_/g, ' ').toUpperCase(), color: '#888880' };
}

function formatLastActive(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 24 * 60 * 60 * 1000) return 'Active now';
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRenewalDate(
  plan: string,
  trialEndsAt: string | null,
  stripeSubscriptionId: string | null,
): string {
  const normalizedPlan = plan.toLowerCase();
  const trialPlan = normalizedPlan === 'trial' || normalizedPlan === 'founding_beta';

  if (trialEndsAt && trialPlan) {
    const date = new Date(trialEndsAt);
    if (!Number.isNaN(date.getTime())) {
      const formatted = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      return `Trial ends ${formatted}`;
    }
  }

  if (stripeSubscriptionId) {
    if (trialEndsAt) {
      const date = new Date(trialEndsAt);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }
    return 'Active subscription';
  }

  return '—';
}

function monthStartIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function sectionFade(index: number): React.CSSProperties {
  return {
    opacity: 0,
    animation: 'castview-fadein 0.4s ease forwards',
    animationDelay: `${index * 0.06}s`,
  };
}

function PulseBar({
  width,
  height = 14,
  className = '',
  rounded = '4px',
}: {
  width: number | string;
  height?: number;
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-[#1a1a1a] ${className}`}
      style={{ width, height, borderRadius: rounded }}
      aria-hidden
    />
  );
}

export function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const [agencyName, setAgencyName] = useState('');
  const [primaryMarket, setPrimaryMarket] = useState('');
  const [savingAgency, setSavingAgency] = useState(false);
  const [agencySaved, setAgencySaved] = useState(false);

  const [planLabel, setPlanLabel] = useState('');
  const [planStatusLabel, setPlanStatusLabel] = useState('');
  const [planStatusColor, setPlanStatusColor] = useState('#c8a96e');
  const [agencyPlanRaw, setAgencyPlanRaw] = useState('');
  const [seatLimit, setSeatLimit] = useState<number | null>(1);
  const [activeProfileCount, setActiveProfileCount] = useState(0);
  const [evaluationsThisMonth, setEvaluationsThisMonth] = useState(0);
  const [renewalDate, setRenewalDate] = useState('—');
  const [teamProfiles, setTeamProfiles] = useState<TeamProfileRow[]>([]);

  const [supportCategory, setSupportCategory] = useState<'bug' | 'feedback' | 'other'>('bug');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [agencySaveError, setAgencySaveError] = useState<string | null>(null);

  const { openTutorial } = useTutorial();
  const { agencyId, user, plan, planStatus, signOut, loading: authLoading } = useAuth();

  const isPageLoading = authLoading || loading;
  const canManageBilling = Boolean(stripeCustomerId);

  const seatProgress =
    seatLimit != null && seatLimit > 0
      ? Math.min(100, (activeProfileCount / seatLimit) * 100)
      : activeProfileCount > 0
        ? 100
        : 0;

  useEffect(() => {
    if (authLoading) return;

    if (!agencyId) {
      setLoading(false);
      setTeamProfiles([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const monthStart = monthStartIso();

        const agencySelectWithSeats =
          'name, primary_market, plan, plan_status, trial_ends_at, stripe_subscription_id, stripe_customer_id, seat_count';
        const agencySelectBasic =
          'name, primary_market, plan, plan_status, trial_ends_at, stripe_subscription_id, stripe_customer_id';

        let agency:
          | {
              name: string | null;
              primary_market: string | null;
              plan: string | null;
              plan_status: string | null;
              trial_ends_at: string | null;
              stripe_subscription_id: string | null;
              stripe_customer_id: string | null;
              seat_count?: number | null;
            }
          | null = null;

        const { data: agencyWithSeats, error: agencyWithSeatsError } = await supabase
          .from('agencies')
          .select(agencySelectWithSeats)
          .eq('id', agencyId)
          .single();

        if (agencyWithSeatsError?.message?.includes('seat_count')) {
          const { data: agencyBasic, error: agencyBasicError } = await supabase
            .from('agencies')
            .select(agencySelectBasic)
            .eq('id', agencyId)
            .single();
          if (agencyBasicError) {
            console.error('[Settings] agency fetch failed:', agencyBasicError.message);
          } else {
            agency = agencyBasic;
          }
        } else if (agencyWithSeatsError) {
          console.error('[Settings] agency fetch failed:', agencyWithSeatsError.message);
        } else {
          agency = agencyWithSeats;
        }

        if (!cancelled && agency) {
          setAgencyName(agency.name ?? '');
          setPrimaryMarket(agency.primary_market ?? '');
          setStripeCustomerId(agency.stripe_customer_id ?? null);

          const rawPlan = agency.plan ?? 'trial';
          setAgencyPlanRaw(rawPlan);
          setPlanLabel(formatPlanLabel(rawPlan));

          const statusDisplay = getPlanStatusDisplay(rawPlan, agency.plan_status ?? 'trialing');
          setPlanStatusLabel(statusDisplay.label);
          setPlanStatusColor(statusDisplay.color);
          setSeatLimit(planSeatLimit(rawPlan, agency.seat_count ?? null));
          setRenewalDate(
            formatRenewalDate(
              rawPlan,
              agency.trial_ends_at ?? null,
              agency.stripe_subscription_id ?? null,
            ),
          );
        }

        let profileList: Array<{
          id: string;
          email: string | null;
          role: string | null;
          created_at: string | null;
          updated_at?: string | null;
        }> = [];

        const { data: profilesWithUpdated, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, role, created_at, updated_at')
          .eq('agency_id', agencyId);

        if (profilesError?.message?.includes('updated_at')) {
          const { data: profilesBasic, error: basicError } = await supabase
            .from('profiles')
            .select('id, email, role, created_at')
            .eq('agency_id', agencyId);
          if (basicError) {
            console.error('[Settings] profiles fetch failed:', basicError.message);
          } else {
            profileList = profilesBasic ?? [];
          }
        } else if (profilesError) {
          console.error('[Settings] profiles fetch failed:', profilesError.message);
        } else {
          profileList = profilesWithUpdated ?? [];
        }
        if (!cancelled) {
          setActiveProfileCount(profileList.length);
        }

        const { count: agencyEvalCount, error: evalError } = await supabase
          .from('evaluations')
          .select('id', { count: 'exact', head: true })
          .eq('agency_id', agencyId)
          .gte('created_at', monthStart);

        if (evalError) {
          console.error('[Settings] evaluations count failed:', evalError.message);
        }

        const totalEvals = agencyEvalCount ?? 0;
        if (!cancelled) {
          setEvaluationsThisMonth(totalEvals);
        }

        const ownerProfile =
          profileList.find((p) => p.role === 'owner') ?? profileList[0] ?? null;

        const teamRows: TeamProfileRow[] = profileList.map((profile) => ({
          id: profile.id,
          email: profile.email ?? '—',
          role: profile.role ?? 'member',
          lastActiveAt: profile.updated_at ?? profile.created_at ?? null,
          evaluationsThisMonth:
            profileList.length === 1 || profile.id === ownerProfile?.id
              ? totalEvals
              : 0,
        }));

        if (!cancelled) {
          setTeamProfiles(teamRows);
        }
      } catch (err) {
        console.error('[Settings] load error:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agencyId, authLoading]);

  const handleSubscribe = async (tier: string) => {
    if (!agencyId || !user?.email) return;
    setCheckoutError(null);
    const res = await authFetch('/api/stripe-checkout', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setCheckoutError(data.error ?? 'Unable to start checkout. Please try again.');
      return;
    }
    window.location.href = data.url;
  };

  const handleManageBilling = async () => {
    setPortalError(null);
    setPortalLoading(true);
    try {
      const res = await authFetch('/api/stripe-portal', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 400) {
        setPortalError(
          data.error ?? 'No active billing account — start a subscription first.',
        );
        return;
      }
      if (!res.ok || !data.url) {
        setPortalError(data.error ?? 'Unable to open billing portal. Try again.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setPortalError('Unable to open billing portal. Try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSaveAgency = async () => {
    if (!agencyId || savingAgency) return;
    setSavingAgency(true);
    setAgencySaveError(null);
    const { error } = await supabase
      .from('agencies')
      .update({ name: agencyName.trim(), primary_market: primaryMarket.trim() })
      .eq('id', agencyId);
    setSavingAgency(false);
    if (error) {
      console.error('[Settings] agency save failed:', error.message);
      setAgencySaveError('Could not save agency details. Please try again.');
      return;
    }
    setAgencySaved(true);
    setTimeout(() => setAgencySaved(false), 2000);
  };

  const billingPlanKey = (agencyPlanRaw || plan).toLowerCase();

  const supportMessageTooLong = supportMessage.length > 2000;
  const canSubmitSupport =
    supportMessage.trim().length > 0 && !supportMessageTooLong && !supportSending;

  useEffect(() => {
    if (!supportSuccess) return;
    const timer = window.setTimeout(() => {
      setSupportSuccess(false);
      setSupportSubject('');
      setSupportMessage('');
      setSupportCategory('bug');
      setSupportError(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [supportSuccess]);

  const handleSupportSubmit = async () => {
    if (!canSubmitSupport) return;
    setSupportSending(true);
    setSupportError(null);
    try {
      const res = await authFetch('/api/support', {
        method: 'POST',
        body: JSON.stringify({
          subject: supportSubject.trim(),
          message: supportMessage.trim(),
          category: supportCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSupportError(data.error ?? 'Failed to send message');
        return;
      }
      setSupportSuccess(true);
    } catch (err) {
      setSupportError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSupportSending(false);
    }
  };

  return (
    <div className="p-[20px] md:p-[48px]">
      <h1
        className="text-[48px] mb-[48px]"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          color: '#f0f0ec',
          ...(!isPageLoading ? sectionFade(0) : {}),
        }}
      >
        Settings
      </h1>

      <div className="space-y-[16px]">
        {/* Billing / Subscribe */}
        <div style={!isPageLoading ? sectionFade(1) : undefined}>
          <div
            className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            BILLING
          </div>
          {checkoutError && (
            <p
              className="mb-[12px] text-[12px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#e8d4a8' }}
            >
              {checkoutError}
            </p>
          )}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] p-[24px]">
            <div className="flex items-center justify-between mb-[24px] pb-[24px] border-b border-[#2a2a2a]">
              <div>
                <div
                  className="text-[9px] uppercase tracking-[0.1em] mb-[8px]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  CURRENT PLAN
                </div>
                {isPageLoading ? (
                  <PulseBar width={200} height={32} />
                ) : (
                  <div
                    className="text-[28px]"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
                  >
                    {planLabel || formatPlanLabel(plan)}
                  </div>
                )}
              </div>
              {isPageLoading ? (
                <PulseBar width={88} height={30} />
              ) : (
                <div
                  className="px-[12px] py-[6px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-mono)', color: planStatusColor }}
                >
                  {planStatusLabel || planStatus.replace(/_/g, ' ')}
                </div>
              )}
            </div>

            {isPageLoading ? (
              <div className="space-y-[16px]">
                <PulseBar width="85%" height={13} />
                <PulseBar width={168} height={38} />
              </div>
            ) : canManageBilling ? (
              <div className="mb-[24px]">
                <p
                  className="text-[13px] mb-[16px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a', lineHeight: 1.6 }}
                >
                  Update your payment method, view invoices, or cancel your subscription anytime.
                </p>
                <button
                  type="button"
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="px-[16px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: '#f0f0ec',
                    color: '#080808',
                    border: 'none',
                    cursor: portalLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {portalLoading ? 'OPENING…' : 'MANAGE BILLING →'}
                </button>
                {portalError && (
                  <p
                    className="mt-[12px] text-[12px]"
                    style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}
                  >
                    {portalError}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div
                  className="text-[11px] uppercase tracking-[0.12em] mb-[16px]"
                  style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
                >
                  CHOOSE A PLAN
                </div>

                <div className="grid md:grid-cols-3 gap-[16px]">
                  {BILLING_TIERS.map((tier) => {
                    const isCurrent = billingPlanKey === tier.id;
                    const isRecommended = tier.recommended === true;

                    return (
                      <div
                        key={tier.id}
                        className="rounded-[4px] p-[24px] flex flex-col"
                        style={{
                          backgroundColor: '#1a1a1a',
                          border: `1px solid ${isRecommended ? '#c8a96e' : '#2a2a2a'}`,
                        }}
                      >
                        {isRecommended && (
                          <div
                            className="text-[9px] uppercase tracking-[0.12em] mb-[12px]"
                            style={{ fontFamily: 'var(--font-label)', color: '#c8a96e' }}
                          >
                            RECOMMENDED
                          </div>
                        )}
                        <div
                          className="text-[11px] uppercase tracking-[0.12em] mb-[12px]"
                          style={{
                            fontFamily: 'var(--font-label)',
                            color: isRecommended ? '#c8a96e' : '#888880',
                          }}
                        >
                          {tier.name}
                        </div>
                        <div
                          className="text-[40px] mb-[4px]"
                          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
                        >
                          {tier.price}
                        </div>
                        <div
                          className="text-[13px] mb-[20px]"
                          style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
                        >
                          per month
                        </div>
                        <div
                          className="text-[13px] mb-[24px] flex-1"
                          style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a', lineHeight: 1.5 }}
                        >
                          {tier.description}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSubscribe(tier.id)}
                          disabled={isCurrent}
                          className="cv-btn-primary w-full px-[16px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            backgroundColor: isRecommended ? '#c8a96e' : 'transparent',
                            color: isRecommended ? '#080808' : '#f0f0ec',
                            border: isRecommended ? '1px solid #c8a96e' : '1px solid #2a2a2a',
                            cursor: isCurrent ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isCurrent ? 'CURRENT PLAN' : 'SUBSCRIBE'}
                        </button>
                        <div
                          className="text-[11px] text-center mt-[12px]"
                          style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
                        >
                          14-day free trial
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Your Plan Block */}
        <div style={!isPageLoading ? sectionFade(2) : undefined}>
          <div
            className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            YOUR PLAN
          </div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
            <div className="flex items-center justify-between mb-[24px]">
              <div
                className="text-[9px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
              >
                YOUR PLAN
              </div>
              {isPageLoading ? (
                <PulseBar width={120} height={30} />
              ) : (
                <div
                  className="px-[12px] py-[6px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] text-[11px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                >
                  {planLabel || '—'}
                </div>
              )}
            </div>

            <div className="border-b border-[#2a2a2a] py-[14px]">
              <div className="flex items-center justify-between mb-[12px]">
                <label
                  className="text-[13px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
                >
                  Agent seats
                </label>
                {isPageLoading ? (
                  <PulseBar width={120} height={13} />
                ) : (
                  <div
                    className="text-[13px]"
                    style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                  >
                    {`${activeProfileCount} of ${formatSeatLimit(seatLimit)} active`}
                  </div>
                )}
              </div>
              <div className="w-full h-[4px] bg-[#2a2a2a] rounded-[4px] overflow-hidden">
                {isPageLoading ? (
                  <PulseBar width="100%" height={4} />
                ) : (
                  <div
                    className="h-full rounded-[4px]"
                    style={{ width: `${seatProgress}%`, backgroundColor: '#f0f0ec' }}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-[#2a2a2a] py-[14px]">
              <label
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                Evaluations this month
              </label>
              {isPageLoading ? (
                <PulseBar width={32} height={13} />
              ) : (
                <div
                  className="text-[13px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                >
                  {String(evaluationsThisMonth)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-b border-[#2a2a2a] py-[14px]">
              <label
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                Renewal date
              </label>
              {isPageLoading ? (
                <PulseBar width={180} height={13} />
              ) : (
                <div
                  className="text-[13px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                >
                  {renewalDate}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-[12px] mt-[24px]">
              <a
                href="mailto:hello@castview.org?subject=Seat%20Management%20Request"
                className="px-[16px] py-[10px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[#f0f0ec] no-underline inline-block"
                style={{
                  fontFamily: 'var(--font-label)',
                  borderColor: '#2a2a2a',
                  color: '#a0a09a',
                  cursor: 'pointer',
                }}
              >
                MANAGE SEATS
              </a>
              <button
                type="button"
                onClick={() => handleSubscribe('studio')}
                className="px-[16px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{
                  fontFamily: 'var(--font-label)',
                  backgroundColor: '#f0f0ec',
                  color: '#080808',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                UPGRADE PLAN
              </button>
            </div>
          </div>
        </div>

        {/* Team Activity Block */}
        <div style={!isPageLoading ? sectionFade(3) : undefined}>
          <div
            className="text-[11px] uppercase tracking-[0.12em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
          >
            TEAM ACTIVITY
          </div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
            <div>
              <div className="flex items-center gap-[24px] pb-[12px] border-b border-[#1e1e1e]">
                <div
                  className="flex-1 text-[10px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
                >
                  AGENT
                </div>
                <div
                  className="w-[180px] text-[10px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
                >
                  EVALUATIONS THIS MONTH
                </div>
                <div
                  className="w-[140px] text-[10px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
                >
                  LAST ACTIVE
                </div>
                <div
                  className="w-[100px] text-[10px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
                >
                  STATUS
                </div>
              </div>

              {isPageLoading ? (
                <div
                  className="flex items-center gap-[24px] border-b border-[#1e1e1e]"
                  style={{ height: '48px' }}
                >
                  <PulseBar width="55%" height={13} className="flex-1 min-w-0" />
                  <PulseBar width={48} height={13} className="w-[180px] shrink-0" />
                  <PulseBar width={88} height={13} className="w-[140px] shrink-0" />
                  <PulseBar width={64} height={24} className="w-[100px] shrink-0" rounded="9999px" />
                </div>
              ) : teamProfiles.length === 0 ? (
                <div
                  className="py-[24px] text-[13px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#666660' }}
                >
                  No team members found
                </div>
              ) : (
                teamProfiles.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-[24px] border-b border-[#1e1e1e]"
                    style={{ height: '48px' }}
                  >
                    <div
                      className="flex-1 text-[13px] min-w-0 truncate"
                      style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                      title={member.email}
                    >
                      {member.email}
                      {member.role === 'owner' ? (
                        <span style={{ color: '#888880', marginLeft: '8px' }}>
                          ({member.role})
                        </span>
                      ) : null}
                    </div>
                    <div
                      className="w-[180px] text-[13px]"
                      style={{ fontFamily: 'var(--font-mono)', color: '#c8c8c2' }}
                    >
                      {member.evaluationsThisMonth}
                    </div>
                    <div
                      className="w-[140px] text-[13px]"
                      style={{ fontFamily: 'var(--font-mono)', color: '#c8c8c2' }}
                    >
                      {formatLastActive(member.lastActiveAt)}
                    </div>
                    <div className="w-[100px]">
                      <div
                        className="inline-block px-[10px] py-[4px] rounded-full text-[9px] uppercase tracking-[0.1em] border"
                        style={{
                          fontFamily: 'var(--font-label)',
                          borderColor: '#c8c8c2',
                          color: '#c8c8c2',
                          backgroundColor: 'transparent',
                        }}
                      >
                        ACTIVE
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              className="mt-[16px] text-[11px] italic"
              style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
            >
              Activity data resets on the 1st of each month.
            </div>
          </div>
        </div>

        {/* Agency Block */}
        <div style={!isPageLoading ? sectionFade(4) : undefined}>
          <div
            className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            AGENCY
          </div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] space-y-[16px]">
            <div className="flex items-center justify-between">
              <label
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                Agency Name
              </label>
              {isPageLoading ? (
                <PulseBar width={320} height={40} />
              ) : (
                <input
                  type="text"
                  placeholder="Your Agency Name"
                  value={agencyName}
                  onChange={(e) => {
                    setAgencyName(e.target.value);
                    setAgencySaved(false);
                  }}
                  className="px-[16px] py-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] w-[320px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: '#f0f0ec',
                  }}
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  className="text-[13px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
                >
                  Primary Market
                </label>
                {isPageLoading ? (
                  <PulseBar width={320} height={40} />
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Dallas, Atlanta, New York..."
                    value={primaryMarket}
                    onChange={(e) => {
                      setPrimaryMarket(e.target.value);
                      setAgencySaved(false);
                    }}
                    className="px-[16px] py-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] w-[320px]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      color: '#f0f0ec',
                    }}
                  />
                )}
              </div>
              <div className="flex justify-end mt-[10px]">
                <div className="w-[320px] flex flex-wrap gap-[8px]">
                  {isPageLoading
                    ? Array.from({ length: 8 }).map((_, index) => (
                        <PulseBar key={index} width={index % 2 === 0 ? 72 : 88} height={28} />
                      ))
                    : MARKET_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setPrimaryMarket(suggestion);
                        setAgencySaved(false);
                      }}
                      className="border border-[#2a2a2a] text-[#888880] hover:border-[#f0f0ec] hover:text-[#f0f0ec] rounded-[4px] cursor-pointer transition-colors"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        padding: '4px 10px',
                        background: 'transparent',
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-[8px]">
              {isPageLoading ? (
                <PulseBar width={132} height={38} />
              ) : (
              <button
                type="button"
                onClick={handleSaveAgency}
                disabled={savingAgency || !agencyId}
                className="px-[16px] py-[10px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[#f0f0ec] disabled:opacity-50"
                style={{
                  fontFamily: 'var(--font-mono)',
                  borderColor: agencySaved ? '#4a7a4a' : '#2a2a2a',
                  color: agencySaved ? '#4a7a4a' : '#f0f0ec',
                  cursor: savingAgency ? 'not-allowed' : 'pointer',
                  background: 'transparent',
                }}
              >
                {agencySaved ? '✓ SAVED' : savingAgency ? 'SAVING…' : 'SAVE CHANGES'}
              </button>
              )}
            </div>
            {agencySaveError && (
              <p
                className="text-[12px] mt-[8px] text-right"
                style={{ fontFamily: 'var(--font-mono)', color: '#e8a8a8' }}
              >
                {agencySaveError}
              </p>
            )}
          </div>
        </div>

        {/* Help Block */}
        <div style={!isPageLoading ? sectionFade(5) : undefined}>
          <div
            className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            HELP
          </div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
            <div className="flex items-center justify-between">
              <label
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                Product Tutorial
              </label>
              <button
                onClick={openTutorial}
                className="px-[16px] py-[10px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[#f0f0ec]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  borderColor: '#2a2a2a',
                  color: '#f0f0ec',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              >
                LAUNCH TUTORIAL
              </button>
            </div>
          </div>
        </div>

        {/* Support Block */}
        <div style={!isPageLoading ? sectionFade(6) : undefined}>
          <div
            className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            SUPPORT
          </div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
            {supportSuccess ? (
              <p
                className="text-center py-[24px]"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#4a7a4a' }}
              >
                ✓ Message sent. We&apos;ll get back to you at {user?.email ?? 'your email'}.
              </p>
            ) : (
              <div className="space-y-[16px]">
                <p
                  className="text-[13px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
                >
                  Report a bug, request a feature, or ask a question.
                </p>
                <select
                  value={supportCategory}
                  onChange={(e) =>
                    setSupportCategory(e.target.value as 'bug' | 'feedback' | 'other')
                  }
                  className="w-full px-[16px] py-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: '#f0f0ec',
                  }}
                >
                  <option value="bug">Bug Report</option>
                  <option value="feedback">Feature Request</option>
                  <option value="other">General Question</option>
                </select>
                <input
                  type="text"
                  placeholder="Brief description"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="w-full px-[16px] py-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: '#f0f0ec',
                  }}
                />
                <div>
                  <textarea
                    placeholder="Describe the issue or feedback in detail..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    rows={4}
                    className="w-full px-[16px] py-[12px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] resize-none"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      color: '#f0f0ec',
                      minHeight: '100px',
                    }}
                  />
                  {(supportMessage.length > 0 || supportMessageTooLong) && (
                    <p
                      className="mt-[8px] text-[11px]"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: supportMessageTooLong ? '#c87a7a' : '#888880',
                      }}
                    >
                      {supportMessage.length} / 2000
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSupportSubmit}
                    disabled={!canSubmitSupport}
                    className="px-[16px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: '#f0f0ec',
                      color: '#080808',
                      border: 'none',
                      cursor: !canSubmitSupport ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {supportSending ? 'SENDING...' : 'SEND MESSAGE'}
                  </button>
                </div>
                {supportError && (
                  <p
                    className="text-[12px]"
                    style={{ fontFamily: 'var(--font-mono)', color: '#c87a7a' }}
                  >
                    {supportError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {isAdminUser(user?.email) && (
          <div className="pt-[8px]">
            <Link
              to="/admin/requests"
              className="text-[12px] hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
            >
              ADMIN: View Requests →
            </Link>
          </div>
        )}

        <div className="pt-[48px]" style={!isPageLoading ? sectionFade(7) : undefined}>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/login', { replace: true });
            }}
            className="text-[11px] uppercase tracking-[0.1em] hover:opacity-80 transition-opacity"
            style={{
              fontFamily: 'var(--font-mono)',
              color: '#c87a7a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
