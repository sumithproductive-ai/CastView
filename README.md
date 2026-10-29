# CastView

AI-assisted B2B SaaS workspace for modeling agencies — replaces scattered notes, spreadsheets, and email with one organized system for prospect and model intake, evaluation, and client communication.

## What it does

- **AI-assisted evaluation** — Claude-powered multimodal vision evaluation scores talent photos/digitals directly against agency-defined casting contexts.
- **Automated brief-matching** — matches prospects and roster talent against open client briefs instead of manual cross-referencing.
- **Subscription billing** — Stripe-powered checkout, customer portal, and full webhook lifecycle (Solo/Studio/Boutique Team tiers).
- **Secure multi-tenant data layer** — Postgres via Supabase, with Row-Level Security policies enforcing per-agency data isolation.
- **Operational workflows** — automated email (inbound + outbound via Resend) and scheduled jobs for trial reminders.

Originally purpose-built for one live modeling agency's real intake and evaluation workflow; now being taken to market as a multi-tenant product for additional agencies.

## Local development

```bash
cd app
npm install
cp .env.example .env.local
# Add your key to .env.local as ANTHROPIC_API_KEY=
npm run dev
```

## Deploy on Vercel

Set **Root Directory** to `app`.

| Setting | Value |
|---------|--------|
| Root Directory | `app` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Required environment variable

In **Vercel → Project → Settings → Environment Variables**, add:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Enable it for **Production** (and Preview if needed), then **Redeploy**.

A `500` from `/api/evaluate` almost always means this variable is missing or the deployment was not redeployed after adding it. Check function logs for `hasAnthropicApiKey: false`.

Do **not** use `VITE_ANTHROPIC_API_KEY` — that exposes the key to the browser. The server reads `ANTHROPIC_API_KEY` only.
