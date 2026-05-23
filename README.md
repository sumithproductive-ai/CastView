# CastView

AI evaluation platform for modeling agencies.

## Local development

```bash
npm install
npm run dev
```

## Deploy on Vercel

The app is a Vite + React SPA at the repository root. Vercel should auto-detect Vite; if not, use:

- **Root Directory:** `.` (repository root)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

`vercel.json` includes SPA rewrites so client-side routes (e.g. `/profile`) serve `index.html`.

After changing the repo layout, clear **Root Directory** in Vercel project settings if it was set to `CastView v2.0 (8)`.
