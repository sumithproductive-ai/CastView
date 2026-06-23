import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, UserCheck, MessageSquare, Tag } from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { messagePreviewText, resolveMessageTabPath } from '../../lib/messageEntity';
import { useAuth } from '../context/AuthContext';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';

type FilterType = 'ALL' | 'EVALUATIONS' | 'MESSAGES' | 'STATUS UPDATES';

interface NotificationItem {
  id: string;
  type: FilterType;
  unread: boolean;
  title: string;
  time: string;
  sortAt: string;
  badge?: { text: string; color: string };
  path?: string;
  source: 'event' | 'message';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function Notifications() {
  const navigate = useNavigate();
  const { agencyId } = useAuth();
  const { prospects } = useProspects();
  const { models } = useRoster();
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agencyId) return;
    loadNotifications();
  }, [agencyId, prospects, models]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('direction', 'inbound')
        .order('sent_at', { ascending: false })
        .limit(20);

      const items: NotificationItem[] = [];

      const prospectIds = prospects.map((p) => p.id);
      const modelIds = models.map((m) => m.id);

      for (const ev of events ?? []) {
        if (ev.event_type === 'evaluation_confirmed' || ev.event_type === 'evaluation_overridden') {
          items.push({
            id: ev.id,
            type: 'EVALUATIONS',
            unread: !ev.read_at,
            title: `Evaluation ${ev.event_type === 'evaluation_confirmed' ? 'confirmed' : 'overridden'}`,
            time: timeAgo(ev.created_at),
            sortAt: ev.created_at,
            badge: {
              text: ev.event_type === 'evaluation_confirmed' ? 'CONFIRMED' : 'OVERRIDDEN',
              color: ev.event_type === 'evaluation_confirmed' ? 'green' : 'amber',
            },
            source: 'event',
          });
        }
        if (ev.event_type === 'signed_status_updated') {
          items.push({
            id: ev.id,
            type: 'STATUS UPDATES',
            unread: !ev.read_at,
            title: `Prospect status updated to ${(ev.metadata as { status?: string })?.status?.toUpperCase() ?? 'UNKNOWN'}`,
            time: timeAgo(ev.created_at),
            sortAt: ev.created_at,
            badge: {
              text: (ev.metadata as { status?: string })?.status?.toUpperCase() ?? '',
              color: 'amber',
            },
            source: 'event',
          });
        }
        if (ev.event_type === 'message_sent') {
          const metadata = (ev.metadata ?? {}) as {
            prospectId?: string;
            toEmail?: string;
            bodyPreview?: string;
          };
          const entityId = metadata.prospectId;
          const preview = metadata.bodyPreview?.trim();
          items.push({
            id: ev.id,
            type: 'MESSAGES',
            unread: !ev.read_at,
            title: preview
              ? preview
              : `Message sent to ${metadata.toEmail ?? 'contact'}`,
            time: timeAgo(ev.created_at),
            sortAt: ev.created_at,
            badge: { text: 'SENT', color: 'teal' },
            path: resolveMessageTabPath(entityId, prospectIds, modelIds),
            source: 'event',
          });
        }
      }

      for (const msg of messages ?? []) {
        const prospect = prospects.find((p) => p.id === msg.prospect_id);
        const model = models.find((m) => m.id === msg.prospect_id);
        const entityName = prospect?.name ?? model?.name ?? msg.from_email;
        items.push({
          id: msg.id,
          type: 'MESSAGES',
          unread: !msg.read_at,
          title: `${entityName}: ${messagePreviewText(msg)}`,
          time: timeAgo(msg.sent_at),
          sortAt: msg.sent_at,
          badge: { text: 'REPLY', color: 'green' },
          path: resolveMessageTabPath(msg.prospect_id, prospectIds, modelIds),
          source: 'message',
        });
      }

      items.sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());
      setNotifications(items);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!agencyId) return;
    const readAt = new Date().toISOString();
    await supabase
      .from('events')
      .update({ read_at: readAt })
      .eq('agency_id', agencyId)
      .is('read_at', null);
    await supabase
      .from('messages')
      .update({ read_at: readAt })
      .eq('agency_id', agencyId)
      .eq('direction', 'inbound')
      .is('read_at', null);
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
    window.dispatchEvent(new Event('notifications-read'));
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (notification.unread && agencyId) {
      const readAt = new Date().toISOString();
      if (notification.source === 'message') {
        await supabase
          .from('messages')
          .update({ read_at: readAt })
          .eq('id', notification.id);
      } else {
        await supabase
          .from('events')
          .update({ read_at: readAt })
          .eq('id', notification.id);
      }
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, unread: false } : item,
        ),
      );
      window.dispatchEvent(new Event('notifications-updated'));
    }

    if (notification.path) {
      navigate(notification.path);
    }
  };

  const filters: FilterType[] = ['ALL', 'EVALUATIONS', 'MESSAGES', 'STATUS UPDATES'];
  const filtered =
    activeFilter === 'ALL'
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const getBadgeStyles = (color: string) => {
    switch (color) {
      case 'green':
        return {
          backgroundColor: 'rgba(106,186,186,0.15)',
          color: '#6ababa',
          border: '1px solid rgba(106,186,186,0.3)',
        };
      case 'amber':
        return {
          backgroundColor: 'rgba(212,165,116,0.15)',
          color: '#d4a574',
          border: '1px solid rgba(212,165,116,0.3)',
        };
      case 'teal':
        return {
          backgroundColor: 'rgba(100,200,200,0.15)',
          color: '#64c8c8',
          border: '1px solid rgba(100,200,200,0.3)',
        };
      default:
        return {};
    }
  };

  const getIcon = (type: FilterType) => {
    switch (type) {
      case 'EVALUATIONS':
        return ImageIcon;
      case 'MESSAGES':
        return MessageSquare;
      case 'STATUS UPDATES':
        return Tag;
      default:
        return UserCheck;
    }
  };

  return (
    <div className="p-[48px]" style={{ backgroundColor: 'var(--cv-background)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px' }}>
        <div className="mb-[32px] flex items-center justify-between">
          <div>
            <h1
              className="text-[40px] mb-[8px]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
            >
              Notifications
            </h1>
            <p className="text-[13px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}>
              Evaluations, messages, and status updates.
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] uppercase tracking-[0.05em] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)', cursor: 'pointer' }}
          >
            MARK ALL READ
          </button>
        </div>

        <div className="flex flex-wrap gap-[8px] mb-[32px]">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className="px-[16px] py-[8px] rounded-full text-[11px] uppercase tracking-[0.1em] transition-colors cursor-pointer"
              style={{
                fontFamily: 'var(--font-label)',
                border: activeFilter === filter ? '1px solid var(--cv-primary-text)' : '1px solid var(--cv-subtle-border)',
                backgroundColor: activeFilter === filter ? 'var(--cv-primary-text)' : 'transparent',
                color: activeFilter === filter ? 'var(--cv-background)' : 'var(--cv-secondary-text)',
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div
          className="rounded-[4px] overflow-hidden"
          style={{ backgroundColor: 'var(--cv-surface)', border: '1px solid var(--cv-subtle-border)' }}
        >
          {loading ? (
            <div
              className="py-[48px] text-center"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-secondary-text)' }}
            >
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="py-[48px] text-center"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-secondary-text)' }}
            >
              No notifications yet. They will appear here as you use CastView.
            </div>
          ) : (
            filtered.map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <div
                  key={`${notification.source}-${notification.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => void handleNotificationClick(notification)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void handleNotificationClick(notification);
                    }
                  }}
                  className="relative px-[24px] py-[20px] border-b last:border-b-0 hover:bg-[var(--cv-elevated)] transition-colors cursor-pointer"
                  style={{
                    backgroundColor: notification.unread ? 'var(--cv-elevated)' : 'var(--cv-surface)',
                    borderColor: 'var(--cv-subtle-border)',
                  }}
                >
                  {notification.unread && (
                    <div
                      className="absolute left-[8px] top-[28px] w-[6px] h-[6px] rounded-full"
                      style={{ backgroundColor: 'var(--cv-primary-text)' }}
                    />
                  )}
                  <div
                    className="flex items-start gap-[16px]"
                    style={{ marginLeft: notification.unread ? '12px' : '0' }}
                  >
                    <div className="mt-[2px]">
                      <Icon size={16} style={{ color: 'var(--cv-secondary-text)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] mb-[4px]"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)', lineHeight: 1.4 }}
                      >
                        {notification.title}
                      </p>
                      <p className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}>
                        {notification.time}
                      </p>
                    </div>
                    {notification.badge && (
                      <div
                        className="px-[10px] py-[6px] rounded-[4px] text-[10px] uppercase tracking-[0.05em] whitespace-nowrap"
                        style={{
                          fontFamily: 'var(--font-label)',
                          ...getBadgeStyles(notification.badge.color),
                        }}
                      >
                        {notification.badge.text}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
