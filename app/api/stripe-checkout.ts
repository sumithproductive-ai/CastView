import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthedAgency, isAuthFailure } from './_auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

const PRICE_MAP: Record<string, string | undefined> = {
  solo: process.env.STRIPE_SOLO_PRICE_ID,
  studio: process.env.STRIPE_STUDIO_PRICE_ID,
  agency: process.env.STRIPE_AGENCY_PRICE_ID,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await getAuthedAgency(req);
  if (auth === null) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (isAuthFailure(auth)) {
    return res.status(403).json({ error: 'No agency associated with this account' });
  }

  const { agencyId, email } = auth;
  const { tier } = req.body;
  const priceId = PRICE_MAP[tier];

  if (!priceId || !tier) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Verified user has no email' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `https://app.castview.org/settings?upgraded=true`,
      cancel_url: `https://app.castview.org/settings?cancelled=true`,
      metadata: { agencyId, tier },
      subscription_data: {
        metadata: { agencyId, tier },
        trial_period_days: 14,
      },
    });
    return res.status(200).json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe] checkout error:', message);
    return res.status(500).json({ error: message });
  }
}
