import type { VercelRequest, VercelResponse } from '@vercel/node';
// import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function parseEmailAddress(raw: string | undefined): string {
  if (!raw) return '';
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
}

function stripHtml(html: string | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractProspectIdFromAddresses(addresses: string[]): string | null {
  for (const address of addresses) {
    const match = address.match(/reply\+([0-9a-f-]{36})@/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function resolveEntityAgency(
  entityId: string,
): Promise<{ agencyId: string } | null> {
  const { data: prospect } = await supabaseAdmin
    .from('prospects')
    .select('agency_id')
    .eq('id', entityId)
    .maybeSingle();

  if (prospect?.agency_id) {
    return { agencyId: prospect.agency_id };
  }

  const { data: model } = await supabaseAdmin
    .from('models')
    .select('agency_id')
    .eq('id', entityId)
    .maybeSingle();

  if (model?.agency_id) {
    return { agencyId: model.agency_id };
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({ ok: true, skipped: 'inbound email not yet active' });
}

/*
 * Full inbound-email handler — restore when MX records are configured and Resend SDK
 * supports resend.webhooks.verify() and resend.emails.receiving.get().
 *
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured for inbound email' });
  }

  try {
    let event = req.body as {
      type?: string;
      data?: {
        email_id?: string;
        from?: string;
        to?: string[];
        subject?: string;
        created_at?: string;
        message_id?: string;
      };
    };

    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const svixId = req.headers['svix-id'];
      const svixTimestamp = req.headers['svix-timestamp'];
      const svixSignature = req.headers['svix-signature'];
      if (
        typeof svixId === 'string' &&
        typeof svixTimestamp === 'string' &&
        typeof svixSignature === 'string'
      ) {
        const payload =
          typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
        event = resend.webhooks.verify({
          payload,
          headers: {
            id: svixId,
            timestamp: svixTimestamp,
            signature: svixSignature,
          },
          webhookSecret,
        }) as typeof event;
      }
    }

    if (event.type !== 'email.received' || !event.data?.email_id) {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const entityId = extractProspectIdFromAddresses(event.data.to ?? []);
    if (!entityId) {
      return res.status(200).json({ ok: true, skipped: 'no reply address' });
    }

    const entity = await resolveEntityAgency(entityId);
    if (!entity) {
      return res.status(200).json({ ok: true, skipped: 'entity not found' });
    }

    const { data: emailContent, error: contentError } =
      await resend.emails.receiving.get(event.data.email_id);

    if (contentError || !emailContent) {
      console.error('[inbound-email] receiving.get failed:', contentError);
      return res.status(500).json({ error: 'Failed to fetch email body' });
    }

    const body =
      emailContent.text?.trim() ||
      stripHtml(emailContent.html) ||
      '(empty message)';

    const fromEmail = parseEmailAddress(event.data.from);
    const subject = event.data.subject?.trim() || '(no subject)';

    const { data: lastOutbound } = await supabaseAdmin
      .from('messages')
      .select('thread_id')
      .eq('prospect_id', entityId)
      .eq('agency_id', entity.agencyId)
      .eq('direction', 'outbound')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const threadId = lastOutbound?.thread_id ?? event.data.email_id;
    const sentAt = event.data.created_at ?? new Date().toISOString();

    const { error: insertError } = await supabaseAdmin.from('messages').insert({
      prospect_id: entityId,
      agency_id: entity.agencyId,
      direction: 'inbound',
      subject,
      body,
      from_email: fromEmail,
      to_email: (event.data.to ?? [])[0] ?? '',
      sent_at: sentAt,
      thread_id: threadId,
      resend_message_id: event.data.email_id,
      in_reply_to: event.data.message_id ?? null,
    });

    if (insertError) {
      console.error('[inbound-email] insert failed:', insertError);
      return res.status(500).json({ error: 'Failed to store inbound message' });
    }

    await supabaseAdmin.from('events').insert({
      agency_id: entity.agencyId,
      event_type: 'message_received',
      metadata: { prospectId: entityId, fromEmail, subject },
    });

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[inbound-email] unexpected error:', message);
    return res.status(500).json({ error: message });
  }
}
*/
