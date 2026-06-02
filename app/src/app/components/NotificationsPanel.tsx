import React, { useEffect, useState } from 'react';
import { X, Image as ImageIcon, MessageSquare, Tag } from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
}

interface PanelNotification {
  id: string;
  unread: boolean;
  title: string;
  time: string;
  badge: { text: string; color: string };
  path: string;
  type: string;
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

export function NotificationsPanel({ isOpen, onClose, onMarkAllRead }: NotificationsPanelProps) {
  const navigate = useNavigate();
  const { agencyId } = useAuth();
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

  useEffect(() => {
    if (!agencyId) return;
    loadNotifications();
  }, [agencyId]);

  useEffect(() => {
    if (!isOpen || !agencyId) return;
    loadNotifications();
  }, [isOpen]);

  const loadNotifications = async () => {
    if (!agencyId) return;
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('direction', 'inbound')
      .order('sent_at', { ascending: false })
      .limit(5);

    const items: PanelNotification[] = [];

    for (const msg of (messages ?? [])) {
      items.push({
        id: msg.id,
        unread: true,
        title: `Reply from ${msg.from_email}`,
        time: timeAgo(msg.sent_at),
        badge: { text: 'REPLY', color: 'green' },
        path: `/prospects/${msg.prospect_id}`,
        type: 'message',
      });
    }

    for (const ev of (events ?? [])) {
      if (ev.event_type === 'evaluation_confirmed') {
        items.push({
          id: ev.id,
          unread: !ev.read_at,
          title: 'Evaluation confirmed',
          time: timeAgo(ev.created_at),
          badge: { text: 'CONFIRMED', color: 'green' },
          path: '/prospects',
          type: 'eval',
        });
      }
      if (ev.event_type === 'signed_status_updated') {
        items.push({
          id: ev.id,
          unread: !ev.read_at,
          title: `Status updated to ${(ev.metadata as { status?: string })?.status ?? ''}`,
          time: timeAgo(ev.created_at),
          badge: { text: 'STATUS', color: 'amber' },
          path: '/prospects',
          type: 'status',
        });
      }
    }

    items.sort((a, b) => (a.unread === b.unread ? 0 : a.unread ? -1 : 1));
    setNotifications(items.slice(0, 8));
  };

  const handleMarkAllRead = async () => {
    await supabase
      .from('events')
      .update({ read_at: new Date().toISOString() })
      .eq('agency_id', agencyId)
      .is('read_at', null);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    onMarkAllRead();
  };

  const getBadgeStyles = (color: string) => {
    switch (color) {
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
      className="fixed left-[240px] top-0 h-screen flex flex-col border-r"
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
                key={notification.id}
                onClick={() => { navigate(notification.path); onClose(); }}
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
