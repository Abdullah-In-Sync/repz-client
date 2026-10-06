# Repz client

Nuxt 4 PWA for workout logging. Talks to the Repz FastAPI backend with Firebase Auth.

## Setup

```bash
cp .env.example .env
```

Fill Firebase values (see `firebase.temp` locally — do not commit it). Keep the backend running on `http://localhost:8000`.

Requires **Node 22+** (Nuxt 4). Then:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Exercise GIFs (Vercel CDN)

For production without Firebase/R2 billing, put GIFs in **`public/exercise-gifs/`** named by catalog id, e.g. `0025.gif` (same as Repz `external_id`). The app loads `/exercise-gifs/{external_id}.gif` when the API has no `gif_url`. Copy files from `exercises-dataset/videos/` (match the id prefix). Commit only the exercises you use, then push to `main` for Vercel to serve them.

## Auth

Enable Email/Password and Google in the Firebase console. Add `localhost` under Authorized domains. For the deployed site, also add the Vercel hostname.

## Deploy

Vercel hosts this app. The API, Neon Postgres, and Upstash Redis are covered in the server repo’s `DEPLOY.md`.

1. Push `main`.
2. Import `repz-client` on Vercel. Framework Nuxt, production branch `main`, Node 22.
3. Set `NUXT_PUBLIC_API_BASE` to the Render API origin (`https://repz-api.onrender.com`, no trailing slash) and the `NUXT_PUBLIC_FIREBASE_*` values from `.env.example`.
4. Add the Vercel domain under Firebase Authentication → Authorized domains.

Those public env vars are read at build time. Redeploy after changing them.

## Tests

```bash
npx vitest run
```

Offline set logging is queued in localStorage and flushed when back online (best-effort; the API does not take idempotency keys).
