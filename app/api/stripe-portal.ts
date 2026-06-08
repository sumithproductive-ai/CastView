import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getAuthedAgency, isAuthFailure } from './_auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await getAuthedAgency(req);
  if (isAuthFailure(auth)) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('stripe_customer_id')
    .eq('id', auth.agencyId)
    .single();

  if (agencyError) {
    console.error('[Stripe] portal agency lookup failed:', agencyError.message);
    return res.status(500).json({ error: 'Could not load billing account' });
  }

  const stripeCustomerId = agency?.stripe_customer_id;
  if (!stripeCustomerId) {
    return res.status(400).json({
      error: 'No active billing account — start a subscription first.',
    });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: 'https://app.castview.org/settings',
    });
    return res.status(200).json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe] portal error:', message);
    return res.status(500).json({ error: message });
  }
}
