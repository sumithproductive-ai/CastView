import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  const { tier, agencyId, email } = req.body;
  const priceId = PRICE_MAP[tier];

  if (!priceId || !agencyId || !email) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
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
  } catch (err: any) {
    console.error('[Stripe] checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
