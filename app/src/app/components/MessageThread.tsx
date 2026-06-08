import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authFetch } from '../../lib/apiAuth';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  thread_id?: string | null;
  direction?: 'outbound' | 'inbound' | null;
  subject: string;
  body: string;
  to_email: string;
  from_email: string;
  sent_at: string | null;
  created_at?: string | null;
  sent_by_agency?: boolean | null;
}

interface Props {
  prospectId: string;
  prospectName: string;
  prospectEmail?: string;
}

interface ThreadGroup {
  threadId: string;
  messages: Message[];
  startedAt: string;
  subject: string;
  lastPreview: string;
}

const mono = 'var(--font-mono)';

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

function isOutbound(msg: Message): boolean {
  if (msg.direction === 'inbound') return false;
  if (msg.direction === 'outbound' || msg.sent_by_agency === true) return true;
  return true;
}

function getMessageTimestamp(msg: Message): string {
  return msg.sent_at ?? msg.created_at ?? new Date().toISOString();
}

function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}...`;
}

function formatThreadDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatMessageTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} · ${timePart}`;
}

function groupIntoThreads(messages: Message[]): ThreadGroup[] {
  const threadMap = new Map<string, Message[]>();

  for (const msg of messages) {
    const threadId = msg.thread_id?.trim() || msg.id;
    const existing = threadMap.get(threadId);
    if (existing) {
      existing.push(msg);
    } else {
      threadMap.set(threadId, [msg]);
    }
  }

  return Array.from(threadMap.entries())
    .map(([threadId, threadMessages]) => {
      const sorted = [...threadMessages].sort(
        (a, b) =>
          new Date(getMessageTimestamp(a)).getTime() -
          new Date(getMessageTimestamp(b)).getTime(),
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const startedAt = getMessageTimestamp(first);

      return {
        threadId,
        messages: sorted,
        startedAt,
        subject: first.subject?.trim() || 'Message',
        lastPreview: truncate(last.body, 60),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
}

function ThreadMessages({
  messages,
  isOpen,
}: {
  messages: Message[];
  isOpen: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  return (
    <div
      style={{
        maxHeight: '280px',
        overflowY: 'auto',
        padding: '12px 0 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {messages.map((msg) => {
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
                alignSelf: outbound ? 'flex-end' : 'flex-start',
                ...(outbound
                  ? {
                      background: '#1a1a1a',
                      color: '#f0f0ec',
                      border: '1px solid #2a2a2a',
                      borderRadius: '18px 18px 4px 18px',
                    }
                  : {
                      background: '#111111',
                      color: '#c8c8c2',
                      border: '1px solid #3a3a3a',
                      borderRadius: '18px 18px 18px 4px',
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
                maxWidth: '75%',
                paddingLeft: outbound ? 0 : '4px',
                paddingRight: outbound ? '4px' : 0,
              }}
            >
              {formatMessageTimestamp(timestamp)}
            </span>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

export function MessageThread({ prospectId, prospectName, prospectEmail }: Props) {
  const { agencyId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [openThreadIds, setOpenThreadIds] = useState<Set<string>>(new Set());
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({});
  const [sendingThreadId, setSendingThreadId] = useState<string | null>(null);
  const [sendingNew, setSendingNew] = useState(false);
  const [newConvoButtonHover, setNewConvoButtonHover] = useState(false);
  const [toEmail, setToEmail] = useState(prospectEmail ?? '');
  const initializedOpenRef = useRef(false);

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

  const threads = useMemo(() => groupIntoThreads(messages), [messages]);

  useEffect(() => {
    if (loading || threads.length === 0) return;
    if (initializedOpenRef.current) return;
    initializedOpenRef.current = true;
    setOpenThreadIds(new Set([threads[0].threadId]));
  }, [loading, threads]);

  const trimmedToEmail = toEmail.trim();
  const hasEmail = Boolean(trimmedToEmail);

  const toggleThread = (threadId: string) => {
    setOpenThreadIds((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  const sendMessage = async ({
    body,
    subject,
    threadId,
    onSuccess,
    setSending,
  }: {
    body: string;
    subject: string;
    threadId?: string;
    onSuccess: (optimistic: Message) => void;
    setSending: (value: boolean) => void;
  }) => {
    const messageBody = body.trim();
    const recipientEmail = toEmail.trim();
    if (!recipientEmail || !subject.trim() || !messageBody || !agencyId) return;

    setSending(true);
    try {
      const res = await authFetch('/api/send-message', {
        method: 'POST',
        body: JSON.stringify({
          prospectId,
          toEmail: recipientEmail,
          toName: prospectName,
          subject: subject.trim(),
          body: messageBody,
          agencyName: 'CastView Agency',
          thread_id: threadId,
        }),
      });

      if (res.ok) {
        const sentAt = new Date().toISOString();
        const optimisticMessage: Message = {
          id: crypto.randomUUID(),
          thread_id: threadId,
          direction: 'outbound',
          subject: subject.trim(),
          body: messageBody,
          to_email: recipientEmail,
          from_email: '',
          sent_at: sentAt,
        };

        onSuccess(optimisticMessage);

        try {
          await supabase.from('events').insert({
            agency_id: agencyId,
            event_type: 'message_sent',
            metadata: { prospectId, toEmail: recipientEmail, threadId },
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

  const handleReply = async (thread: ThreadGroup) => {
    const replyBody = replyBodies[thread.threadId] ?? '';
    await sendMessage({
      body: replyBody,
      subject: thread.subject,
      threadId: thread.threadId,
      setSending: (value) =>
        setSendingThreadId(value ? thread.threadId : null),
      onSuccess: (optimistic) => {
        setMessages((prev) => [...prev, optimistic]);
        setReplyBodies((prev) => ({ ...prev, [thread.threadId]: '' }));
        setOpenThreadIds((prev) => new Set(prev).add(thread.threadId));
      },
    });
  };

  const handleNewConversation = async () => {
    const threadId = crypto.randomUUID();
    await sendMessage({
      body: newBody,
      subject: newSubject,
      threadId,
      setSending: setSendingNew,
      onSuccess: (optimistic) => {
        setMessages((prev) => [...prev, optimistic]);
        setNewSubject('');
        setNewBody('');
        setShowNewConversation(false);
        initializedOpenRef.current = true;
        setOpenThreadIds(new Set([threadId]));
      },
    });
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
            padding: '16px',
            borderBottom: '1px solid #2a2a2a',
            background: '#080808',
          }}
        >
          <label
            htmlFor={`message-to-${prospectId}`}
            style={{
              display: 'block',
              fontFamily: mono,
              fontSize: '10px',
              color: '#888880',
              marginBottom: '6px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            To
          </label>
          <input
            id={`message-to-${prospectId}`}
            type="email"
            placeholder="name@example.com"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div
          style={{
            maxHeight: '500px',
            overflowY: 'auto',
            background: '#080808',
          }}
        >
          {loading && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                fontFamily: mono,
                fontSize: '12px',
                color: '#555550',
              }}
            >
              Loading...
            </div>
          )}

          {!loading && messages.length === 0 && !showNewConversation && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                fontFamily: mono,
                fontSize: '12px',
                color: '#555550',
              }}
            >
              No messages yet.
            </div>
          )}

          {!loading &&
            threads.map((thread) => {
              const isOpen = openThreadIds.has(thread.threadId);
              const replyBody = replyBodies[thread.threadId] ?? '';
              const isSendingReply = sendingThreadId === thread.threadId;

              return (
                <div
                  key={thread.threadId}
                  style={{ borderBottom: '1px solid #2a2a2a' }}
                >
                  <button
                    type="button"
                    onClick={() => toggleThread(thread.threadId)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '14px 16px',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginBottom: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: '13px',
                              color: '#f0f0ec',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {thread.subject}
                          </span>
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: '11px',
                              color: '#555550',
                              flexShrink: 0,
                            }}
                          >
                            {formatThreadDate(thread.startedAt)}
                          </span>
                        </div>
                        <p
                          style={{
                            fontFamily: mono,
                            fontSize: '11px',
                            color: '#888880',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {thread.lastPreview}
                        </p>
                      </div>
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: '11px',
                          color: '#888880',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {isOpen ? '▼' : '▶'}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <ThreadMessages messages={thread.messages} isOpen={isOpen} />

                      <div style={{ marginTop: '12px' }}>
                        <textarea
                          placeholder="Reply..."
                          value={replyBody}
                          onChange={(e) =>
                            setReplyBodies((prev) => ({
                              ...prev,
                              [thread.threadId]: e.target.value,
                            }))
                          }
                          rows={2}
                          disabled={isSendingReply}
                          style={{
                            ...inputStyle,
                            resize: 'vertical',
                            marginBottom: '10px',
                            minHeight: '56px',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => void handleReply(thread)}
                          disabled={
                            isSendingReply || !hasEmail || !replyBody.trim()
                          }
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
                            cursor:
                              isSendingReply || !hasEmail || !replyBody.trim()
                                ? 'not-allowed'
                                : 'pointer',
                            opacity:
                              !hasEmail || !replyBody.trim() ? 0.5 : 1,
                          }}
                        >
                          {isSendingReply ? 'SENDING...' : 'SEND REPLY →'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #2a2a2a' }}>
          {!showNewConversation && (
            <button
              type="button"
              onMouseEnter={() => setNewConvoButtonHover(true)}
              onMouseLeave={() => setNewConvoButtonHover(false)}
              onClick={() => setShowNewConversation(true)}
              style={{
                width: '100%',
                fontFamily: mono,
                fontSize: '11px',
                color: newConvoButtonHover ? '#f0f0ec' : '#888880',
                background: 'transparent',
                border: `1px solid ${newConvoButtonHover ? '#f0f0ec' : '#2a2a2a'}`,
                borderRadius: '4px',
                padding: '10px',
                cursor: 'pointer',
              }}
            >
              + NEW CONVERSATION
            </button>
          )}

          {showNewConversation && (
            <div>
              <input
                type="text"
                placeholder="Subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                disabled={sendingNew}
                style={{
                  ...inputStyle,
                  marginBottom: '10px',
                }}
              />

              <textarea
                placeholder="Write your message..."
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={3}
                disabled={sendingNew}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  marginBottom: '12px',
                  minHeight: '72px',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => void handleNewConversation()}
                  disabled={
                    sendingNew ||
                    !hasEmail ||
                    !newBody.trim() ||
                    !newSubject.trim()
                  }
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
                    cursor:
                      sendingNew ||
                      !hasEmail ||
                      !newBody.trim() ||
                      !newSubject.trim()
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      !hasEmail || !newBody.trim() || !newSubject.trim()
                        ? 0.5
                        : 1,
                  }}
                >
                  {sendingNew ? 'SENDING...' : 'SEND MESSAGE →'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowNewConversation(false);
                    setNewSubject('');
                    setNewBody('');
                  }}
                  style={{
                    fontFamily: mono,
                    fontSize: '11px',
                    color: '#888880',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
