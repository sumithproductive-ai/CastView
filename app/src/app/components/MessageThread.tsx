import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authFetch } from '../../lib/apiAuth';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  direction: 'outbound' | 'inbound';
  subject: string;
  body: string;
  to_email: string;
  from_email: string;
  sent_at: string;
  thread_date?: string | null;
  sent_by_agency?: boolean | null;
}

interface Props {
  prospectId: string;
  prospectName: string;
  prospectEmail?: string;
}

function isOutbound(msg: Message): boolean {
  return msg.direction === 'outbound' || msg.sent_by_agency === true;
}

function getMessageDateKey(msg: Message): string {
  if (msg.thread_date) {
    return msg.thread_date.split('T')[0] ?? msg.thread_date;
  }
  return msg.sent_at.split('T')[0] ?? msg.sent_at;
}

function formatDateSeparator(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase();
}

function formatMessageTime(sentAt: string): string {
  return new Date(sentAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function hasThreadToday(messages: Message[]): boolean {
  const today = new Date().toDateString();
  return messages.some((msg) => {
    const dateKey = getMessageDateKey(msg);
    const [year, month, day] = dateKey.split('-').map(Number);
    const messageDate = new Date(year, month - 1, day).toDateString();
    return messageDate === today;
  });
}

function getReplySubject(messages: Message[]): string {
  const lastWithSubject = [...messages].reverse().find((msg) => msg.subject?.trim());
  if (!lastWithSubject?.subject) return 'Message';
  const subject = lastWithSubject.subject.trim();
  return subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
}

function groupMessagesByDate(messages: Message[]): Array<{ dateKey: string; messages: Message[] }> {
  const groups = new Map<string, Message[]>();

  for (const msg of messages) {
    const dateKey = getMessageDateKey(msg);
    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(msg);
    } else {
      groups.set(dateKey, [msg]);
    }
  }

  return Array.from(groups.entries()).map(([dateKey, sectionMessages]) => ({
    dateKey,
    messages: sectionMessages,
  }));
}

function MessageSkeleton({ align }: { align: 'left' | 'right' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'right' ? 'flex-end' : 'flex-start',
        gap: '6px',
      }}
    >
      <div
        style={{
          width: align === 'right' ? '58%' : '52%',
          height: '52px',
          borderRadius: align === 'right' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          opacity: 0.7,
        }}
      />
      <div
        style={{
          width: '48px',
          height: '8px',
          borderRadius: '4px',
          background: '#2a2a2a',
          opacity: 0.7,
        }}
      />
    </div>
  );
}

export function MessageThread({ prospectId, prospectName, prospectEmail }: Props) {
  const { agencyId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [toEmail, setToEmail] = useState(prospectEmail ?? '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!prospectId || !agencyId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('prospect_id', prospectId)
      .eq('agency_id', agencyId)
      .order('sent_at', { ascending: true });

    setMessages(data ?? []);
    setLoading(false);
  }, [prospectId, agencyId]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    setToEmail(prospectEmail ?? '');
  }, [prospectEmail]);

  useEffect(() => {
    if (loading) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, sending, sent]);

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);
  const showSubject = useMemo(() => !hasThreadToday(messages), [messages]);

  const handleSend = async () => {
    const effectiveSubject = showSubject ? subject.trim() : getReplySubject(messages);
    if (!toEmail || !effectiveSubject || !body || !agencyId) return;

    setSending(true);
    try {
      const res = await authFetch('/api/send-message', {
        method: 'POST',
        body: JSON.stringify({
          prospectId,
          toEmail,
          toName: prospectName,
          subject: effectiveSubject,
          body,
          agencyName: 'CastView Agency',
        }),
      });

      if (res.ok) {
        setSent(true);
        try {
          await supabase.from('events').insert({
            agency_id: agencyId,
            event_type: 'message_sent',
            metadata: { prospectId, toEmail },
          });
        } catch {
          /* non-critical */
        }
        setBody('');
        if (showSubject) {
          setSubject('');
        }
        setTimeout(() => setSent(false), 3000);
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  const canSend = Boolean(toEmail && body && (!showSubject || subject.trim()));

  return (
    <div style={{ marginBottom: '32px' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: '#888880',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        Messages{messages.length > 0 ? ` (${messages.length})` : ''}
      </div>

      <div
        style={{
          background: '#111111',
          border: '1px solid #2a2a2a',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '400px',
            overflowY: 'auto',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {loading && (
            <>
              <MessageSkeleton align="right" />
              <MessageSkeleton align="left" />
              <MessageSkeleton align="right" />
            </>
          )}

          {!loading && messages.length === 0 && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#555550',
                lineHeight: 1.6,
                padding: '24px',
              }}
            >
              No messages yet. Send your first message below.
            </div>
          )}

          {!loading &&
            groupedMessages.map((section) => (
              <div key={section.dateKey}>
                <div
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: '#555550',
                    letterSpacing: '0.06em',
                    marginBottom: '16px',
                  }}
                >
                  {formatDateSeparator(section.dateKey)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {section.messages.map((msg) => {
                    const outbound = isOutbound(msg);

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: outbound ? 'flex-end' : 'flex-start',
                          gap: '4px',
                        }}
                      >
                        {!outbound && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              color: '#888880',
                              paddingLeft: '4px',
                            }}
                          >
                            {msg.from_email}
                          </span>
                        )}

                        <div
                          style={{
                            maxWidth: '70%',
                            padding: '12px 14px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '13px',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            ...(outbound
                              ? {
                                  background: '#f0f0ec',
                                  color: '#080808',
                                  borderRadius: '12px 12px 2px 12px',
                                }
                              : {
                                  background: '#1a1a1a',
                                  color: '#f0f0ec',
                                  border: '1px solid #2a2a2a',
                                  borderRadius: '12px 12px 12px 2px',
                                }),
                          }}
                        >
                          {msg.body}
                        </div>

                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            color: '#555550',
                            paddingLeft: outbound ? 0 : '4px',
                            paddingRight: outbound ? '4px' : 0,
                          }}
                        >
                          {formatMessageTime(msg.sent_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          <div ref={messagesEndRef} />
        </div>

        <div
          style={{
            borderTop: '1px solid #2a2a2a',
            background: '#1a1a1a',
            padding: '20px',
          }}
        >
          {!prospectEmail && (
            <input
              type="email"
              placeholder="To: model@email.com"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              style={{
                width: '100%',
                background: '#111111',
                border: '1px solid #2a2a2a',
                borderRadius: '4px',
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#F0F0EC',
                marginBottom: '10px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          )}

          {showSubject && (
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%',
                background: '#111111',
                border: '1px solid #2a2a2a',
                borderRadius: '4px',
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#F0F0EC',
                marginBottom: '10px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          )}

          <textarea
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              background: '#111111',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              padding: '10px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#F0F0EC',
              resize: 'vertical',
              marginBottom: '12px',
              boxSizing: 'border-box',
              outline: 'none',
              minHeight: '56px',
            }}
          />

          {sent && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#4a7a4a',
                letterSpacing: '0.08em',
                padding: '10px 0',
                textTransform: 'uppercase',
              }}
            >
              ✓ Message sent successfully
            </div>
          )}

          {!sent && (
            <button
              onClick={handleSend}
              disabled={sending || !canSend}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '10px 24px',
                background: '#C8A96E',
                color: '#080808',
                border: 'none',
                borderRadius: '4px',
                cursor: sending || !canSend ? 'not-allowed' : 'pointer',
                opacity: !canSend ? 0.5 : 1,
                transition: 'background 0.2s',
              }}
            >
              {sending ? 'SENDING...' : 'SEND MESSAGE →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
