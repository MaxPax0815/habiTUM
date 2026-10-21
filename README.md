# HabiTUM

HabiTUM is a social habit tracker. You build good habits or break bad ones, check in daily or weekly and keep your streaks alive. You can also do this together with others in communities and time-boxed challenges with leaderboards.

The app was built as a course project for **SEBA Master (Software Engineering for Business Applications) at TUM, 2026, Team 26**.

<p align="center">
  <img src="Frontend/src/assets/mockup_dashboard.png" alt="HabiTUM Today view with daily habits, progress bar and streak" width="640">
</p>

## Features

**For everyone (Free)**
- Unlimited personal habits, each one either *build* or *break*, on a daily or weekly schedule
- One-tap check-ins with undo, plus streak and best-streak tracking
- Join communities (public, private or by invite link) and their challenges
- Challenge leaderboards and a community activity feed

**Premium**
- Progress analytics dashboard with streak-recovery stats and heatmaps
- Create your own communities and challenges

**Manager accounts** (for organisations such as universities)
- Branded public communities with an admin role system and community posts
- Manager dashboard with community stats and daily check-in adherence per challenge
- Subscription-based plan: a base fee with one community, plus paid extra community slots

Payments run through **Stripe** (test mode) via Checkout, the Customer Portal and webhooks.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router 7, MUI 9, Recharts, date-fns |
| Backend | Node.js (≥ 20), Express 5, Mongoose 9 |
| Database | MongoDB (Atlas) |
| Auth | JWT (`jsonwebtoken`) and `bcrypt` password hashing |
| Payments | Stripe Checkout, Billing Portal, webhooks |
| Tests | Node's built-in test runner with `mongodb-memory-server` (backend), Vitest (frontend) |
| Dev ops | Docker and Docker Compose, plus the Stripe CLI for local webhooks |

## Repository structure

```
habiTUM/
├── Backend/                       Express + MongoDB REST API
│   ├── server.js                  Entry point: middleware, routers, DB connection, streak job
│   ├── config.js                  Configuration (secrets come from the environment)
│   ├── auth/                      Signup, login, JWT middleware, password reset
│   ├── habit/                     Habits, check-ins, streak calculation, period helpers
│   ├── checkins/                  Append-only check-in log
│   ├── communities/               Communities, memberships, roles, invites
│   ├── communityPosts/            Posts inside a community
│   ├── challenges/                Challenges, participation, leaderboards
│   ├── activities/                Community activity feed (cursor polling)
│   ├── manager/                   Manager dashboard endpoints
│   ├── billing/                   Stripe checkout, portal and webhook handling
│   ├── institutions/              Universities and organisations directory
│   ├── scripts/                   Seed scripts for demo data
│   ├── tests/                     Backend tests
│   ├── docker_to_project_root/    Root docker-compose.yml (see "Run with Docker")
│   └── context.md                 Detailed architecture notes for the backend
└── Frontend/                      React single-page app (Vite)
    └── src/
        ├── pages/public/          Landing page, auth, checkout, invite and legal pages
        ├── pages/app/             Today, Communities, Progress, Profile, manager dashboards
        ├── challenges/            Challenge pages, forms and leaderboard
        ├── feed/                  Activity feed components
        ├── auth/ billing/ hooks/  Contexts and data hooks
        └── components/ layouts/ styles/
```

## Getting started

### Prerequisites

- **Node.js 20+** and npm 10+
- A **MongoDB** database. A MongoDB Atlas cluster works, and so does a local `mongod`.
- A **Stripe** account in test mode, plus the [Stripe CLI](https://docs.stripe.com/stripe-cli) if you want to test payments locally

### 1. Configure the backend

```bash
cp Backend/.env.example Backend/.env
```

Then fill in `Backend/.env`:

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string, including the database name |
| `JWT_SECRET` | yes | Long random string, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `STRIPE_SECRET_KEY` | yes | Stripe test secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | yes | Webhook signing secret printed by `stripe listen` (`whsec_...`) |
| `PORT` | no | API port, default `4000` |
| `CLIENT_URL` | no | Frontend URL used for Stripe redirects, default `http://localhost:3000` |
| `STRIPE_*_PRICE_ID` | no | Stripe price IDs. Committed defaults exist in `config.js`. |
| `DIRECT_PASSWORD_RESET` | no | Demo-only password reset without e-mail. It is on by default outside production; see [Security notes](#security-notes). |

The server refuses to start if one of the required secrets is missing. `.env` is gitignored, so never commit real credentials.

### 2. Run the backend

```bash
cd Backend
npm ci
npm run dev        # http://localhost:4000 (nodemon)
```

### 3. Run the frontend

In a second terminal:

```bash
cd Frontend
npm ci
npm run dev        # http://localhost:3000
```

The Vite dev server proxies every `/api` request to `http://localhost:4000`. To point it at a different backend, set `VITE_API_PROXY_TARGET`.

### 4. (Optional) Forward Stripe webhooks

Subscriptions only update in the app when Stripe webhooks reach the backend:

```bash
stripe listen --forward-to http://localhost:4000/api/billing/webhook
```

Copy the printed `whsec_...` secret into `STRIPE_WEBHOOK_SECRET`. To test a checkout, use Stripe's test card `4242 4242 4242 4242`.

## Demo data

```bash
cd Backend
npm run seed:prod    # ⚠️ wipes and reseeds ALL collections
npm run dev:fresh    # seed, then start the dev server
node scripts/seedPremiumUserData.js   # only adds a realistic month of data to premium@test.com
```

> **Note:** As a safety guard, the seed script only runs against a database named `PROD_4`. To seed a database with any other name, set `ALLOW_NON_PROD4_SEED=true`.

After seeding, all demo accounts use the password **`Test1234`**:

| Account | Type |
|---|---|
| `manager@test.com` (and `manager02`–`manager05@test.com`) | Manager |
| `premium@test.com` | Premium user |
| `free@test.com` | Free user |
| `streakleader@`, `consistent@`, `rookie@`, `comeback@`, `hydration@test.com` | Mixed accounts that populate the leaderboards |

## Run with Docker

The root Compose file lives in `Backend/docker_to_project_root/`. Copy it to the project root first:

```bash
cp Backend/docker_to_project_root/docker-compose.yml .
docker compose up --build
```

This starts three containers:
- **backend** on `http://localhost:4000`
- **frontend** on `http://localhost:3000`
- **stripe-cli**, which forwards webhooks to the backend automatically

Secrets are read from `Backend/.env`.

> **Heads-up:** The backend container starts with `npm run dev:fresh`, which **reseeds the whole database on every start**. Only point it at a disposable development database.

## Tests

```bash
cd Backend && npm test     # node:test; feed tests run against an in-memory MongoDB
cd Frontend && npm test    # Vitest
cd Frontend && npm run lint
```

On the first run, `mongodb-memory-server` downloads a MongoDB binary, so you need internet access for that.

## Architecture notes

- **Request flow:** React → Vite proxy → Express router → `requireAuth` (JWT) → controller → Mongoose → MongoDB.
- **Personal vs. challenge habits:** A `Habit` is either `personal`, owned by one user, or `challenge`, a single definition shared by all participants. Streak and completion state is **never** stored on the habit. Instead, each user has their own `Checkin` and `HabitProgress` documents.
- **Periods:** Check-ins are keyed by a `periodKey` such as `daily:2026-05-10` or `weekly:2026-05-04` (Monday-anchored). A unique index on `{ user, habit, periodKey }` makes double check-ins impossible. The same logic is mirrored in `Frontend/src/pages/app/Progress/analytics.js`.
- **Streak job:** `resetStreaks()` runs once on boot and then every 24 hours. It resets streaks for users who missed a period.
- **Permissions** are checked server-side on three axes:
  1. Authentication (JWT)
  2. Tier and account type (`free` / `premium`, `user` / `manager`)
  3. Ownership or membership (habit owner, joined challenge, community admin or creator)

  Gating in the frontend only affects the UX.
- **Activity feed:** Only challenge check-ins create feed items. The frontend reads them with cursor-based polling (`/api/communities/:id/feed` and `/feed/updates`). An undo revokes the item instead of deleting it, so toggling can't spam the feed.

For the full API table, data-model diagram and conventions, see [`Backend/context.md`](Backend/context.md).

## API overview

All endpoints live under `/api` and, except signup, login, password reset and the Stripe webhook, need an `Authorization: Bearer <token>` header.

| Prefix | Purpose |
|---|---|
| `/api/user` | Signup, login, current user, password reset |
| `/api/habits` | Habit CRUD, `POST /:id/checkin`, `POST /:id/undo` |
| `/api/communities` | Communities, joining and invites, members and roles, posts, activity feed |
| `/api/challenges` | Challenges, challenge habits, join and leave, leaderboard, trending |
| `/api/manager` | Manager dashboards: overview, community stats, adherence |
| `/api/billing` | Stripe checkout, billing portal, cancellation, billing info, webhook |

## Security notes

- `DIRECT_PASSWORD_RESET` returns the reset token directly to the browser. That is fine for a demo but **not safe for production**, because anyone who knows an e-mail address could take over that account. In production (`NODE_ENV=production`) it is off by default.
- CORS is currently open (`cors()` with no restriction). Restrict it to the frontend domain before deploying.

## Team

Built by Team 26 for the SEBA Master course at the Technical University of Munich (TUM), 2026.
