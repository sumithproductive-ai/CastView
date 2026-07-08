import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getAuthedAgency, isAuthFailure } from '../_auth';
import { isAdminUser } from '../../src/lib/admin';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** Admin-only: set/extend an existing agency's trial end date. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await getAuthedAgency(req);
  if (isAuthFailure(auth)) {
    return res.status(auth.status).json({ error: auth.error });
  }
  if (!isAdminUser(auth.email)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { agencyId, trialEndsAt } = req.body ?? {};

  if (!agencyId || typeof agencyId !== 'string') {
    return res.status(400).json({ error: 'Missing agencyId' });
  }

  const parsedDate = new Date(trialEndsAt);
  if (!trialEndsAt || Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: 'Invalid trialEndsAt' });
  }

  const { error } = await supabaseAdmin
    .from('agencies')
    .update({
      trial_ends_at: parsedDate.toISOString(),
      plan_status: 'trialing',
      // Reset reminder flags so the cron re-sends at the right thresholds
      // for the new trial window instead of assuming it already notified.
      trial_reminder_3d_sent_at: null,
      trial_reminder_1d_sent_at: null,
      trial_ended_email_sent_at: null,
    })
    .eq('id', agencyId);

  if (error) {
    console.error('[admin/extend-trial] update failed:', error.message);
    return res.status(500).json({ error: 'Update failed' });
  }

  return res.status(200).json({ success: true });
}
