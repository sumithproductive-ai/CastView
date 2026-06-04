import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ProgressBar } from '../components/ProgressBar';
import { Sidebar } from '../components/Sidebar';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { useTutorial } from '../context/TutorialContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { isTutorialOpen, closeTutorial } = useTutorial();
  const { plan, planStatus, agencyId, user } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    if (!agencyId) return;
    if (plan !== 'trial' && planStatus === 'active') return;

    const fetchTrial = async () => {
      const { data } = await supabase
        .from('agencies')
        .select('trial_ends_at, plan_status')
        .eq('id', agencyId)
        .single();
      if (data?.trial_ends_at) {
        const diff = new Date(data.trial_ends_at).getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        setDaysLeft(Math.max(0, days));
        setTrialExpired(days <= 0);
      }
    };
    fetchTrial();
  }, [agencyId, plan, planStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgradePlan = params.get('upgrade');
    if (upgradePlan && agencyId && user?.email) {
      // Remove the param from URL without reload
      window.history.replaceState({}, '', window.location.pathname);
      // Trigger upgrade flow
      handleUpgrade(upgradePlan);
    }
  }, [agencyId, user]);

  const handleUpgrade = async (tier = 'studio') => {
    if (!agencyId || !user?.email) return;
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, agencyId, email: user.email }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const isOnActivePaidPlan = planStatus === 'active' && plan !== 'trial';

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#080808', fontFamily: 'var(--font-mono)' }}>
      <ProgressBar />
      <div className="flex flex-1 items-stretch">
        <Sidebar />
        <main className="flex-1 pb-[64px] md:pb-0">
        {!isOnActivePaidPlan && daysLeft !== null && !trialExpired && (
          <div style={{
            backgroundColor: daysLeft <= 3 ? '#1a0808' : '#111111',
            borderBottom: `1px solid ${daysLeft <= 3 ? '#c87a7a' : '#2a2a2a'}`,
            padding: '10px 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: daysLeft <= 3 ? '#c87a7a' : '#888880',
              letterSpacing: '0.05em',
            }}>
              {daysLeft <= 3
                ? `⚠ ${daysLeft} DAY${daysLeft === 1 ? '' : 'S'} LEFT — Upgrade before your trial ends.`
                : `${daysLeft} DAYS LEFT IN YOUR FREE TRIAL`}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleUpgrade('solo')}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '6px 14px',
                  backgroundColor: 'transparent',
                  color: '#C8A96E',
                  border: '1px solid #C8A96E',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                SOLO $129
              </button>
              <button
                onClick={() => handleUpgrade('studio')}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '6px 14px',
                  backgroundColor: '#C8A96E',
                  color: '#080808',
                  border: '1px solid #C8A96E',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                STUDIO $349 ★
              </button>
              <button
                onClick={() => handleUpgrade('agency')}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '6px 14px',
                  backgroundColor: 'transparent',
                  color: '#888880',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                AGENCY $699
              </button>
            </div>
          </div>
        )}

        {trialExpired && !isOnActivePaidPlan && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(8, 8, 8, 0.97)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            padding: '48px',
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#C8A96E',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              Your Trial Has Ended
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '48px',
              fontWeight: 300,
              color: '#F0F0EC',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              Choose your plan to continue.
            </h2>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: '#888880',
              marginBottom: '48px',
              textAlign: 'center',
              maxWidth: '480px',
              lineHeight: 1.7,
            }}>
              Your 14-day free trial has ended. Upgrade to keep 
              your prospects, evaluations, and model data.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { tier: 'solo', label: 'Solo', price: '$129/mo', desc: 'For solo bookers' },
                { tier: 'studio', label: 'Studio', price: '$349/mo', desc: 'For boutique agencies', highlight: true },
                { tier: 'agency', label: 'Agency', price: '$699/mo', desc: 'For established agencies' },
              ].map(({ tier, label, price, desc, highlight }) => (
                <div
                  key={tier}
                  style={{
                    background: '#111111',
                    border: `1px solid ${highlight ? '#C8A96E' : '#2a2a2a'}`,
                    borderRadius: '4px',
                    padding: '32px 28px',
                    width: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 300, color: '#F0F0EC' }}>{price}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880' }}>{desc}</div>
                  <button
                    onClick={() => handleUpgrade(tier)}
                    style={{
                      marginTop: '8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '12px',
                      backgroundColor: highlight ? '#C8A96E' : 'transparent',
                      color: highlight ? '#080808' : '#F0F0EC',
                      border: `1px solid ${highlight ? '#C8A96E' : '#2a2a2a'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    {highlight ? 'GET STARTED ★' : 'GET STARTED'}
                  </button>
                </div>
              ))}
            </div>
            <p style={{
              marginTop: '32px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#555550',
            }}>
              All plans include your existing data · Cancel anytime
            </p>
          </div>
        )}
          {children}
        </main>
      </div>
      {isTutorialOpen && <TutorialOverlay onClose={closeTutorial} />}
    </div>
  );
}
