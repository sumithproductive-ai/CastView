import React from 'react';
import { useState } from 'react';
import { Image as ImageIcon, UserCheck, Eye, Tag } from 'lucide-react';

type FilterType = 'ALL' | 'RENDERS' | 'SIGNINGS' | 'SHARES' | 'STATUS UPDATES';

const allNotifications = [
  {
    id: 1,
    type: 'RENDERS',
    unread: true,
    icon: ImageIcon,
    title: 'Sumith Chittimalla — Fragrance evaluation complete',
    time: '2 minutes ago',
    badge: { text: '94%', color: 'green' }
  },
  {
    id: 2,
    type: 'RENDERS',
    unread: true,
    icon: ImageIcon,
    title: 'John Doe — Comparison complete — 3 contexts',
    time: '18 minutes ago',
    badge: { text: '91% top score', color: 'green' }
  },
  {
    id: 3,
    type: 'SIGNINGS',
    unread: false,
    icon: UserCheck,
    title: 'Zara Klein · Signed to roster',
    time: '2 hours ago',
    badge: { text: 'SIGNED', color: 'amber' }
  },
  {
    id: 4,
    type: 'SHARES',
    unread: false,
    icon: Eye,
    title: 'Package shared · Sofia Andersen · Viewed by client',
    time: '1 day ago',
    badge: { text: 'VIEWED', color: 'teal' }
  },
  {
    id: 5,
    type: 'STATUS UPDATES',
    unread: false,
    icon: Tag,
    title: 'Ava Laurent · Status updated to Shortlisted',
    time: '2 days ago',
    badge: { text: 'SHORTLISTED', color: 'amber' }
  },
  {
    id: 6,
    type: 'RENDERS',
    unread: false,
    icon: ImageIcon,
    title: 'Sumith Chittimalla — Editorial evaluation complete',
    time: '3 days ago',
    badge: { text: '89%', color: 'green' }
  },
  {
    id: 7,
    type: 'SHARES',
    unread: false,
    icon: Eye,
    title: 'Package shared · Marcus Chen · Downloaded by client',
    time: '4 days ago',
    badge: { text: 'DOWNLOADED', color: 'teal' }
  },
  {
    id: 8,
    type: 'SIGNINGS',
    unread: false,
    icon: UserCheck,
    title: 'Luca Moretti · Moved to active roster',
    time: '5 days ago',
    badge: { text: 'ACTIVE', color: 'amber' }
  },
  {
    id: 9,
    type: 'STATUS UPDATES',
    unread: false,
    icon: Tag,
    title: 'Sofia Andersen · Status updated to Booked',
    time: '1 week ago',
    badge: { text: 'BOOKED', color: 'amber' }
  },
  {
    id: 10,
    type: 'RENDERS',
    unread: false,
    icon: ImageIcon,
    title: 'John Doe — Campaign evaluation complete',
    time: '1 week ago',
    badge: { text: '92%', color: 'green' }
  }
];

export function Notifications() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [notifications, setNotifications] = useState(allNotifications);

  const filters: FilterType[] = ['ALL', 'RENDERS', 'SIGNINGS', 'SHARES', 'STATUS UPDATES'];

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    window.dispatchEvent(
      new Event('notifications-read')
    );
  };

  const filteredNotifications = activeFilter === 'ALL' 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter);

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
    <div className="p-[48px]" style={{ backgroundColor: '#080808', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div className="mb-[32px] flex items-center justify-between">
          <div>
            <h1 
              className="text-[40px] mb-[8px]" 
              style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
            >
              Notifications
            </h1>
            <p 
              className="text-[13px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
            >
              Stay updated on evaluations, signings, and shares.
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] uppercase tracking-[0.05em] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', color: '#888880', cursor: 'pointer' }}
          >
            MARK ALL READ
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-[8px] mb-[32px]">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className="px-[16px] py-[8px] rounded-full text-[11px] uppercase tracking-[0.1em] transition-colors cursor-pointer"
                style={{ 
                  fontFamily: 'var(--font-label)',
                  border: isActive ? '1px solid #f0f0ec' : '1px solid #2a2a2a',
                  backgroundColor: isActive ? '#f0f0ec' : 'transparent',
                  color: isActive ? '#080808' : '#a0a09a'
                }}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        <div 
          className="rounded-[4px] overflow-hidden"
          style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}
        >
          {filteredNotifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.id}
                className="relative px-[24px] py-[20px] border-b last:border-b-0 hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                style={{
                  backgroundColor: notification.unread ? '#161616' : '#111111',
                  borderColor: '#2a2a2a'
                }}
              >
                {/* Unread Dot */}
                {notification.unread && (
                  <div
                    className="absolute left-[8px] top-[28px] w-[6px] h-[6px] rounded-full"
                    style={{ backgroundColor: '#f0f0ec' }}
                  />
                )}

                {/* Content */}
                <div className="flex items-start gap-[16px]" style={{ marginLeft: notification.unread ? '12px' : '0' }}>
                  {/* Icon */}
                  <div className="mt-[2px]">
                    <Icon size={16} style={{ color: '#a0a09a' }} />
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
                      className="px-[10px] py-[6px] rounded-[4px] text-[10px] uppercase tracking-[0.05em] whitespace-nowrap"
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

        {/* Pagination */}
        <div className="flex justify-center gap-[12px] mt-[32px]">
          <button
            className="px-[16px] py-[8px] rounded-[4px] border text-[11px] uppercase tracking-[0.1em] hover:bg-[#1a1a1a] transition-colors"
            style={{
              fontFamily: 'var(--font-label)',
              borderColor: '#2a2a2a',
              color: '#a0a09a'
            }}
          >
            PREVIOUS
          </button>
          <button
            className="px-[16px] py-[8px] rounded-[4px] border text-[11px] uppercase tracking-[0.1em] hover:bg-[#1a1a1a] transition-colors"
            style={{
              fontFamily: 'var(--font-label)',
              borderColor: '#2a2a2a',
              color: '#a0a09a'
            }}
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
}