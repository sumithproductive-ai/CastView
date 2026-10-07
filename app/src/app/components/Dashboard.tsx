import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Inbox, Copy, MailWarning, RefreshCw, CheckCircle2, type LucideIcon } from 'lucide-react';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import { useAuth } from '../context/AuthContext';
import { useTutorial } from '../context/TutorialContext';
import { useGmailConnectionStatus } from '../hooks/useGmailConnectionStatus';
import { messagePreviewText, resolveMessageTabPath } from '../../lib/messageEntity';
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

function statCardStagger(index: number): React.CSSProperties {
  return {
    height: '96px',
    opacity: 0,
    animation: 'castview-fadein 0.4s ease forwards',
    animationDelay: `${index * 0.05}s`,
  };
}

function rowStagger(index: number, stepMs: number): React.CSSProperties {
  return {
    opacity: 0,
    animation: 'castview-fadein 0.3s ease forwards',
    animationDelay: `${index * stepMs}s`,
  };
}

type RosterActivityItem = {
  id: string;
  name: string;
  activity: string;
  timeAgo: string;
  image: string;
};

type AttentionItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  detail: string;
  path: string;
  tone: 'warning' | 'neutral';
};

export function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
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

  const { agencyId, agencyName, loading: authLoading, tutorialShownAt, markTutorialShown } = useAuth();
  const { openTutorial } = useTutorial();

  useEffect(() => {
    if (authLoading || !agencyId || !agencyName?.trim() || tutorialShownAt) return;
    const timer = setTimeout(() => {
      void markTutorialShown();
      openTutorial();
    }, 800);
    return () => clearTimeout(timer);
  }, [agencyId, agencyName, authLoading, tutorialShownAt, markTutorialShown, openTutorial]);

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

  const { needsReauth: gmailNeedsReauth } = useGmailConnectionStatus(agencyId);

  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (!agencyId) return;
    let cancelled = false;

    const loadUnread = async () => {
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .is('read_at', null);

      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .eq('direction', 'inbound')
        .is('read_at', null);

      if (!cancelled) setUnreadCount((eventCount ?? 0) + (messageCount ?? 0));
    };

    void loadUnread();
    return () => {
      cancelled = true;
    };
  }, [agencyId]);

  // "Needs your attention" — the point of this list is to replace checking
  // Inbox, Settings, and Notifications separately just to find out what's
  // outstanding. Only built from data that already exists elsewhere in the
  // app (no new AI calls, no new tables) — brief-matching isn't included
  // here since there's no persisted "open briefs" concept to check against
  // yet, just an on-demand matching tool.
  const pendingReviewProspects = prospects.filter((p) => p.status === 'PENDING_REVIEW');
  const duplicateFlagCount = pendingReviewProspects.filter((p) => p.possibleDuplicateOf).length;

  const attentionItems: AttentionItem[] = useMemo(() => {
    const items: AttentionItem[] = [];

    if (pendingReviewProspects.length > 0) {
      items.push({
        id: 'inbox',
        icon: Inbox,
        label: t('attention.inboxWaiting', { count: pendingReviewProspects.length }),
        detail: t('attention.inboxWaitingDetail'),
        path: '/inbox',
        tone: 'neutral',
      });
    }

    if (duplicateFlagCount > 0) {
      items.push({
        id: 'duplicates',
        icon: Copy,
        label: t('attention.duplicatesFlagged', { count: duplicateFlagCount }),
        detail: t('attention.duplicatesFlaggedDetail'),
        path: '/inbox',
        tone: 'warning',
      });
    }

    if (gmailNeedsReauth) {
      items.push({
        id: 'gmail',
        icon: RefreshCw,
        label: t('attention.gmailReconnect'),
        detail: t('attention.gmailReconnectDetail'),
        path: '/settings',
        tone: 'warning',
      });
    }

    if (unreadCount > 0) {
      items.push({
        id: 'unread',
        icon: MailWarning,
        label: t('attention.unreadMessages', { count: unreadCount }),
        detail: t('attention.unreadMessagesDetail'),
        path: '/notifications',
        tone: 'neutral',
      });
    }

    return items;
  }, [t, pendingReviewProspects.length, duplicateFlagCount, gmailNeedsReauth, unreadCount]);

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
              ? t('rosterActivity.evaluationCompletedWithScore', { context: ev.contexts[0].context, score: ev.contexts[0].alignmentScore })
              : t('rosterActivity.evaluationCompleted'),
            timeAgo: ev.completedAt,
          }))
        )
      )
      .sort((a, b) => b.timeAgo.localeCompare(a.timeAgo))
      .slice(0, 3);
  }, [models, t]);
  
  return (
    <div className="p-[20px] md:p-[48px]">
      <h1
        className="text-[48px] mb-[32px]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
      >
        {t('title')}
      </h1>

      {/* Needs Your Attention — the point is replacing "check Inbox, check
          Settings, check Notifications separately" with one list. */}
      <div className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[24px] mb-[48px]">
        <div
          className="text-[10px] uppercase tracking-[0.12em] mb-[16px]"
          style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
        >
          {t('attention.heading')}
        </div>

        {attentionItems.length === 0 ? (
          <div className="flex items-center gap-[10px] py-[8px]">
            <CheckCircle2 size={16} style={{ color: '#4a7a4a' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)' }}>
              {t('attention.allCaughtUp')}
            </span>
          </div>
        ) : (
          <div className="space-y-[4px]">
            {attentionItems.map((item, index) => {
              const Icon = item.icon;
              const toneColor = item.tone === 'warning' ? '#d4a24a' : 'var(--cv-primary-text)';
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className="flex items-center gap-[14px] py-[10px] px-[12px] -mx-[12px] rounded-[4px] hover:bg-[var(--cv-elevated)] transition-colors"
                  style={rowStagger(index, 0.04)}
                >
                  <Icon size={16} style={{ color: toneColor, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}>
                      {item.detail}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)' }}>
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Sections */}
      <div className="mb-[48px]" data-tutorial="stats-row">
        <div className="flex flex-col md:flex-row md:items-start gap-[32px] md:gap-[48px]">
          {/* Prospects Section */}
          <div className="flex-[4] min-w-0">
            <div
              className="mb-[12px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}
            >
              {t('stats.prospects')}
            </div>
            <div className="flex flex-wrap items-stretch gap-[12px]">
              <div
                className="flex-1 min-w-[120px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[16px] flex flex-col justify-between"
                style={statCardStagger(0)}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', color: 'var(--cv-primary-text)' }}>
                  {totalProspects}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.12em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  {t('stats.totalProspects')}
                </div>
              </div>

              <div
                className="flex-1 min-w-[120px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[16px] flex flex-col justify-between"
                style={statCardStagger(1)}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', color: 'var(--cv-primary-text)' }}>
                  {shortlistedCount}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.12em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  {t('stats.shortlisted')}
                </div>
              </div>

              <div
                className="flex-1 min-w-[120px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[16px] flex flex-col justify-between"
                style={statCardStagger(2)}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', color: 'var(--cv-primary-text)' }}>
                  {awaitingReviewCount}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.12em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  {t('stats.awaitingReview')}
                </div>
              </div>

              <div
                className="flex-1 min-w-[120px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[16px] flex flex-col justify-between"
                style={statCardStagger(3)}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', color: 'var(--cv-primary-text)' }}>
                  {totalEvaluations}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.12em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  {t('stats.evaluationsRun')}
                </div>
              </div>
            </div>
          </div>

          {/* Roster Section */}
          <div className="flex-[3] min-w-0">
            <div
              className="mb-[12px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}
            >
              {t('stats.roster')}
            </div>
            <div className="flex flex-wrap items-stretch gap-[12px]">
              <div
                className="flex-1 min-w-[120px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[16px] flex flex-col justify-between"
                style={statCardStagger(4)}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', color: 'var(--cv-primary-text)' }}>
                  {activeModelsCount}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.12em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  {t('stats.activeModels')}
                </div>
              </div>

              <div
                className="flex-1 min-w-[120px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[16px] flex flex-col justify-between"
                style={statCardStagger(5)}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', color: 'var(--cv-primary-text)' }}>
                  {totalRosterEvaluations}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.12em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  {t('stats.evaluations')}
                </div>
              </div>

              <div
                className="flex-1 min-w-[120px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[16px] flex flex-col justify-between"
                style={statCardStagger(6)}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', color: 'var(--cv-primary-text)' }}>
                  {onHoldCount}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.12em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  {t('stats.onHold')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[24px] mb-[48px]">
        <div
          className="text-[10px] uppercase tracking-[0.12em] mb-[24px] flex items-center"
          style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
        >
          {t('messages.recent', { count: recentMessages.length })}
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
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            {t('messages.empty')}
          </div>
        ) : (
          <div
            style={{ maxHeight: '240px', overflowY: 'auto' }}
            className="space-y-[4px]"
          >
            {recentMessages.map((msg, index) => (
              <div
                key={msg.id}
                className="flex items-center gap-[16px] py-[10px] px-[16px] hover:bg-[var(--cv-elevated)] rounded-[4px] transition-colors cursor-pointer"
                style={{
                  borderLeft: msg.direction === 'inbound'
                    ? '2px solid #C8A96E' : '1px solid transparent',
                  ...rowStagger(index, 0.03),
                }}
                onClick={() => {
                  const path = resolveMessageTabPath(
                    msg.prospect_id,
                    prospects.map((p) => p.id),
                    models.map((m) => m.id),
                  );
                  navigate(path);
                }}
              >
                <div
                  className="text-[13px] min-w-[160px]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
                >
                  {msg.prospectName}
                </div>
                <div
                  className="flex-1 text-[11px] truncate"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
                >
                  {messagePreviewText(msg)}
                </div>
                <div
                  className="text-[11px] min-w-[80px] text-right"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
                >
                  {new Date(msg.sent_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric'
                  })}
                </div>
                <div
                  className="px-[8px] py-[3px] rounded-full text-[9px] uppercase tracking-[0.1em] border"
                  style={{
                    fontFamily: 'var(--font-label)',
                    borderColor: msg.direction === 'inbound' ? '#C8A96E' : 'var(--cv-secondary-text)',
                    color: msg.direction === 'inbound' ? '#C8A96E' : 'var(--cv-secondary-text)',
                  }}
                >
                  {msg.direction === 'inbound' ? t('messages.reply') : t('messages.sent')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Panels Row */}
      <div className="flex flex-col md:flex-row gap-[24px]">
        {/* Recent Prospects Panel */}
        <div className="flex-1 bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[24px]">
          <div 
            className="text-[9px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
          >
            {t('recentProspects.heading')}
          </div>
          
          <div className="space-y-[16px] mb-[24px]">
            {recentProspects.map((prospect) => (
              <Link
                key={prospect.id}
                to={`/prospects/${prospect.id}`}
                className="flex items-center gap-[12px] hover:opacity-80 transition-opacity"
              >
                {/* Thumbnail */}
                <div className="w-[32px] h-[32px] rounded-[4px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] overflow-hidden flex-shrink-0">
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
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)' }}
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
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}
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
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-secondary-text)' }}
          >
            {t('recentProspects.viewAll')}
          </Link>
        </div>

        {/* Recent Roster Activity Panel */}
        <div className="flex-1 bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[24px]">
          <div 
            className="text-[9px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
          >
            {t('rosterActivity.heading')}
          </div>
          
          <div className="mb-[24px]">
            {rosterActivity.length === 0 ? (
              <div
                className="text-center py-[32px] text-[12px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
              >
                {t('rosterActivity.empty')}
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
                    <div className="w-[32px] h-[32px] rounded-[4px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] overflow-hidden flex-shrink-0">
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
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)' }}
                    >
                      {item.name}
                    </div>

                    {/* Activity Description */}
                    <div
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}
                    >
                      {item.activity}
                    </div>

                    {/* Time Ago */}
                    <div
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}
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
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-secondary-text)' }}
          >
            {t('rosterActivity.viewAll')}
          </Link>
        </div>
      </div>
    </div>
  );
}