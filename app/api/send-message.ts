import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prospectId, agencyId, toEmail, toName, subject, body, agencyName } = req.body;

  if (!prospectId || !agencyId || !toEmail || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await resend.emails.send({
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
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #eeede9;padding-top:24px;">
                  <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;color:#aaa;letter-spacing:0.05em;">
                    Reply directly to this email — your response will appear in CastView.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <tr>
          <td style="background:#f4f3ef;padding:16px 32px;">
            <p style="margin:0;font-family:'Courier New',monospace;font-size:9px;color:#aaa;letter-spacing:0.05em;">
              Sent via CastView · castview.org
            </p>
          </td>
        </tr>
        
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    if (error) throw error;

    await supabase.from('messages').insert({
      prospect_id: prospectId,
      agency_id: agencyId,
      direction: 'outbound',
      subject,
      body,
      from_email: process.env.RESEND_FROM_EMAIL,
      to_email: toEmail,
      resend_id: data?.id ?? null,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[send-message] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
