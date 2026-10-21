# HabiTUM Frontend

React 19 single-page app for HabiTUM, built with Vite and Material UI. See the [project README](../README.md) for an overview and the Docker quick start, and [`Backend/ARCHITECTURE.md`](../Backend/ARCHITECTURE.md) for the API it talks to.

## Running locally

```bash
cd Frontend
npm ci
npm run dev        # http://localhost:3000
```

The dev server proxies every `/api/*` request to the backend (default `http://localhost:4000`, override with `VITE_API_PROXY_TARGET`), so the backend needs to be running as well.

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |

## Structure

```
src/
├── App.jsx          — routing: public pages, auth pages, the logged-in app and the manager area
├── auth/            — auth context, login/signup/password-reset hooks, authenticated fetch helper
├── pages/public/    — landing page, login/signup, checkout result pages, legal pages, invite links
├── pages/app/       — Today view, communities, community dashboard, progress analytics, profile, manager dashboard
├── challenges/      — challenge list, challenge page and leaderboard
├── feed/            — community activity feed (cursor polling)
├── billing/         — Stripe upgrade/downgrade buttons and billing hooks
├── components/      — shared UI (layout, cards, dialogs, navigation)
├── context/, hooks/ — habits context and data-fetching hooks
└── styles/          — MUI theme and design tokens
```

Progress analytics (streaks, completion rates, momentum) are computed client-side in `src/pages/app/Progress/analytics.js`, which mirrors the backend's period logic and is covered by `analytics.test.js`.
