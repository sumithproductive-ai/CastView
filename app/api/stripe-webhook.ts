import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const config = { api: { bodyParser: false } };

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function setPlan(agencyId: string, plan: string, status: string, subId?: string, custId?: string) {
  await supabase.from('agencies').update({
    plan,
    plan_status: status,
    ...(subId && { stripe_subscription_id: subId }),
    ...(custId && { stripe_customer_id: custId }),
  }).eq('id', agencyId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        const agencyId = s.metadata?.agencyId;
        const tier = s.metadata?.tier ?? 'solo';
        if (agencyId) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          await setPlan(agencyId, tier, 'active', sub.id, s.customer as string);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const agencyId = sub.metadata?.agencyId;
        const tier = sub.metadata?.tier ?? 'solo';
        if (agencyId) {
          const status = (sub.status === 'active' || sub.status === 'trialing') ? 'active' : 'inactive';
          await setPlan(agencyId, tier, status, sub.id);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const agencyId = sub.metadata?.agencyId;
        if (agencyId) await setPlan(agencyId, 'trial', 'inactive');
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        const sub = await stripe.subscriptions.retrieve(inv.subscription as string);
        const agencyId = sub.metadata?.agencyId;
        if (agencyId) await setPlan(agencyId, 'trial', 'past_due');
        break;
      }
    }
  } catch (err) {
    console.error('[Stripe webhook] handler error:', err);
  }
  return res.status(200).json({ received: true });
}
