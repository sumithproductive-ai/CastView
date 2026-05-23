import React from 'react';
import { useEffect } from 'react';
import { X, Image as ImageIcon, UserCheck, Eye, Tag } from 'lucide-react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
}

export function NotificationsPanel({ isOpen, onClose, onMarkAllRead }: NotificationsPanelProps) {
  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Close if clicking outside the panel and not on the bell button
      if (!target.closest('[data-notifications-panel]') && !target.closest('[data-notifications-bell]')) {
        onClose();
      }
    };

    // Add slight delay to prevent immediate close from the opening click
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      unread: true,
      icon: ImageIcon,
      title: 'Sofia Andersen · Fragrance render complete',
      time: '2 minutes ago',
      badge: { text: '94%', color: 'green' }
    },
    {
      id: 2,
      unread: true,
      icon: ImageIcon,
      title: 'Marcus Chen · Render complete — 3 contexts',
      time: '18 minutes ago',
      badge: { text: '91% top score', color: 'green' }
    },
    {
      id: 3,
      unread: false,
      icon: UserCheck,
      title: 'Zara Klein · Signed to roster',
      time: '2 hours ago',
      badge: { text: 'SIGNED', color: 'amber' }
    },
    {
      id: 4,
      unread: false,
      icon: Eye,
      title: 'Package shared · Sofia Andersen · Viewed by client',
      time: '1 day ago',
      badge: { text: 'VIEWED', color: 'teal' }
    },
    {
      id: 5,
      unread: false,
      icon: Tag,
      title: 'Ava Laurent · Status updated to Shortlisted',
      time: '2 days ago',
      badge: { text: 'SHORTLISTED', color: 'amber' }
    }
  ];

  const getBadgeStyles = (color: string) => {
    switch (color) {
      case 'green':
        return {
          backgroundColor: 'rgba(106, 186, 186, 0.15)',
          color: '#6ababa',
          border: '1px solid rgba(106, 186, 186, 0.3)'
        };
      case 'amber':
        return {
          backgroundColor: 'rgba(212, 165, 116, 0.15)',
          color: '#d4a574',
          border: '1px solid rgba(212, 165, 116, 0.3)'
        };
      case 'teal':
        return {
          backgroundColor: 'rgba(100, 200, 200, 0.15)',
          color: '#64c8c8',
          border: '1px solid rgba(100, 200, 200, 0.3)'
        };
      default:
        return {};
    }
  };

  return (
    <div
      data-notifications-panel
      className="fixed left-[240px] top-0 h-screen flex flex-col border-r"
      style={{
        width: '320px',
        backgroundColor: '#111111',
        borderColor: '#2a2a2a',
        zIndex: 40
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-[16px] py-[16px] border-b"
        style={{ borderColor: '#2a2a2a' }}
      >
        <div className="flex items-center gap-[12px]">
          <h2 
            className="text-[11px] uppercase tracking-[0.1em]"
            style={{ fontFamily: 'var(--font-label)', color: '#f0f0ec' }}
          >
            NOTIFICATIONS
          </h2>
        </div>
        
        <div className="flex items-center gap-[16px]">
          <button
            onClick={onMarkAllRead}
            className="text-[12px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
          >
            MARK ALL READ
          </button>
          <button
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
            style={{ color: '#a0a09a' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <div
              key={notification.id}
              className="relative px-[16px] py-[16px] border-b hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              style={{
                backgroundColor: notification.unread ? '#161616' : '#111111',
                borderColor: '#2a2a2a'
              }}
            >
              {/* Unread Dot */}
              {notification.unread && (
                <div
                  className="absolute left-[6px] top-[24px] w-[6px] h-[6px] rounded-full"
                  style={{ backgroundColor: '#f0f0ec' }}
                />
              )}

              {/* Content */}
              <div className="flex items-start gap-[12px]" style={{ marginLeft: notification.unread ? '10px' : '0' }}>
                {/* Icon */}
                <div className="mt-[2px]">
                  <Icon size={14} style={{ color: '#a0a09a' }} />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-[13px] mb-[4px]"
                    style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', lineHeight: 1.4 }}
                  >
                    {notification.title}
                  </p>
                  <p 
                    className="text-[11px]"
                    style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
                  >
                    {notification.time}
                  </p>
                </div>

                {/* Badge */}
                {notification.badge && (
                  <div
                    className="px-[8px] py-[4px] rounded-[4px] text-[10px] uppercase tracking-[0.05em] whitespace-nowrap"
                    style={{
                      fontFamily: 'var(--font-label)',
                      ...getBadgeStyles(notification.badge.color)
                    }}
                  >
                    {notification.badge.text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-[16px] border-t" style={{ borderColor: '#2a2a2a' }}>
        <a
          href="/notifications"
          className="block w-full py-[12px] text-center border rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#1a1a1a] transition-colors"
          style={{
            fontFamily: 'var(--font-label)',
            borderColor: '#2a2a2a',
            color: '#f0f0ec'
          }}
        >
          VIEW ALL NOTIFICATIONS
        </a>
      </div>
    </div>
  );
}