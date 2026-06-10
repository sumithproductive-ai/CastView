import React, { useEffect, useState } from 'react';
import { X, Image as ImageIcon, MessageSquare, Tag } from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { messagePreviewText, resolveEntityProfilePath, resolveMessageTabPath } from '../../lib/messageEntity';
import { useAuth } from '../context/AuthContext';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PanelNotification {
  id: string;
  unread: boolean;
  title: string;
  body?: string;
  time: string;
  badge: { text: string; color: string };
  path: string;
  type: string;
  source: 'event' | 'message';
  sortAt: string;
}

interface InboundMessage {
  id: string;
  prospect_id?: string | null;
  prospect_name?: string | null;
  body: string;
  sent_at: string;
  from_email: string;
  read_at?: string | null;
}

function formatEventType(eventType: string): string {
  const spaced = eventType.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function mapEventToPanelItem(
  ev: {
    id: string;
    event_type: string;
    created_at: string;
    read_at: string | null;
    metadata: unknown;
  },
  resolveProfilePath: (entityId?: string) => string,
  resolveMessagesPath: (entityId?: string) => string,
): PanelNotification {
  const metadata = (ev.metadata ?? {}) as Record<string, unknown>;
  const entityId = (metadata.prospectId ?? metadata.entityId) as string | undefined;
  const path = entityId ? resolveProfilePath(entityId) : '/prospects';

  switch (ev.event_type) {
    case 'evaluation_confirmed':
      return {
        id: ev.id,
        unread: !ev.read_at,
        title: 'Evaluation confirmed',
        time: timeAgo(ev.created_at),
        badge: { text: 'CONFIRMED', color: 'green' },
        path,
        type: 'eval',
        source: 'event',
        sortAt: ev.created_at,
      };
    case 'evaluation_overridden':
      return {
        id: ev.id,
        unread: !ev.read_at,
        title: 'Evaluation override saved',
        time: timeAgo(ev.created_at),
        badge: { text: 'OVERRIDE', color: 'amber' },
        path,
        type: 'eval',
        source: 'event',
        sortAt: ev.created_at,
      };
    case 'signed_status_updated':
      return {
        id: ev.id,
        unread: !ev.read_at,
        title: `Status updated to ${(metadata.status as string) ?? ''}`,
        time: timeAgo(ev.created_at),
        badge: { text: 'STATUS', color: 'amber' },
        path,
        type: 'status',
        source: 'event',
        sortAt: ev.created_at,
      };
    case 'prospect_added':
      return {
        id: ev.id,
        unread: !ev.read_at,
        title: 'New prospect added',
        time: timeAgo(ev.created_at),
        badge: { text: 'NEW', color: 'teal' },
        path,
        type: 'prospect',
        source: 'event',
        sortAt: ev.created_at,
      };
    case 'message_sent': {
      const preview = (metadata.bodyPreview as string | undefined)?.trim();
      const toEmail = (metadata.toEmail as string | undefined)?.trim();
      return {
        id: ev.id,
        unread: !ev.read_at,
        title: 'Message sent',
        body: preview || (toEmail ? `To ${toEmail}` : undefined),
        time: timeAgo(ev.created_at),
        badge: { text: 'SENT', color: 'teal' },
        path: entityId ? resolveMessagesPath(entityId) : '/prospects',
        type: 'message',
        source: 'event',
        sortAt: ev.created_at,
      };
    }
    default:
      return {
        id: ev.id,
        unread: !ev.read_at,
        title: formatEventType(ev.event_type),
        time: timeAgo(ev.created_at),
        badge: { text: 'EVENT', color: 'teal' },
        path: '/notifications',
        type: 'event',
        source: 'event',
        sortAt: ev.created_at,
      };
  }
}

function mapInboundMessageToPanelItem(
  msg: InboundMessage,
  resolvePath: (entityId?: string) => string,
): PanelNotification {
  const entityId = msg.prospect_id ?? null;
  const displayName = msg.prospect_name?.trim() || msg.from_email;

  return {
    id: msg.id,
    unread: !msg.read_at,
    title: `${displayName} replied`,
    body: messagePreviewText(msg),
    time: timeAgo(msg.sent_at),
    badge: { text: 'REPLY', color: 'reply' },
    path: entityId ? resolvePath(entityId) : '/prospects',
    type: 'message',
    source: 'message',
    sortAt: msg.sent_at,
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const navigate = useNavigate();
  const { agencyId } = useAuth();
  const { prospects } = useProspects();
  const { models } = useRoster();
  const [notifications, setNotifications] = useState<PanelNotification[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notifications-panel]') && !target.closest('[data-notifications-bell]')) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 100);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    if (!agencyId) return;

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (eventsError) {
      console.error('[NotificationsPanel] events query error:', eventsError);
      setNotifications([]);
      return;
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, prospect_id, body, sent_at, from_email, read_at')
      .eq('agency_id', agencyId)
      .eq('direction', 'inbound')
      .order('sent_at', { ascending: false })
      .limit(10);

    if (messagesError) {
      console.error('[NotificationsPanel] messages query error:', messagesError);
    }

    const entityIds = [
      ...new Set(
        (messages ?? [])
          .map((msg) => msg.prospect_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const prospectNames: Record<string, string> = {};
    const modelNames: Record<string, string> = {};

    if (entityIds.length > 0) {
      const { data: prospectRows } = await supabase
        .from('prospects')
        .select('id, name')
        .in('id', entityIds);

      for (const prospect of prospectRows ?? []) {
        prospectNames[prospect.id] = prospect.name;
      }

      const unresolvedIds = entityIds.filter((id) => !prospectNames[id]);
      if (unresolvedIds.length > 0) {
        const { data: modelRows } = await supabase
          .from('models')
          .select('id, name')
          .in('id', unresolvedIds);

        for (const model of modelRows ?? []) {
          modelNames[model.id] = model.name;
        }
      }
    }

    const prospectIds = prospects.map((p) => p.id);
    const modelIds = models.map((m) => m.id);
    const resolveProfilePath = (entityId?: string) =>
      resolveEntityProfilePath(entityId, prospectIds, modelIds);
    const resolveMessagesPath = (entityId?: string) =>
      resolveMessageTabPath(entityId, prospectIds, modelIds);

    const items: PanelNotification[] = [];

    for (const msg of (messages ?? []) as InboundMessage[]) {
      const entityId = msg.prospect_id ?? null;
      items.push(
        mapInboundMessageToPanelItem(
          {
            ...msg,
            prospect_name: entityId
              ? prospectNames[entityId] ?? modelNames[entityId] ?? null
              : null,
          },
          resolveMessagesPath,
        ),
      );
    }

    for (const ev of events ?? []) {
      items.push(mapEventToPanelItem(ev, resolveProfilePath, resolveMessagesPath));
    }

    items.sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      return new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime();
    });
    setNotifications(items.slice(0, 8));
  };

  useEffect(() => {
    if (isOpen && agencyId) {
      loadNotifications();
    }
  }, [isOpen, agencyId, prospects, models]);

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
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    window.dispatchEvent(new Event('notifications-read'));
  };

  const handleNotificationClick = async (notification: PanelNotification) => {
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

    navigate(notification.path);
    onClose();
  };

  const getBadgeStyles = (color: string) => {
    switch (color) {
      case 'reply': return { backgroundColor: '#4a7a4a', color: '#f0f0ec', border: '1px solid #4a7a4a' };
      case 'green': return { backgroundColor: 'rgba(106,186,186,0.15)', color: '#6ababa', border: '1px solid rgba(106,186,186,0.3)' };
      case 'amber': return { backgroundColor: 'rgba(212,165,116,0.15)', color: '#d4a574', border: '1px solid rgba(212,165,116,0.3)' };
      case 'teal': return { backgroundColor: 'rgba(100,200,200,0.15)', color: '#64c8c8', border: '1px solid rgba(100,200,200,0.3)' };
      default: return {};
    }
  };

  const getIcon = (type: string) => {
    if (type === 'message') return MessageSquare;
    if (type === 'status') return Tag;
    return ImageIcon;
  };

  if (!isOpen) return null;

  return (
    <div
      data-notifications-panel
      className="fixed left-0 md:left-[240px] top-0 h-screen flex flex-col border-r"
      style={{ width: '320px', backgroundColor: '#111111', borderColor: '#2a2a2a', zIndex: 40 }}
    >
      <div className="flex items-center justify-between px-[16px] py-[16px] border-b" style={{ borderColor: '#2a2a2a' }}>
        <h2 className="text-[11px] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-label)', color: '#f0f0ec' }}>
          NOTIFICATIONS
        </h2>
        <div className="flex items-center gap-[16px]">
          <button onClick={handleMarkAllRead} className="text-[12px] hover:opacity-70 transition-opacity" style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}>
            MARK ALL READ
          </button>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity" style={{ color: '#a0a09a' }}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-[48px] px-[16px] text-center" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#888880' }}>
            No notifications yet.
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            return (
              <div
                key={`${notification.source}-${notification.id}`}
                onClick={() => { void handleNotificationClick(notification); }}
                className="relative px-[16px] py-[16px] border-b hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                style={{ backgroundColor: notification.unread ? '#161616' : '#111111', borderColor: '#2a2a2a' }}
              >
                {notification.unread && (
                  <div className="absolute left-[6px] top-[24px] w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#f0f0ec' }} />
                )}
                <div className="flex items-start gap-[12px]" style={{ marginLeft: notification.unread ? '10px' : '0' }}>
                  <div className="mt-[2px]"><Icon size={14} style={{ color: '#a0a09a' }} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] mb-[4px]" style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', lineHeight: 1.4 }}>
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-[11px] mb-[4px]" style={{ fontFamily: 'var(--font-mono)', color: '#888880', lineHeight: 1.4 }}>
                        {notification.body}
                      </p>
                    )}
                    <p className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}>
                      {notification.time}
                    </p>
                  </div>
                  <div
                    className="px-[8px] py-[4px] rounded-[4px] text-[10px] uppercase tracking-[0.05em] whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-label)', ...getBadgeStyles(notification.badge.color) }}
                  >
                    {notification.badge.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-[16px] border-t" style={{ borderColor: '#2a2a2a' }}>
        <a
          href="/notifications"
          className="block w-full py-[12px] text-center border rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#1a1a1a] transition-colors"
          style={{ fontFamily: 'var(--font-label)', borderColor: '#2a2a2a', color: '#f0f0ec' }}
        >
          VIEW ALL NOTIFICATIONS
        </a>
      </div>
    </div>
  );
}
