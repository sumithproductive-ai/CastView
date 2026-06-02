import React, { useEffect, useState } from 'react';
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
}

interface Props {
  prospectId: string;
  prospectName: string;
  prospectEmail?: string;
}

export function MessageThread({ prospectId, prospectName, prospectEmail }: Props) {
  const { agencyId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [toEmail, setToEmail] = useState(prospectEmail ?? '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!prospectId || !agencyId) return;
    supabase
      .from('messages')
      .select('*')
      .eq('prospect_id', prospectId)
      .eq('agency_id', agencyId)
      .order('sent_at', { ascending: true })
      .then(({ data }) => setMessages(data ?? []));
  }, [prospectId, agencyId]);

  const handleSend = async () => {
    if (!toEmail || !subject || !body || !agencyId) return;
    setSending(true);
    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId,
          agencyId,
          toEmail,
          toName: prospectName,
          subject,
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
        } catch { /* non-critical */ }
        setBody('');
        setSubject('');
        setTimeout(() => setSent(false), 3000);
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('prospect_id', prospectId)
          .eq('agency_id', agencyId)
          .order('sent_at', { ascending: true });
        setMessages(data ?? []);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#a0a09a',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: 0,
        }}
      >
        {expanded ? '▼' : '▶'} Messages
        {messages.length > 0 && ` (${messages.length})`}
      </button>

      {expanded && (
        <div>
          {messages.length > 0 && (
            <div style={{
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    background: msg.direction === 'outbound' ? '#1a1a1a' : '#111111',
                    border: '1px solid #2a2a2a',
                    borderLeft: msg.direction === 'inbound'
                      ? '2px solid #C8A96E' : '1px solid #2a2a2a',
                    borderRadius: '4px',
                    padding: '16px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: '#888880',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}>
                      {msg.direction === 'outbound'
                        ? `TO: ${msg.to_email}`
                        : `FROM: ${msg.from_email}`}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: '#888880',
                    }}>
                      {new Date(msg.sent_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: '#C8C8C2',
                    marginBottom: '6px',
                    letterSpacing: '0.03em',
                  }}>
                    {msg.subject}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#F0F0EC',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.body}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            padding: '20px',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#888880',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              New Message
            </div>

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

            <textarea
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
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
              }}
            />

            {sent && (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#4a7a4a',
                letterSpacing: '0.08em',
                padding: '10px 0',
                textTransform: 'uppercase',
              }}>
                ✓ Message sent successfully
              </div>
            )}
            {!sent && (
              <button
                onClick={handleSend}
                disabled={sending || !toEmail || !subject || !body}
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
                  cursor: (sending || !toEmail || !subject || !body) ? 'not-allowed' : 'pointer',
                  opacity: (!toEmail || !subject || !body) ? 0.5 : 1,
                  transition: 'background 0.2s',
                }}
              >
                {sending ? 'SENDING...' : 'SEND MESSAGE →'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
