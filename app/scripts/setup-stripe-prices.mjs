/**
 * Create CastView subscription prices in Stripe (test or live — matches your secret key).
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe-prices.mjs
 *
 * Or add STRIPE_SECRET_KEY to app/.env.local and run:
 *   node scripts/setup-stripe-prices.mjs
 *
 * Does not archive old prices. Copy the printed price IDs into Vercel env vars.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const fileEnv = loadEnvFile(envPath);
const secret = process.env.STRIPE_SECRET_KEY ?? fileEnv.STRIPE_SECRET_KEY;

if (!secret) {
  console.error('Missing STRIPE_SECRET_KEY. Set it in app/.env.local or the environment.');
  process.exit(1);
}

const PLANS = [
  {
    envKey: 'STRIPE_SOLO_PRICE_ID',
    productName: 'CastView Solo',
    tier: 'solo',
    amountCents: 4900,
    description: 'CastView Solo — independent agents',
  },
  {
    envKey: 'STRIPE_STUDIO_PRICE_ID',
    productName: 'CastView Studio',
    tier: 'studio',
    amountCents: 9900,
    description: 'CastView Studio — growing agencies',
  },
  {
    envKey: 'STRIPE_AGENCY_PRICE_ID',
    productName: 'CastView Boutique Team',
    tier: 'agency',
    amountCents: 14900,
    description: 'CastView Boutique Team — established agencies',
  },
];

const Stripe = (await import('stripe')).default;
const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });

const mode = secret.startsWith('sk_live_') ? 'LIVE' : 'TEST';
console.log(`\nCastView Stripe price setup (${mode} mode)\n`);

async function findOrCreateProduct(name, description) {
  const existing = await stripe.products.list({ limit: 100, active: true });
  const match = existing.data.find(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  );
  if (match) {
    console.log(`  Product exists: ${match.name} (${match.id})`);
    return match;
  }
  const created = await stripe.products.create({ name, description });
  console.log(`  Created product: ${created.name} (${created.id})`);
  return created;
}

async function findActivePrice(productId, amountCents) {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });
  return prices.data.find(
    (p) =>
      p.type === 'recurring' &&
      p.recurring?.interval === 'month' &&
      p.unit_amount === amountCents &&
      p.currency === 'usd',
  );
}

const results = {};

for (const plan of PLANS) {
  console.log(`\n${plan.productName} — $${plan.amountCents / 100}/mo`);
  const product = await findOrCreateProduct(plan.productName, plan.description);

  let price = await findActivePrice(product.id, plan.amountCents);
  if (price) {
    console.log(`  Reusing price: ${price.id}`);
  } else {
    price = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: plan.amountCents,
      recurring: { interval: 'month' },
      metadata: { tier: plan.tier },
    });
    console.log(`  Created price: ${price.id}`);
  }

  results[plan.envKey] = price.id;
}

console.log('\n--- Add these to Vercel (then redeploy) ---\n');
for (const [key, id] of Object.entries(results)) {
  console.log(`${key}=${id}`);
}
console.log('\nDone.\n');
