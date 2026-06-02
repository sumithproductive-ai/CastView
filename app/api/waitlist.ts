import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, agencyName, email, agencySize } = req.body;
  if (!name || !email || !agencyName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { error } = await supabase.from('waitlist').insert({
      name,
      agency_name: agencyName,
      email,
      agency_size: agencySize ?? '',
      source: 'landing_page',
    });

    if (error && error.code !== '23505') throw error;

    // Notify you
    await resend.emails.send({
      from: `CastView <${process.env.RESEND_FROM_EMAIL}>`,
      to: ['sumithproductive@gmail.com'],
      subject: `New waitlist signup: ${agencyName}`,
      html: `<p style="font-family:monospace;">${name} from ${agencyName} (${agencySize}) signed up.<br>Email: ${email}</p>`,
    });

    // Confirm to them
    await resend.emails.send({
      from: `CastView <${process.env.RESEND_FROM_EMAIL}>`,
      to: [email],
      subject: 'You\'re on the CastView waitlist',
      html: `
        <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff;">
          <div style="font-size:10px;letter-spacing:0.1em;color:#C8A96E;text-transform:uppercase;margin-bottom:24px;">CastView</div>
          <p style="font-size:18px;color:#080808;margin-bottom:16px;">Thanks, ${name}.</p>
          <p style="font-size:13px;color:#333;line-height:1.7;margin-bottom:24px;">
            We've added ${agencyName} to our early access list. 
            We'll be in touch shortly with next steps.
          </p>
          <p style="font-size:11px;color:#888;">— Sumith, Founder of CastView</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[waitlist] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
