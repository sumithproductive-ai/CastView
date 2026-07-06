import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { checkRateLimit, clientIp } from './_rateLimit';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY);

const WAITLIST_IP_HOURLY_MAX = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://castview.org');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Honeypot — a real visitor never sees or fills this field. Bots that
  // auto-fill every input in a form will. Report success without doing
  // anything so the bot doesn't learn to look for a different field.
  const honeypot = typeof req.body?.website === 'string' ? req.body.website.trim() : '';
  if (honeypot) {
    return res.status(200).json({ success: true });
  }

  const ip = clientIp(req);
  const rateLimit = await checkRateLimit(`waitlist:${ip}`, 3600, WAITLIST_IP_HOURLY_MAX);
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
  }

  const { name, agencyName, email, agencySize } = req.body ?? {};
  if (!name || !email || !agencyName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const { error } = await supabase.from('waitlist').insert({
      name,
      agency_name: agencyName,
      email: normalizedEmail,
      agency_size: agencySize ?? '',
      source: 'landing_page',
    });

    const isDuplicate = Boolean(error && error.code === '23505');
    if (error && !isDuplicate) throw error;

    // Only email on a fresh signup — resending on every duplicate submission
    // turns this endpoint into a way to blast arbitrary inboxes on repeat.
    if (!isDuplicate) {
      await resend.emails.send({
        from: `CastView <${process.env.RESEND_FROM_EMAIL}>`,
        to: ['sumithproductive@gmail.com'],
        subject: `New waitlist signup: ${agencyName}`,
        html: `<p style="font-family:monospace;">${name} from ${agencyName} (${agencySize}) signed up.<br>Email: ${normalizedEmail}</p>`,
      });

      await resend.emails.send({
        from: `CastView <${process.env.RESEND_FROM_EMAIL}>`,
        to: [normalizedEmail],
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
    }

    return res.status(200).json({ success: true, duplicate: isDuplicate });
  } catch (err: any) {
    console.error('[waitlist] error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
