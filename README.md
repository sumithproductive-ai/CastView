# CastView

AI evaluation platform for modeling agencies.

## Local development

```bash
cd app
npm install
cp .env.example .env.local
# Add your key to .env.local as OPENAI_API_KEY=
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
OPENAI_API_KEY=sk-...
```

Enable it for **Production** (and Preview if needed), then **Redeploy**.

A `500` from `/api/evaluate` almost always means this variable is missing or the deployment was not redeployed after adding it. Check function logs for `hasOpenaiApiKey: false`.

Do **not** use `VITE_OPENAI_API_KEY` — that exposes the key to the browser. The server reads `OPENAI_API_KEY` only.
