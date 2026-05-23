# CastView

AI evaluation platform for modeling agencies.

## Local development

```bash
npm install
npm run dev
```

## Deploy on Vercel

The app lives in **`CastView v2.0 (8)`**. In Vercel → Project → Settings → General, set:

- **Root Directory:** `CastView v2.0 (8)`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

`CastView v2.0 (8)/vercel.json` includes SPA rewrites so client-side routes serve `index.html`.

To use the repository root instead, move the app files up and set Root Directory to `.` (empty).
