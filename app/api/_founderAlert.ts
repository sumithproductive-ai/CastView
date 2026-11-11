import { Resend } from 'resend';

// Same inbox as ADMIN_EMAIL in src/lib/admin.ts; override with FOUNDER_ALERT_EMAIL.
const FOUNDER_EMAIL = process.env.FOUNDER_ALERT_EMAIL || 'sumithproductive@gmail.com';

/**
 * Plain-text heads-up to the founder (new signups, Gmail connections) so new
 * agencies can be onboarded personally. Never throws — alerts must not break
 * the request that triggered them.
 */
export async function notifyFounder(subject: string, lines: string[]): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `CastView Alerts <${process.env.RESEND_FROM_EMAIL}>`,
      to: [FOUNDER_EMAIL],
      subject,
      text: lines.join('\n'),
    });
  } catch (err) {
    console.error('[founderAlert] send failed:', err);
  }
}
