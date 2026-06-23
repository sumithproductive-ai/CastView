import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, Link } from 'react-router';
import { LayoutDashboard, Users, Image, Settings, Bell, Sun, Moon, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationsPanel } from './NotificationsPanel';

type NavItem = { name: string; icon: LucideIcon; path: string };

const coreNavItems: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Prospects', icon: Users, path: '/prospects' },
  { name: 'Roster', icon: Image, path: '/roster' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if in onboarding mode
  const isOnboarding = location.pathname.startsWith('/onboarding');
  
  const isActive = (itemName: string) => {
    // During onboarding, no items are active
    if (isOnboarding) return false;
    
    const path = location.pathname;
    
    if (itemName === 'Dashboard') {
      return path === '/';
    }
    if (itemName === 'Prospects') {
      return path === '/prospects' || path.startsWith('/prospects/') || path === '/profile' || path === '/rendering';
    }
    if (itemName === 'Roster') {
      return path === '/roster' || path.startsWith('/roster/');
    }
    if (itemName === 'Settings') {
      return path === '/settings';
    }
    return false;
  };
  
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { agencyId, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const accountLabel = user?.email
    ? user.email.length > 22
      ? `${user.email.slice(0, 19)}...`
      : user.email
    : 'Account';

  useEffect(() => {
    if (!agencyId) return;

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

      setUnreadCount((eventCount ?? 0) + (messageCount ?? 0));
    };

    loadUnread();

    const channel = supabase
      .channel('sidebar-unread')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `agency_id=eq.${agencyId}`,
      }, () => loadUnread())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `agency_id=eq.${agencyId}`,
      }, () => loadUnread())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `agency_id=eq.${agencyId}`,
      }, () => loadUnread())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `agency_id=eq.${agencyId}`,
      }, () => loadUnread())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [agencyId]);

  useEffect(() => {
    const handleNotificationsChanged = () => {
      if (!agencyId) return;
      void (async () => {
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

        setUnreadCount((eventCount ?? 0) + (messageCount ?? 0));
      })();
    };

    window.addEventListener('notifications-read', handleNotificationsChanged);
    window.addEventListener('notifications-updated', handleNotificationsChanged);
    return () => {
      window.removeEventListener('notifications-read', handleNotificationsChanged);
      window.removeEventListener('notifications-updated', handleNotificationsChanged);
    };
  }, [agencyId]);
  
  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className="hidden md:flex w-[240px] bg-[#111111] border-r border-[#2a2a2a] flex-col p-[24px] self-stretch"
        style={{ boxShadow: '1px 0 0 #1a1a1a' }}
      >
        {/* Logo */}
        <div className="py-[20px] mb-[48px]">
          <span 
            className="text-[20px]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec', letterSpacing: '0.06em' }}
          >
            CastView
          </span>
        </div>
        
        <nav className="flex-1 space-y-[4px]">
          {coreNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.name);
            
            // During onboarding, render as disabled div instead of Link
            if (isOnboarding) {
              return (
                <div key={item.name}>
                  <div
                    className="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[4px]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      color: '#6a6a64',
                      cursor: 'pointer',
                      opacity: 0.5
                    }}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </div>
                </div>
              );
            }
            
            return (
              <div key={item.name}>
                <Link
                  to={item.path}
                  className="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[4px] transition-all duration-200 hover:bg-[#1a1a1a]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: active ? '#f0f0ec' : '#a0a09a',
                    backgroundColor: active ? '#1a1a1a' : 'transparent',
                    boxShadow: active
                      ? 'inset 2px 0 0 #C8A96E'
                      : 'inset 2px 0 0 transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon
                    size={16}
                    style={{
                      filter: active
                        ? 'drop-shadow(0 0 4px rgba(200, 169, 110, 0.3))'
                        : 'none',
                    }}
                  />
                  <span style={{ letterSpacing: active ? '0.08em' : '0.05em' }}>
                    {item.name}
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>
        
        {/* Onboarding Status Label */}
        {isOnboarding && (
          <div 
            className="mb-[16px] text-[10px] uppercase tracking-[0.1em] text-center py-[6px] px-[12px] rounded-[4px]"
            style={{ 
              fontFamily: 'var(--font-label)', 
              color: '#d4a574',
              backgroundColor: 'rgba(212, 165, 116, 0.1)',
              border: '1px solid rgba(212, 165, 116, 0.2)'
            }}
          >
            SETUP IN PROGRESS
          </div>
        )}
        
        {/* Sticky Bottom Section */}
        <div
          className="sticky bottom-0 pt-[16px]"
          style={{
            backgroundColor: 'var(--cv-surface)',
            borderTop: '1px solid var(--cv-subtle-border)',
          }}
        >
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="mb-[12px] px-[12px] py-[8px] rounded-[4px] flex items-center justify-between w-full transition-colors hover:opacity-80"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--cv-secondary-text)',
              backgroundColor: 'var(--cv-elevated)',
              border: '1px solid var(--cv-subtle-border)',
              cursor: 'pointer',
            }}
          >
            <span style={{ color: 'var(--cv-primary-text)' }}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
            {theme === 'dark' ? (
              <Sun size={14} style={{ color: 'var(--cv-accent)' }} />
            ) : (
              <Moon size={14} style={{ color: 'var(--cv-accent)' }} />
            )}
          </button>

          {/* Notifications Bell */}
          <button
            data-notifications-bell
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative mb-[16px] px-[12px] py-[10px] rounded-[4px] transition-colors hover:bg-[#1a1a1a] flex items-center gap-[12px]"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: '#a0a09a',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <div className="relative">
              <Bell size={16} />
              {unreadCount > 0 && (
                <div
                  className="absolute -top-[4px] -right-[6px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-[4px]"
                  style={{
                    backgroundColor: '#f0f0ec',
                    color: '#080808',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 600
                  }}
                >
                  {unreadCount}
                </div>
              )}
            </div>
            <span>Notifications</span>
          </button>
          
          <Link
            to="/settings"
            className="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[4px] transition-colors hover:bg-[#1a1a1a] cursor-pointer"
            title={user?.email ?? 'Account settings'}
          >
            <div className="w-[32px] h-[32px] rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex-shrink-0" />
            <span
              className="truncate"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a' }}
            >
              {accountLabel}
            </span>
          </Link>
        </div>
      </div>
      
      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {createPortal(
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#111111] border-t border-[#2a2a2a] flex items-center justify-around h-[64px] z-50">
          {coreNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.name);

            if (isOnboarding) {
              return (
                <div key={item.name} className="flex items-center flex-1">
                  <div
                    className="flex flex-col items-center justify-center gap-[4px] flex-1"
                    style={{
                      opacity: 0.5,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={20} style={{ color: '#6a6a64' }} />
                    <span
                      className="text-[9px] uppercase tracking-[0.05em] flex items-center"
                      style={{
                        fontFamily: 'var(--font-label)',
                        color: '#6a6a64',
                      }}
                    >
                      {item.name}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.name} className="flex items-center flex-1">
                <Link
                  to={item.path}
                  className="flex flex-col items-center justify-center gap-[4px] flex-1 transition-all duration-200"
                  style={{
                    boxShadow: active
                      ? 'inset 0 -2px 0 #C8A96E'
                      : 'inset 0 -2px 0 transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon
                    size={20}
                    style={{ color: active ? '#f0f0ec' : '#a0a09a' }}
                  />
                  <span
                    className="text-[9px] uppercase tracking-[0.05em] flex items-center"
                    style={{
                      fontFamily: 'var(--font-label)',
                      color: active ? '#f0f0ec' : '#a0a09a',
                    }}
                  >
                    {item.name}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}