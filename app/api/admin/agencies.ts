import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getAuthedAgency, isAuthFailure } from '../_auth';
import { isAdminUser } from '../../src/lib/admin';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** Admin-only: list all agencies for the trial-management panel. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await getAuthedAgency(req);
  if (isAuthFailure(auth)) {
    return res.status(auth.status).json({ error: auth.error });
  }
  if (!isAdminUser(auth.email)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabaseAdmin
    .from('agencies')
    .select('id, name, owner_email, plan, plan_status, trial_ends_at, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/agencies] query failed:', error.message);
    return res.status(500).json({ error: 'Query failed' });
  }

  return res.status(200).json({ agencies: data ?? [] });
}
