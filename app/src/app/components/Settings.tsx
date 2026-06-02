import React from 'react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTutorial } from '../context/TutorialContext';

type TeamMemberStatus = 'ACTIVE' | 'INACTIVE';

interface TeamMember {
  name: string;
  evaluations: number;
  lastActive: string;
  status: TeamMemberStatus;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Maya Rossi',
    evaluations: 12,
    lastActive: 'Active now',
    status: 'ACTIVE'
  },
  {
    name: 'Tom Laurent',
    evaluations: 7,
    lastActive: '2 days ago',
    status: 'ACTIVE'
  },
  {
    name: 'Sara Chen',
    evaluations: 0,
    lastActive: '9 days ago',
    status: 'INACTIVE'
  }
];

const BILLING_TIERS = [
  { id: 'solo' as const, name: 'SOLO', price: '$129', description: 'For independent agents' },
  { id: 'studio' as const, name: 'STUDIO', price: '$349', description: 'For growing agencies', recommended: true },
  { id: 'agency' as const, name: 'AGENCY', price: '$699', description: 'For established agencies' },
];

export function Settings() {
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('high');
  const { openTutorial } = useTutorial();
  const { agencyId, user, plan, planStatus } = useAuth();
  const handleSubscribe = async (tier: string) => {
    if (!agencyId || !user?.email) return;
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, agencyId, email: user.email }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div className="p-[48px]">
      <h1 
        className="text-[48px] mb-[48px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        Settings
      </h1>

      <div className="space-y-[16px]">
        {/* Billing / Subscribe */}
        <div>
          <div
            className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            BILLING
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] p-[24px]">
            <div className="flex items-center justify-between mb-[24px] pb-[24px] border-b border-[#2a2a2a]">
              <div>
                <div
                  className="text-[9px] uppercase tracking-[0.1em] mb-[8px]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  CURRENT PLAN
                </div>
                <div
                  className="text-[28px]"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
                >
                  {plan.toUpperCase()}
                </div>
              </div>
              <div
                className="px-[12px] py-[6px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-mono)', color: '#c8a96e' }}
              >
                {planStatus.replace(/_/g, ' ')}
              </div>
            </div>

            <div
              className="text-[11px] uppercase tracking-[0.12em] mb-[16px]"
              style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
            >
              CHOOSE A PLAN
            </div>

            <div className="grid md:grid-cols-3 gap-[16px]">
              {BILLING_TIERS.map((tier) => {
                const isCurrent = plan === tier.id;
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
                      className="w-full px-[16px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </div>

        {/* Your Plan Block */}
        <div>
          <div 
            className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            YOUR PLAN
          </div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-[24px]">
              <div 
                className="text-[9px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
              >
                YOUR PLAN
              </div>
              <div 
                className="px-[12px] py-[6px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] text-[11px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
              >
                STUDIO
              </div>
            </div>

            {/* Row 1: Agent Seats */}
            <div className="border-b border-[#2a2a2a] py-[14px]">
              <div className="flex items-center justify-between mb-[12px]">
                <label 
                  className="text-[13px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
                >
                  Agent seats
                </label>
                <div 
                  className="text-[13px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                >
                  3 of 12 active
                </div>
              </div>
              <div className="w-full h-[4px] bg-[#2a2a2a] rounded-[4px] overflow-hidden">
                <div 
                  className="h-full rounded-[4px]"
                  style={{ width: '25%', backgroundColor: '#f0f0ec' }}
                />
              </div>
            </div>

            {/* Row 2: Evaluations */}
            <div className="flex items-center justify-between border-b border-[#2a2a2a] py-[14px]">
              <label 
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                Evaluations this month
              </label>
              <div 
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
              >
                Unlimited
              </div>
            </div>

            {/* Row 3: Renewal Date */}
            <div className="flex items-center justify-between border-b border-[#2a2a2a] py-[14px]">
              <label 
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                Renewal date
              </label>
              <div 
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
              >
                April 10, 2026
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-[12px] mt-[24px]">
              <button
                className="px-[16px] py-[10px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[#f0f0ec]"
                style={{ 
                  fontFamily: 'var(--font-label)',
                  borderColor: '#2a2a2a',
                  color: '#a0a09a',
                  cursor: 'pointer'
                }}
              >
                MANAGE SEATS
              </button>
              <button
                className="px-[16px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{ 
                  fontFamily: 'var(--font-label)',
                  backgroundColor: '#f0f0ec',
                  color: '#080808',
                  cursor: 'pointer'
                }}
              >
                UPGRADE PLAN
              </button>
            </div>
          </div>
        </div>

        {/* Team Activity Block */}
        <div>
          <div 
            className="text-[11px] uppercase tracking-[0.12em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
          >
            TEAM ACTIVITY
          </div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
            {/* Table */}
            <div>
              {/* Table Header */}
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

              {/* Table Rows */}
              {teamMembers.map((member) => {
                const getStatusStyle = (status: TeamMemberStatus) => {
                  if (status === 'ACTIVE') {
                    return { borderColor: '#c8c8c2', color: '#c8c8c2' };
                  } else {
                    return { borderColor: '#444440', color: '#666660' };
                  }
                };

                const statusStyle = getStatusStyle(member.status);

                return (
                  <div 
                    key={member.name}
                    className="flex items-center gap-[24px] border-b border-[#1e1e1e]"
                    style={{ height: '48px' }}
                  >
                    {/* Agent name */}
                    <div 
                      className="flex-1 text-[13px]"
                      style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                    >
                      {member.name}
                    </div>

                    {/* Evaluations count */}
                    <div 
                      className="w-[180px] text-[13px]"
                      style={{ fontFamily: 'var(--font-mono)', color: '#c8c8c2' }}
                    >
                      {member.evaluations}
                    </div>

                    {/* Last active */}
                    <div 
                      className="w-[140px] text-[13px]"
                      style={{ fontFamily: 'var(--font-mono)', color: '#c8c8c2' }}
                    >
                      {member.lastActive}
                    </div>

                    {/* Status pill */}
                    <div className="w-[100px]">
                      <div 
                        className="inline-block px-[10px] py-[4px] rounded-full text-[9px] uppercase tracking-[0.1em] border"
                        style={{ 
                          fontFamily: 'var(--font-label)', 
                          borderColor: statusStyle.borderColor,
                          color: statusStyle.color,
                          backgroundColor: 'transparent'
                        }}
                      >
                        {member.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Note */}
            <div 
              className="mt-[16px] text-[11px] italic"
              style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
            >
              Activity data resets on the 1st of each month.
            </div>
          </div>
        </div>

        {/* Agency Block */}
        <div>
          <div 
            className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            AGENCY
          </div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] space-y-[16px]">
            {/* Agency Name Row */}
            <div className="flex items-center justify-between">
              <label 
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                Agency Name
              </label>
              <input
                type="text"
                placeholder="Your Agency Name"
                className="px-[16px] py-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] w-[320px]"
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '13px', 
                  color: '#f0f0ec'
                }}
              />
            </div>

            {/* Primary Market Row */}
            <div className="flex items-center justify-between">
              <label 
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                Primary Market
              </label>
              <input
                type="text"
                placeholder="e.g. New York"
                className="px-[16px] py-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] w-[320px]"
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '13px', 
                  color: '#f0f0ec'
                }}
              />
            </div>
          </div>
        </div>

        {/* Rendering Block */}
        <div>
          <div 
            className="text-[9px] uppercase tracking-[0.1em] mb-[12px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            RENDERING
          </div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] space-y-[16px]">
            {/* Default Evaluation Quality Row */}
            <div className="flex items-center justify-between">
              <label 
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                Default Evaluation Quality
              </label>
              <div className="flex gap-[8px]">
                <button
                  onClick={() => setQuality('standard')}
                  className="px-[16px] py-[8px] rounded-[4px] text-[9px] uppercase tracking-[0.1em] transition-colors"
                  style={{
                    fontFamily: 'var(--font-label)',
                    backgroundColor: quality === 'standard' ? '#f0f0ec' : 'transparent',
                    color: quality === 'standard' ? '#080808' : '#a0a09a',
                    border: `1px solid ${quality === 'standard' ? '#f0f0ec' : '#2a2a2a'}`,
                    cursor: 'pointer'
                  }}
                >
                  STANDARD
                </button>
                <button
                  onClick={() => setQuality('high')}
                  className="px-[16px] py-[8px] rounded-[4px] text-[9px] uppercase tracking-[0.1em] transition-colors"
                  style={{
                    fontFamily: 'var(--font-label)',
                    backgroundColor: quality === 'high' ? '#f0f0ec' : 'transparent',
                    color: quality === 'high' ? '#080808' : '#a0a09a',
                    border: `1px solid ${quality === 'high' ? '#f0f0ec' : '#2a2a2a'}`,
                    cursor: 'pointer'
                  }}
                >
                  HIGH
                </button>
                <button
                  onClick={() => setQuality('ultra')}
                  className="px-[16px] py-[8px] rounded-[4px] text-[9px] uppercase tracking-[0.1em] transition-colors"
                  style={{
                    fontFamily: 'var(--font-label)',
                    backgroundColor: quality === 'ultra' ? '#f0f0ec' : 'transparent',
                    color: quality === 'ultra' ? '#080808' : '#a0a09a',
                    border: `1px solid ${quality === 'ultra' ? '#f0f0ec' : '#2a2a2a'}`,
                    cursor: 'pointer'
                  }}
                >
                  ULTRA
                </button>
              </div>
            </div>

            {/* Default Contexts Row */}
            <div className="flex items-center justify-between">
              <label 
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                Default Contexts
              </label>
              <div 
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
              >
                Configure in each prospect profile
              </div>
            </div>
          </div>
        </div>

        {/* Help Block */}
        <div>
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
                  cursor: 'pointer'
                }}
              >
                LAUNCH TUTORIAL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}