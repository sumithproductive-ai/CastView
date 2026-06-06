import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useMemo, useState, useEffect } from 'react';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import { useAuth } from '../context/AuthContext';
import { needsOnboarding } from '../../lib/onboarding';
import { supabase } from '../../lib/supabase';
import { DigitalImage } from './DigitalImage';

function submissionDateRank(submissionDate: string): number {
  const value = submissionDate.toLowerCase().trim();
  if (value === 'today') return 0;

  const hoursMatch = value.match(/(\d+)\s*hours?\s*ago/);
  if (hoursMatch) return Number(hoursMatch[1]) / 24;

  const daysMatch = value.match(/(\d+)\s*days?\s*ago/);
  if (daysMatch) return Number(daysMatch[1]);

  const weeksMatch = value.match(/(\d+)\s*weeks?\s*ago/);
  if (weeksMatch) return Number(weeksMatch[1]) * 7;

  return Number.MAX_SAFE_INTEGER;
}

type RosterActivityItem = {
  id: string;
  name: string;
  activity: string;
  timeAgo: string;
  image: string;
};

export function Dashboard() {
  const navigate = useNavigate();
  const { prospects, loading: prospectsLoading } = useProspects();
  const { models, loading: rosterLoading } = useRoster();
  const [recentMessages, setRecentMessages] = useState<Array<{
    id: string;
    prospect_id: string;
    direction: string;
    subject: string;
    body: string;
    to_email: string;
    from_email: string;
    sent_at: string;
    prospectName?: string;
  }>>([]);

  const { agencyId, agencyName, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !agencyId || prospectsLoading || rosterLoading) return;
    if (needsOnboarding(agencyName, prospects.length, models.length)) {
      navigate('/onboarding', { replace: true });
    }
  }, [
    agencyId,
    agencyName,
    authLoading,
    prospectsLoading,
    rosterLoading,
    prospects.length,
    models.length,
    navigate,
  ]);

  useEffect(() => {
    if (!agencyId) return;
    supabase
      .from('messages')
      .select('*')
      .eq('agency_id', agencyId)
      .order('sent_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data) return;
        const withNames = data.map(msg => {
          const prospect = prospects.find(p => p.id === msg.prospect_id);
          const model = models.find(m => m.id === msg.prospect_id);
          return {
            ...msg,
            prospectName: prospect?.name ?? model?.name ?? msg.to_email,
          };
        });
        setRecentMessages(withNames);
      });

    const channel = supabase
      .channel('dashboard-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `agency_id=eq.${agencyId}`,
        },
        async (payload) => {
          const msg = payload.new as typeof recentMessages[0];
          const prospect = prospects.find(p => p.id === msg.prospect_id);
          const model = models.find(m => m.id === msg.prospect_id);
          const withName = {
            ...msg,
            prospectName: prospect?.name ?? model?.name ?? (msg as any).to_email ?? 'Unknown',
          };
          setRecentMessages(prev => [withName, ...prev.filter(m => m.id !== withName.id)].slice(0, 10));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId, prospects, models]);

  const activeModelsCount = models.filter(
    (m) => m.status === 'ACTIVE'
  ).length;

  const totalRosterEvaluations = models.reduce(
    (sum, m) =>
      sum +
      m.digitalSets.reduce((s, ds) => s + ds.evaluations.length, 0),
    0
  );

  const onHoldCount = models.filter(
    (m) => m.status === 'ON HOLD'
  ).length;

  const totalProspects = prospects.length;
  const shortlistedCount = prospects.filter((p) => p.status === 'SHORTLISTED').length;
  const awaitingReviewCount = prospects.filter((p) => p.status === 'IN REVIEW').length;

  const totalEvaluations = prospects.reduce(
    (sum, p) =>
      sum +
      (typeof p.evaluations === 'number' ? p.evaluations : 0),
    0,
  );
  const recentProspects = useMemo(
    () =>
      [...prospects]
        .filter((prospect) => prospect.image)
        .sort(
          (a, b) =>
            submissionDateRank(a.submissionDate) -
            submissionDateRank(b.submissionDate),
        )
        .slice(0, 3),
    [prospects],
  );

  const rosterActivity = useMemo(() => {
    return models
      .flatMap((model) =>
        model.digitalSets.flatMap((ds) =>
          ds.evaluations.map((ev) => ({
            id: model.id,
            name: model.name,
            image: model.image,
            activity: ev.contexts.length > 0
              ? `Evaluation completed — ${ev.contexts[0].context} ${ev.contexts[0].alignmentScore}%`
              : 'Evaluation completed',
            timeAgo: ev.completedAt,
          }))
        )
      )
      .sort((a, b) => b.timeAgo.localeCompare(a.timeAgo))
      .slice(0, 3);
  }, [models]);
  
  return (
    <div className="p-[20px] md:p-[48px]">
      <h1 
        className="text-[48px] mb-[48px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        Briefing
      </h1>

      {/* Unified Stats Row */}
      <div className="mb-[48px]" data-tutorial="stats-row">
        {/* Section Labels */}
        <div className="flex items-start mb-[8px]">
          <div 
            className="text-[9px] uppercase tracking-[0.1em]"
            style={{ fontFamily: 'var(--font-label)', color: '#888880', width: 'calc((100% - 1px) * 4 / 7)' }}
          >
            PROSPECTS
          </div>
          <div style={{ width: '1px' }} />
          <div 
            className="text-[9px] uppercase tracking-[0.1em] pl-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: '#888880', width: 'calc((100% - 1px) * 3 / 7)' }}
          >
            ROSTER
          </div>
        </div>

        {/* Cards Row */}
        <div className="flex items-stretch gap-[12px]">
          {/* Prospect Cards */}
          <div className="flex items-stretch gap-[12px]" style={{ width: 'calc((100% - 1px) * 4 / 7)' }}>
            {/* Card 1: Total Prospects */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                {totalProspects}
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                TOTAL PROSPECTS
              </div>
            </div>

            {/* Card 2: Shortlisted */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                {shortlistedCount}
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                SHORTLISTED
              </div>
            </div>

            {/* Card 3: Awaiting Review */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                {awaitingReviewCount}
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                AWAITING REVIEW
              </div>
            </div>

            {/* Card 4: Evaluations run */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between relative"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontWeight: 300, 
                  color: '#f0f0ec' 
                }}
              >
                {totalEvaluations}
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ 
                  fontFamily: 'var(--font-label)', 
                  color: '#888880' 
                }}
              >
                EVALUATIONS RUN
              </div>
            </div>
          </div>

          {/* Divider */}
          <div 
            className="self-center"
            style={{ 
              width: '1px', 
              height: '48px', 
              backgroundColor: '#2a2a2a' 
            }}
          />

          {/* Roster Cards */}
          <div className="flex items-stretch gap-[12px]" style={{ width: 'calc((100% - 1px) * 3 / 7)' }}>
            {/* Card 5: Active Models */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                {activeModelsCount}
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                ACTIVE MODELS
              </div>
            </div>

            {/* Card 6: Evaluations */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                {totalRosterEvaluations}
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                EVALUATIONS
              </div>
            </div>

            {/* Card 7: On Hold */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                {onHoldCount}
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                ON HOLD
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] mb-[48px]">
        <div
          className="text-[10px] uppercase tracking-[0.12em] mb-[24px] flex items-center"
          style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
        >
          RECENT MESSAGES ({recentMessages.length})
          {recentMessages.some(m => m.direction === 'inbound') && (
            <span
              className="w-[6px] h-[6px] rounded-full inline-block ml-[8px] mb-[1px]"
              style={{ backgroundColor: '#C8A96E' }}
            />
          )}
        </div>

        {recentMessages.length === 0 ? (
          <div
            className="text-center py-[32px] text-[12px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
          >
            No messages yet. Send your first message from a prospect profile.
          </div>
        ) : (
          <div
            style={{ maxHeight: '240px', overflowY: 'auto' }}
            className="space-y-[4px]"
          >
            {recentMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-center gap-[16px] py-[10px] px-[16px] hover:bg-[#1a1a1a] rounded-[4px] transition-colors cursor-pointer"
                style={{
                  borderLeft: msg.direction === 'inbound'
                    ? '2px solid #C8A96E' : '1px solid transparent',
                }}
                onClick={() => {
                  const prospect = prospects.find(p => p.id === msg.prospect_id);
                  const model = models.find(m => m.id === msg.prospect_id);
                  if (prospect) window.location.href = `/prospects/${prospect.id}`;
                  else if (model) window.location.href = `/roster/${model.id}`;
                }}
              >
                <div
                  className="text-[13px] min-w-[160px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                >
                  {msg.prospectName}
                </div>
                <div
                  className="flex-1 text-[11px] truncate"
                  style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
                >
                  {msg.subject}
                </div>
                <div
                  className="text-[11px] min-w-[80px] text-right"
                  style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
                >
                  {new Date(msg.sent_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric'
                  })}
                </div>
                <div
                  className="px-[8px] py-[3px] rounded-full text-[9px] uppercase tracking-[0.1em] border"
                  style={{
                    fontFamily: 'var(--font-label)',
                    borderColor: msg.direction === 'inbound' ? '#C8A96E' : '#555550',
                    color: msg.direction === 'inbound' ? '#C8A96E' : '#888880',
                  }}
                >
                  {msg.direction === 'inbound' ? 'REPLY' : 'SENT'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Panels Row */}
      <div className="flex flex-col md:flex-row gap-[24px]">
        {/* Recent Prospects Panel */}
        <div className="flex-1 bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
          <div 
            className="text-[9px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            RECENT PROSPECTS
          </div>
          
          <div className="space-y-[16px] mb-[24px]">
            {recentProspects.map((prospect) => (
              <Link
                key={prospect.id}
                to={`/prospects/${prospect.id}`}
                className="flex items-center gap-[12px] hover:opacity-80 transition-opacity"
              >
                {/* Thumbnail */}
                <div className="w-[32px] h-[32px] rounded-[4px] bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex-shrink-0">
                  <DigitalImage
                    storageRef={prospect.image}
                    alt={prospect.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center 15%' }}
                  />
                </div>

                {/* Name */}
                <div 
                  className="flex-1"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
                >
                  {prospect.name}
                </div>

                {/* Status Badge */}
                <div 
                  className="px-[8px] py-[2px] rounded-full text-[8px] uppercase tracking-[0.1em]"
                  style={{ 
                    fontFamily: 'var(--font-label)', 
                    backgroundColor: prospect.statusColor + '33',
                    color: prospect.statusColor,
                    border: `1px solid ${prospect.statusColor}`
                  }}
                >
                  {prospect.status}
                </div>

                {/* Time Ago */}
                <div 
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6a6a64' }}
                >
                  {prospect.submissionDate}
                </div>
              </Link>
            ))}
          </div>

          {/* View All Link */}
          <Link
            to="/prospects"
            className="block text-center py-[8px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#a0a09a' }}
          >
            View all prospects →
          </Link>
        </div>

        {/* Recent Roster Activity Panel */}
        <div className="flex-1 bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
          <div 
            className="text-[9px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            RECENT ROSTER ACTIVITY
          </div>
          
          <div className="mb-[24px]">
            {rosterActivity.length === 0 ? (
              <div
                className="text-center py-[32px] text-[12px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
              >
                No roster activity yet.
              </div>
            ) : (
              <div className="space-y-[16px]">
                {rosterActivity.map((item) => (
                  <Link
                    key={item.id}
                    to={`/roster/${item.id}`}
                    className="flex items-center gap-[12px] hover:opacity-80 transition-opacity"
                  >
                    {/* Thumbnail */}
                    <div className="w-[32px] h-[32px] rounded-[4px] bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex-shrink-0">
                      <DigitalImage
                        storageRef={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 15%' }}
                      />
                    </div>

                    {/* Name */}
                    <div
                      className="flex-1"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
                    >
                      {item.name}
                    </div>

                    {/* Activity Description */}
                    <div
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6a6a64' }}
                    >
                      {item.activity}
                    </div>

                    {/* Time Ago */}
                    <div
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6a6a64' }}
                    >
                      {item.timeAgo}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* View All Link */}
          <Link
            to="/roster"
            className="block text-center py-[8px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#a0a09a' }}
          >
            View full roster →
          </Link>
        </div>
      </div>
    </div>
  );
}