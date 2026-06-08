import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { ENTITLEMENT_ERROR, getAuthedAgency, isAuthFailure, isEntitled } from './_auth';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function entityBelongsToAgency(
  entityId: string,
  agencyId: string,
): Promise<boolean> {
  const { data: prospect } = await supabaseAdmin
    .from('prospects')
    .select('id')
    .eq('id', entityId)
    .eq('agency_id', agencyId)
    .maybeSingle();

  if (prospect) return true;

  const { data: model } = await supabaseAdmin
    .from('models')
    .select('id')
    .eq('id', entityId)
    .eq('agency_id', agencyId)
    .maybeSingle();

  return Boolean(model);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await getAuthedAgency(req);
  if (isAuthFailure(auth)) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (!isEntitled(auth)) {
    return res.status(402).json({ error: ENTITLEMENT_ERROR });
  }

  const { agencyId } = auth;
  const { prospectId, toEmail, toName, subject, body, agencyName, thread_id } = req.body;

  if (!prospectId || !toEmail || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const allowed = await entityBelongsToAgency(prospectId, agencyId);
  if (!allowed) {
    return res.status(403).json({ error: 'Prospect not found for this agency' });
  }

  try {
    const { error } = await resend.emails.send({
      from: `${agencyName ?? 'CastView'} <${process.env.RESEND_FROM_EMAIL}>`,
      to: [toEmail],
      subject,
      replyTo: `reply+${prospectId}@castview.org`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:4px;overflow:hidden;">
        <tr>
          <td style="background:#080808;padding:24px 32px;">
            <span style="font-family:'Courier New',monospace;font-size:11px;color:#C8A96E;letter-spacing:0.15em;text-transform:uppercase;">CastView</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px 32px;">
            <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:10px;color:#888880;letter-spacing:0.1em;text-transform:uppercase;">
              Message from ${agencyName ?? 'Your Agency'}
            </p>
            <p style="margin:0 0 32px;font-family:'Georgia',serif;font-size:22px;font-weight:400;color:#080808;line-height:1.3;">
              ${subject}
            </p>
            <div style="border-top:1px solid #eeede9;padding-top:24px;">
              <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#333330;line-height:1.7;white-space:pre-wrap;">${body}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 40px;">
            <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;color:#aaa;letter-spacing:0.05em;border-top:1px solid #eeede9;padding-top:24px;">
              Reply directly to this email — your response will appear in CastView.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f3ef;padding:16px 32px;">
            <p style="margin:0;font-family:'Courier New',monospace;font-size:9px;color:#aaa;">Sent via CastView · castview.org</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    if (error) {
      console.error('[send-message] Resend error:', error);
      return res.status(500).json({ error: 'Email send failed' });
    }

    const { error: dbError } = await supabaseAdmin.from('messages').insert({
      prospect_id: prospectId,
      agency_id: agencyId,
      direction: 'outbound',
      subject,
      body,
      from_email: process.env.RESEND_FROM_EMAIL ?? 'team@castview.org',
      to_email: toEmail,
      sent_at: new Date().toISOString(),
      ...(thread_id ? { thread_id } : {}),
    });

    if (dbError) {
      console.error('[send-message] Supabase insert error:', JSON.stringify(dbError));
    } else {
      console.log('[send-message] Message saved to Supabase successfully');
    }

    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send-message] unexpected error:', message);
    return res.status(500).json({ error: message });
  }
}
