import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authFetch } from '../../lib/apiAuth';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  direction?: 'outbound' | 'inbound' | null;
  subject: string;
  body: string;
  to_email: string;
  from_email: string;
  sent_at: string | null;
  created_at?: string | null;
  thread_date?: string | null;
  sent_by_agency?: boolean | null;
}

interface Props {
  prospectId: string;
  prospectName: string;
  prospectEmail?: string;
}

const mono = 'var(--font-mono)';

function isOutbound(msg: Message): boolean {
  if (msg.direction === 'inbound') return false;
  if (msg.direction === 'outbound' || msg.sent_by_agency === true) return true;
  return true;
}

function getMessageTimestamp(msg: Message): string {
  return msg.sent_at ?? msg.created_at ?? new Date().toISOString();
}

function getMessageDateKey(msg: Message): string {
  const timestamp = getMessageTimestamp(msg);
  return timestamp.split('T')[0] ?? timestamp;
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
    .toUpperCase()
    .replace(',', ' ·');
}

function formatMessageTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#111111',
  border: '1px solid #2a2a2a',
  borderRadius: '4px',
  padding: '8px 12px',
  fontFamily: mono,
  fontSize: '13px',
  color: '#f0f0ec',
  boxSizing: 'border-box',
  outline: 'none',
};

export function MessageThread({ prospectId, prospectName, prospectEmail }: Props) {
  const { agencyId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [toEmail, setToEmail] = useState(prospectEmail ?? '');
  const [sending, setSending] = useState(false);
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

    setMessages((data ?? []) as Message[]);
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
  }, [messages, loading, sending]);

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);
  const showSubject = useMemo(() => !hasThreadToday(messages), [messages]);
  const hasEmail = Boolean(toEmail.trim());
  const canSend = hasEmail && Boolean(body.trim()) && (!showSubject || Boolean(subject.trim()));

  const handleSend = async () => {
    const messageBody = body.trim();
    const effectiveSubject = showSubject ? subject.trim() : getReplySubject(messages);
    if (!toEmail || !effectiveSubject || !messageBody || !agencyId) return;

    setSending(true);
    try {
      const res = await authFetch('/api/send-message', {
        method: 'POST',
        body: JSON.stringify({
          prospectId,
          toEmail,
          toName: prospectName,
          subject: effectiveSubject,
          body: messageBody,
          agencyName: 'CastView Agency',
        }),
      });

      if (res.ok) {
        const sentAt = new Date().toISOString();
        const optimisticMessage: Message = {
          id: crypto.randomUUID(),
          direction: 'outbound',
          subject: effectiveSubject,
          body: messageBody,
          to_email: toEmail,
          from_email: '',
          sent_at: sentAt,
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setBody('');
        if (showSubject) {
          setSubject('');
        }

        try {
          await supabase.from('events').insert({
            agency_id: agencyId,
            event_type: 'message_sent',
            metadata: { prospectId, toEmail },
          });
        } catch {
          /* non-critical */
        }

        void fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginBottom: '32px', background: '#080808' }}>
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '320px',
            overflowY: 'auto',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: '#080808',
          }}
        >
          {loading && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: mono,
                fontSize: '12px',
                color: '#555550',
              }}
            >
              Loading...
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: mono,
                fontSize: '12px',
                color: '#555550',
              }}
            >
              No messages yet.
            </div>
          )}

          {!loading &&
            groupedMessages.map((section) => (
              <div key={section.dateKey}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: '10px',
                      color: '#555550',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatDateSeparator(section.dateKey)}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {section.messages.map((msg) => {
                    const outbound = isOutbound(msg);
                    const timestamp = getMessageTimestamp(msg);

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: outbound ? 'flex-end' : 'flex-start',
                          gap: '4px',
                          width: '100%',
                        }}
                      >
                        {!outbound && msg.from_email && (
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: '10px',
                              color: '#888880',
                              paddingLeft: '4px',
                            }}
                          >
                            {msg.from_email}
                          </span>
                        )}

                        <div
                          style={{
                            maxWidth: '75%',
                            padding: '10px 14px',
                            fontFamily: mono,
                            fontSize: '13px',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            display: 'inline-block',
                            ...(outbound
                              ? {
                                  background: '#1a1a1a',
                                  color: '#f0f0ec',
                                  border: '1px solid #2a2a2a',
                                  borderRadius: '18px 18px 4px 18px',
                                  alignSelf: 'flex-end',
                                }
                              : {
                                  background: '#111111',
                                  color: '#c8c8c2',
                                  border: '1px solid #3a3a3a',
                                  borderRadius: '18px 18px 18px 4px',
                                  alignSelf: 'flex-start',
                                }),
                          }}
                        >
                          {msg.body}
                        </div>

                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: '10px',
                            color: '#555550',
                            textAlign: outbound ? 'right' : 'left',
                            width: '75%',
                            paddingLeft: outbound ? 0 : '4px',
                            paddingRight: outbound ? '4px' : 0,
                          }}
                        >
                          {formatMessageTime(timestamp)}
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
            padding: '16px',
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: '12px',
              color: '#888880',
              marginBottom: '12px',
            }}
          >
            To: {hasEmail ? toEmail : 'No email on file'}
          </div>

          {showSubject && (
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!hasEmail || sending}
              style={{
                ...inputStyle,
                marginBottom: '10px',
                opacity: hasEmail ? 1 : 0.5,
              }}
            />
          )}

          <textarea
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            disabled={!hasEmail || sending}
            style={{
              ...inputStyle,
              resize: 'vertical',
              marginBottom: '12px',
              minHeight: '72px',
              opacity: hasEmail ? 1 : 0.5,
            }}
          />

          <button
            onClick={handleSend}
            disabled={sending || !canSend}
            style={{
              fontFamily: mono,
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '10px 24px',
              background: '#f0f0ec',
              color: '#080808',
              border: 'none',
              borderRadius: '4px',
              cursor: sending || !canSend ? 'not-allowed' : 'pointer',
              opacity: !canSend ? 0.5 : 1,
            }}
          >
            {sending ? 'SENDING...' : 'SEND MESSAGE →'}
          </button>
        </div>
      </div>
    </div>
  );
}
