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

## Auth

Enable Email/Password and Google in the Firebase console. Add `localhost` under Authorized domains.

## Tests

```bash
npx vitest run
```

Offline set logging is queued in localStorage and flushed when back online (best-effort; the API does not take idempotency keys).
