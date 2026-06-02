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
      html: `
        <div style="font-family: monospace; max-width: 600px; margin: 0 auto; 
             padding: 40px 24px; background: #ffffff; color: #080808;">
          <div style="font-size: 10px; letter-spacing: 0.1em; color: #888880; 
               text-transform: uppercase; margin-bottom: 32px;">
            Message from ${agencyName ?? 'Your Agency'} via CastView
          </div>
          <div style="font-size: 14px; line-height: 1.7; color: #080808; 
               white-space: pre-wrap;">${body}</div>
          <div style="margin-top: 48px; padding-top: 24px; 
               border-top: 1px solid #e0e0e0; font-size: 10px; 
               color: #888880; letter-spacing: 0.05em;">
            Reply directly to this email to respond. 
            Your reply will appear in CastView.
          </div>
        </div>
      `,
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
