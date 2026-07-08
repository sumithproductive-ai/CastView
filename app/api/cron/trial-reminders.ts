import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY);

type TrialAgency = {
  id: string;
  name: string | null;
  owner_email: string | null;
  trial_ends_at: string;
  trial_reminder_3d_sent_at: string | null;
  trial_reminder_1d_sent_at: string | null;
  trial_ended_email_sent_at: string | null;
};

function emailShell(agencyName: string, headline: string, body: string, ctaLabel: string): string {
  return `<!DOCTYPE html>
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
              ${agencyName}
            </p>
            <p style="margin:0 0 24px;font-family:'Georgia',serif;font-size:22px;font-weight:400;color:#080808;line-height:1.3;">
              ${headline}
            </p>
            <div style="border-top:1px solid #eeede9;padding-top:24px;">
              <p style="margin:0 0 28px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#333330;line-height:1.7;">${body}</p>
              <a href="https://app.castview.org/settings" style="display:inline-block;background:#080808;color:#f8f7f4;text-decoration:none;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.05em;text-transform:uppercase;padding:14px 22px;border-radius:4px;">${ctaLabel}</a>
            </div>
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
</html>`;
}

async function sendReminder(agency: TrialAgency, kind: '3d' | '1d' | 'ended'): Promise<void> {
  if (!agency.owner_email) return;
  const name = agency.name?.trim() || 'there';

  const content =
    kind === '3d'
      ? {
          subject: 'Your CastView trial ends in 3 days',
          headline: '3 days left on your trial',
          body: `Hi ${name}, your CastView trial wraps up in 3 days. Pick a plan now and your agency's roster, evaluations, and prospect history carry over with zero interruption.`,
          cta: 'Choose a plan',
        }
      : kind === '1d'
        ? {
            subject: 'Your CastView trial ends tomorrow',
            headline: '1 day left on your trial',
            body: `Hi ${name}, your CastView trial ends tomorrow. Upgrade now to keep access to your roster, evaluations, and prospect history without a gap.`,
            cta: 'Choose a plan',
          }
        : {
            subject: 'Your CastView trial has ended',
            headline: 'Your trial has ended',
            body: `Hi ${name}, your CastView trial has ended. Your data is safe and waiting — pick a plan any time to pick up right where you left off.`,
            cta: 'Reactivate my account',
          };

  await resend.emails.send({
    from: `CastView <${process.env.RESEND_FROM_EMAIL}>`,
    to: [agency.owner_email],
    subject: content.subject,
    html: emailShell(agency.name ?? 'Your Agency', content.headline, content.body, content.cta),
  });
}

/** Vercel Cron target — see vercel.json "crons". Runs once daily. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: agencies, error } = await supabaseAdmin
    .from('agencies')
    .select(
      'id, name, owner_email, trial_ends_at, trial_reminder_3d_sent_at, trial_reminder_1d_sent_at, trial_ended_email_sent_at',
    )
    .eq('plan_status', 'trialing')
    .not('trial_ends_at', 'is', null);

  if (error) {
    console.error('[cron/trial-reminders] agencies query failed:', error.message);
    return res.status(500).json({ error: 'Query failed' });
  }

  const now = Date.now();
  let sent3d = 0;
  let sent1d = 0;
  let sentEnded = 0;
  let failed = 0;

  for (const agency of (agencies ?? []) as TrialAgency[]) {
    const daysRemaining = (new Date(agency.trial_ends_at).getTime() - now) / 86_400_000;

    try {
      if (daysRemaining <= 0 && !agency.trial_ended_email_sent_at) {
        await sendReminder(agency, 'ended');
        await supabaseAdmin
          .from('agencies')
          .update({
            trial_ended_email_sent_at: new Date().toISOString(),
            trial_reminder_3d_sent_at: agency.trial_reminder_3d_sent_at ?? new Date().toISOString(),
            trial_reminder_1d_sent_at: agency.trial_reminder_1d_sent_at ?? new Date().toISOString(),
          })
          .eq('id', agency.id);
        sentEnded += 1;
      } else if (daysRemaining <= 1 && !agency.trial_reminder_1d_sent_at) {
        await sendReminder(agency, '1d');
        await supabaseAdmin
          .from('agencies')
          .update({
            trial_reminder_1d_sent_at: new Date().toISOString(),
            trial_reminder_3d_sent_at: agency.trial_reminder_3d_sent_at ?? new Date().toISOString(),
          })
          .eq('id', agency.id);
        sent1d += 1;
      } else if (daysRemaining <= 3 && !agency.trial_reminder_3d_sent_at) {
        await sendReminder(agency, '3d');
        await supabaseAdmin
          .from('agencies')
          .update({ trial_reminder_3d_sent_at: new Date().toISOString() })
          .eq('id', agency.id);
        sent3d += 1;
      }
    } catch (err) {
      failed += 1;
      console.error('[cron/trial-reminders] send failed for agency', agency.id, err);
    }
  }

  return res.status(200).json({ checked: agencies?.length ?? 0, sent3d, sent1d, sentEnded, failed });
}
