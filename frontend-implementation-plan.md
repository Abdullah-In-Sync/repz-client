# Frontend Implementation Plan — Gym Tracker (Hevy-style)

## 1. Overview

A **Nuxt 3 (LTS)** application, installable as a **PWA** on mobile and usable
as a full responsive website on desktop, delivering an Awwwards-tier,
3D-interactive, dark-themed gym UI with a black/charcoal base and yellow
accent system.

---

## 2. Tech Stack & Libraries

| Concern | Library |
|---|---|
| Framework | `nuxt` (latest LTS, Vue 3, Nitro) |
| Language | TypeScript |
| Styling | `Tailwind CSS` (via `@nuxtjs/tailwindcss`) + CSS variables for theming |
| State management | `Pinia` (`@pinia/nuxt`) |
| Auth | `firebase` JS SDK (client), `vuefire` or custom composable wrapping Firebase Auth |
| Data fetching | Nuxt's built-in `$fetch`/`useFetch`, with a typed API client layer |
| Forms/validation | `vee-validate` + `zod` |
| Charts | `ApexCharts` (`vue3-apexcharts`) or `Chart.js` (`vue-chartjs`) — for volume/weight/muscle-distribution graphs |
| Calendar view | `v-calendar` (Vue) or custom grid component with a heatmap style (GitHub-contributions look) |
| 3D / interactive visuals | `three.js` + `@tresjs/core` (Vue-native three.js wrapper) for hero/landing 3D elements; `GSAP` for scroll/microinteractions |
| Animations | `GSAP` + Vue `<Transition>`/`<TransitionGroup>`, `@vueuse/motion` for simple declarative motion |
| Icons | `lucide-vue-next` (clean modern icon set fits gym/fitness UI) |
| PWA | `@vite-pwa/nuxt` (service worker, offline caching, installable manifest) |
| Fonts | Modern variable font — e.g. **Inter** or **General Sans** for UI text, **Clash Display** / **Cabinet Grotesk** for headings (bold, gym-poster feel) via `@nuxt/fonts` or self-hosted |
| Gesture/touch | `@vueuse/gesture` or native pointer events for swipeable set logging cards |
| Composables/utilities | `VueUse` (`@vueuse/core`) — extensively, for storage, media queries, intersection observer, etc. |
| Testing | `Vitest`, `@vue/test-utils`, `Playwright` (e2e) |
| Linting/formatting | `ESLint` (`@nuxt/eslint`), `Prettier` |

---

## 3. Design System

### 3.1 Theme
- **Dark theme as default and primary** (matches gym/premium-app aesthetic — Hevy, Strong, Whoop all lean dark).
- **Palette**:
  - Background: near-black `#0B0B0D` / `#121214` (layered surfaces at `#1A1A1D`, `#232326`)
  - Primary accent: **yellow** `#F5C518`–`#FFD93D` range (used for CTAs, active states, PR highlights, charts' primary series)
  - Secondary accent: muted electric blue or lime-green for secondary data series (contrast to yellow without clashing)
  - Text: off-white `#F2F2F0` primary, `#9B9BA1` secondary/muted
  - Success/PR: green glow; Warning/RPE-high: red-orange
- **Typography**: bold, condensed/grotesk display font for numbers and headings (workout stats should feel "loud" like a fitness poster); clean geometric sans for body text. Strong numeric emphasis (tabular figures) for weights/reps so columns align.
- **Depth & tactility**: soft shadows, subtle gradients (charcoal → black), glassmorphism cards for overlays, 3D tilt/parallax on key cards (routine cards, PR cards) using `@tresjs` or CSS `transform-style: preserve-3d` + pointer tracking.
- **Micro-interactions**: set-completion checkmarks with a satisfying "pop" (GSAP), rest-timer with animated circular progress, confetti/glow burst on new PR (achievement moment).

### 3.2 Layout system
- Mobile-first (this is primarily a gym-floor, one-handed-use app), then
  enhanced responsively for tablet/desktop with a dashboard-style multi-column
  layout on larger screens.
- Bottom tab navigation on mobile (Home/Dashboard, Routines, Log/+, History, Profile) — thumb-friendly.
- Sidebar navigation on desktop/tablet ≥1024px.

---

## 4. Key Screens & Components

### 4.1 Dashboard (Home)
- Hero stats row: streak, this-week volume, workouts this month.
- Body weight graph (line chart, range toggle 7d/30d/90d/1y).
- Volume graph (bar/line combo, per week).
- Muscle group distribution (radar or donut chart) — from `reports/muscle-distribution`.
- Calendar heatmap (month view, tappable to jump to a day's workout).
- Recent PRs / achievements strip (horizontally scrollable cards with 3D tilt).

### 4.2 Exercise Library
- Search + filter bar (body part, target, equipment) sourced from `/exercises/filters`.
- Virtualized list/grid (use `vue-virtual-scroller` for 1300+ items performance).
- Exercise detail sheet: gif (autoplay/loop), instructions, target/secondary muscles, "add to routine" CTA.

### 4.3 Routines
- Routine builder: drag-and-drop exercise ordering (`vuedraggable`/`@vueuse/core` sortable), set target sets/rep-range/rest per exercise.
- Routine card grid with 3D hover-tilt effect, quick-start button.

### 4.4 Active Workout / Logging (core screen)
- Per-exercise card: **pre-filled with last logged weight/reps/RPE** (fetched via `routines/{id}/last-logged`), editable inline.
- Dynamic fields: weight+reps+RPE for strength; duration+distance for cardio (treadmill, elliptical, bike, etc.) driven by `is_time_based`/`is_distance_based` flags from the exercise object.
- Big touch-friendly numeric steppers (+/- buttons) alongside direct keyboard input.
- Rest timer (auto-starts after a set is marked complete), with push/vibration notification when using PWA on mobile.
- Swipe-to-complete / swipe-to-delete set rows.
- Running session summary bar (elapsed time, total volume so far).

### 4.5 History / Reports
- Tabs: Daily / Weekly / Monthly.
- Session detail view (all sets, PRs hit that day, duration, notes).
- Calendar view with completed-day markers.

### 4.6 Body Weight & Measurements
- Log entry form + graph.

### 4.7 Profile / Settings
- Unit toggle (kg/lb), theme (dark default, optional light), Firebase account management, data export.

---

## 5. PWA Requirements

- `@vite-pwa/nuxt` configured with:
  - Web app manifest (name, icons at all required sizes, `theme_color` black, `background_color` black, `display: standalone`).
  - Service worker with runtime caching: cache-first for exercise gifs/images, network-first (with cache fallback) for API data so a partially-offline gym floor with weak signal still shows last-known routine/last-logged data.
  - Install prompt (custom "Add to Home Screen" banner, since PWAs don't show native prompts uniformly).
  - Background sync (where supported) to queue logged sets offline and push when back online — pairs with the backend's idempotent set-logging endpoint.
- iOS-specific PWA meta tags (`apple-touch-icon`, `apple-mobile-web-app-capable`) since iOS PWA support has quirks.
- Responsive images (`srcset`) and lazy-loading for exercise gifs to keep mobile data usage low.

---

## 6. State Management (Pinia stores)

- `authStore` — Firebase user, ID token refresh.
- `exerciseStore` — cached exercise library, filters.
- `routineStore` — user's routines, active routine being edited.
- `workoutStore` — active/in-progress session state (survives refresh via persisted state, e.g. `pinia-plugin-persistedstate`, critical for a gym-floor app where the phone might sleep).
- `reportStore` — dashboard/report data with caching + stale-while-revalidate pattern.
- `uiStore` — theme, unit preference, modals/toasts.

---

## 7. API Integration Layer

- Typed API client (`~/composables/useApi.ts`) wrapping `$fetch`, auto-attaching Firebase ID token, handling 401 refresh, centralized error toast handling.
- Auto-generate/maintain TypeScript types matching backend Pydantic schemas (either hand-maintained `types/` folder or generated via `openapi-typescript` against the FastAPI OpenAPI schema — recommended for keeping frontend/backend in sync).

---

## 8. 3D / Awwwards-tier Visual Direction

- Landing/onboarding screen: subtle 3D rotating dumbbell/kettlebell or particle field (three.js via `@tresjs`), scroll-triggered reveal animations (GSAP ScrollTrigger).
- Dashboard stat cards: pointer-based 3D tilt (parallax) + light glow following cursor/touch.
- PR/achievement unlock: full-screen celebratory 3D burst or particle animation.
- Keep 3D effects performance-budgeted (lazy-load three.js only on screens that use it; respect `prefers-reduced-motion`).

---

## 9. Project Structure

```
frontend/
├── app.vue
├── nuxt.config.ts
├── assets/
│   ├── css/ (tailwind entry, theme variables)
│   └── fonts/
├── components/
│   ├── dashboard/
│   ├── exercises/
│   ├── routines/
│   ├── workout/
│   ├── charts/
│   ├── calendar/
│   └── ui/ (buttons, cards, sheets — design-system primitives)
├── composables/
│   ├── useApi.ts
│   ├── useAuth.ts
│   └── useUnits.ts
├── layouts/
│   ├── default.vue (desktop sidebar)
│   └── mobile.vue (bottom tab nav) — or a single responsive layout
├── pages/
│   ├── index.vue (dashboard)
│   ├── exercises/
│   ├── routines/
│   ├── workout/[sessionId].vue
│   ├── history/
│   └── settings.vue
├── stores/ (Pinia)
├── plugins/ (firebase.client.ts, pwa.client.ts)
├── public/ (manifest icons)
├── types/
└── tests/
```

---

## 10. Testing & CI/CD

- Unit tests (Vitest) for composables/stores (esp. pre-fill logic, unit conversion, achievement display logic).
- Component tests (`@vue/test-utils`) for the logging card, rest timer.
- E2E (Playwright): log a full workout end-to-end, verify PR detection UI, verify PWA install/offline flow.
- Lighthouse CI in the pipeline (PWA score, performance budget — important given the 3D/animation-heavy design).
- GitHub Actions: lint, typecheck, test, build, deploy (Vercel/Netlify/Cloudflare Pages all support Nuxt SSR/SSG well).

---

## 11. Deployment Suggestions

- **Vercel** or **Cloudflare Pages** for Nuxt (both have first-class Nuxt support, edge caching, easy PWA asset serving).
- CDN for exercise gifs/static assets (can reuse the backend's object storage + CDN, §7 of backend plan).

---

## 12. Information Needed From You

1. Firebase web config (apiKey, authDomain, projectId, etc.) for the client SDK.
2. Any existing brand assets (logo, app name/icon) — otherwise I'll propose a mark as part of the design system.
3. Confirm the 3D-interactive elements should be tasteful/subtle (performance-conscious) rather than heavy, since this is a gym-floor daily-use app — or if you specifically want a more cinematic landing experience.
4. Preferred deployment target (Vercel/Cloudflare/self-hosted) — affects Nuxt build mode (SSR vs SSG/edge).
5. Whether native app wrapping (Capacitor) is a future goal — affects some PWA architecture decisions now.

---

## 13. Suggested Build Order (Frontend)

1. Nuxt scaffold, Tailwind + design tokens, Firebase auth wiring, base layout (mobile bottom nav + desktop sidebar).
2. Exercise library screen (list/filter/detail) hitting backend's exercises API.
3. Routine builder.
4. Active workout logging screen (the core loop) with pre-fill, dynamic fields, rest timer.
5. Dashboard: graphs (body weight, volume, muscle distribution) + calendar heatmap.
6. History/reports screens.
7. PWA setup (manifest, service worker, offline caching, install prompt).
8. 3D/animation polish pass (tilt cards, PR celebration, landing visuals).
9. Testing, Lighthouse tuning, deploy.
