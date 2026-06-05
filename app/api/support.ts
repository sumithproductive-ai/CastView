import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { getAuthedAgency, isAuthFailure } from './_auth';

const resend = new Resend(process.env.RESEND_API_KEY);

const SUPPORT_TO = 'hello@castview.org';
const SUPPORT_FROM = 'team@castview.org';

const VALID_CATEGORIES = new Set(['bug', 'feedback', 'other']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await getAuthedAgency(req);
  if (auth === null) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (isAuthFailure(auth)) {
    return res.status(403).json({ error: 'No agency associated with this account' });
  }

  const { subject, message, category } = req.body ?? {};

  if (!VALID_CATEGORIES.has(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message must be 2000 characters or fewer' });
  }

  const subjectLine = typeof subject === 'string' ? subject.trim() : '';
  const displaySubject = subjectLine || '(no subject)';
  const { agencyId, email } = auth;

  const emailBody = `From: ${email} (Agency ID: ${agencyId})
Category: ${category}
Subject: ${displaySubject}

Message:
${message.trim()}

---
Sent from CastView Settings`;

  try {
    const { error } = await resend.emails.send({
      from: `CastView <${process.env.RESEND_FROM_EMAIL ?? SUPPORT_FROM}>`,
      to: [SUPPORT_TO],
      subject: `[CastView Support] ${category}: ${displaySubject}`,
      text: emailBody,
    });

    if (error) {
      console.error('[support] Resend error:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[support] unexpected error:', errMessage);
    return res.status(500).json({ error: errMessage });
  }
}
