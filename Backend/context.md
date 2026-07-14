# HabiTUM Backend — Agent Context

Read this file fully before making changes here. It is the map of the Express/MongoDB API: what exists, how the pieces connect, and the conventions to follow when adding something new. If you change routes, models, or the permission model, update this file in the same change.

See also: [`../CLAUDE.md`](../CLAUDE.md) (whole-project overview) and [`../Frontend/CLAUDE.md`](../Frontend/CLAUDE.md) (the API's only consumer).

## What this is

HabiTUM is a habit-tracking app built for a TUM SEBA course project. Users build personal habits (build good ones / break bad ones), track daily or weekly check-ins, join communities, and compete in time-boxed challenges with leaderboards. Premium subscribers (via Stripe) unlock analytics, community creation, and challenge creation.

Stack: **Node.js + Express 5 + Mongoose 9 (MongoDB Atlas)**. Auth is JWT (`jsonwebtoken`), passwords hashed with `bcrypt`. No TypeScript. `npm test` runs Node's built-in test runner over `tests/`: password-reset controller coverage plus the activity-feed integration tests (the latter against an in-memory MongoDB via the `mongodb-memory-server` devDependency — see `tests/feed.test.js`). This is a course project: `config.js` intentionally commits secrets/URIs instead of using `.env` — see the comment block in that file before "fixing" it.

## Repo shape (important, non-obvious)

- The project root (`HabiTUM_new/`) is **not** a git repo. `Backend/` and `Frontend/` are **each their own separate git repository** (`Backend/.git`, `Frontend/.git`), pushed to separate GitLab repos (see `package.json` → `repository.url`). Commits, branches, and `git log` must be run *inside* `Backend/` or `Frontend/`, never from the root.
- `docker-compose.yml`, `README_Docker.md`, and `.node-version` live at the shared root (see `README_Docker.md` for the "move these out of Backend" note — that migration is already done in this checkout).

## Running it

```bash
cd Backend
npm ci
npm run dev          # nodemon server.js — http://localhost:4000
npm run seed          # scripts/seedDevData.js — wipes and reseeds ALL collections
npm run dev:fresh     # seed then dev
node scripts/seedPremiumUserData.js   # adds a realistic month of habits/checkins to premium@test.com only (non-destructive to other users)
```

Or via Docker from the project root: `docker compose up --build` (backend on `:4000`, see root docs).

Demo accounts after `npm run seed` (password `Test1234` for all): `manager@test.com` (manager, premium), `premium@test.com` (premium), `free@test.com` (free), plus several streak-variety accounts (`streakleader@`, `consistent@`, `rookie@`, `comeback@`, `hydration@`) used to populate a realistic community leaderboard.

## Request lifecycle

```
Browser/React → server.js middleware → <resource>/<resource>Routes.js → requireAuth → controller → Mongoose model → MongoDB
                                                                                              ↓
Browser/React ← JSON response ← controller res.json() ← query result
```

`server.js` is the entry point: loads `config.js`, applies `cors()`, mounts the raw-body Stripe webhook route *before* `express.json()` (Stripe requires the raw payload for signature verification), applies `express.json()` and a request logger, mounts every resource router under `/api/...`, connects to MongoDB, runs `resetStreaks()` once on boot, then starts listening. The community activity feed now uses authenticated cursor polling through the communities router. The older SSE stream route is still mounted for compatibility/tests, but the MongoDB change-stream bridge has been removed so the app does not keep a database watch open for feed updates.

## Directory map

```
Backend/
├── server.js                     — entry point; wires middleware, routers, DB connection, boot-time streak reset
├── config.js                     — PORT, MONGODB_URI, JWT_SECRET, Stripe keys, CLIENT_URL, direct-reset feature flag
├── auth/
│   ├── userModel.js               — User schema + User.signup()/User.login() statics (bcrypt + validator); includes hashed passwordResetToken/passwordResetExpires fields
│   ├── userController.js          — auth endpoints; direct reset token is demo-only and guarded by DIRECT_PASSWORD_RESET; forgot-password is anti-enumeration: unknown emails get the SAME 200 + message as known ones, just without a resetToken
│   ├── user.js                    — router, mounted at /api/user (login/signup/forgot-password/reset-password public, /me behind requireAuth)
│   └── requireAuth.js             — JWT verification middleware; sets req.user = { _id }
├── habit/
│   ├── habitModel.js               — Habit schema (personal OR challenge habit, see "kind" below)
│   ├── habitProgressModel.js       — per-(user, habit) streak/best-streak/total-checkins state
│   ├── habitController.js          — CRUD + checkin/undo; the most complex controller in the app
│   ├── habits.js                   — router, mounted at /api/habits, fully behind requireAuth
│   ├── periodUtils.js              — pure date-math: period keys, consecutive-period checks, elapsed periods
│   └── streakJob.js                — resetStreaks(): zeroes out currentStreak when a user misses >1 period; run at boot (cron scheduling code is commented out, see file)
├── checkins/
│   └── checkinModel.js             — one document per (user, habit, period) — the append-only check-in log
├── challenges/
│   ├── challengeModel.js           — Challenge schema, belongs to a Community
│   ├── challengeParticipationModel.js — join table: user ↔ challenge, with status joined/completed/left
│   ├── challengeController.js      — create/delete challenge, GET leaderboard (aggregates HabitProgress across participants)
│   ├── challenge.js                — router, mounted at /api/challenges, behind requireAuth
│   └── requireChallengeCreatorAccess.js — gates create/delete: must be premium/manager AND a community admin/creator
├── communities/
│   ├── communityModel.js           — Community schema; virtual `challenges`/`challengeCount` populate from Challenge
│   ├── communityMembershipModel.js — join table: user ↔ community, role (member/admin/creator) + membershipStatus
│   ├── communityController.js      — list/get/create/join/leave/delete + get community's challenges
│   ├── communities.js              — router, mounted at /api/communities, behind requireAuth
│   └── requireCommunityCreatorAcsess.js — gates create/delete: must be premium or manager (NOTE: filename has a typo, "Acsess" — do not silently rename without updating the require() in communities.js)
├── activities/                     — the community activity feed
│   ├── activityModel.js            — Activity schema: denormalized feed items (challenge-habit checkins only), single community ref resolved at write time; indexed { community, _id } for cursor pagination + reconnect catch-up
│   ├── activityService.js          — recordCheckinActivity (guards kind==='challenge', snapshots actor/habit/streak into meta, milestones are a celebratory message VARIANT rendered by the frontend at streak %7 === 0, not separate feed items) + removeCheckinActivity (undo); called fire-and-forget from habitController. SPAM GUARD: undo revokes (soft-deletes) instead of deleting, a same-period re-checkin restores the original doc — with the unique (user, habit, type, periodKey) index the feed can never hold more than one post per user/habit/period, however fast someone toggles checkin/undo.
│   ├── feedBus.js                  — legacy in-process EventEmitter pub/sub between the checkin write path and open SSE connections
│   ├── ticketStore.js              — legacy 30s single-use stream tickets for the SSE endpoint
│   ├── feedController.js           — createTicket, getFeed (cursor-paginated REST), getFeedUpdates (cursor polling, includes revoked rows so clients can remove undone items), streamFeed (legacy SSE handshake/replay)
│   └── feed.js                     — legacy router, mounted at /api/feed (ticket only); active feed reads go through /api/communities/:id/feed and /feed/updates
├── institutions/
│   └── institutionModel.js         — university/org directory (name, emailDomain, logoUrl). Not yet wired to any controller/route — exists for future institution-scoped communities.
├── billing/
│   ├── stripeController.js         — create checkout session, create billing-portal session, schedule cancellation, get billing info
│   ├── stripeWebhookController.js  — Stripe webhook handler; syncs subscription status → User document
│   └── stripeRoutes.js             — router, mounted at /api/billing (all routes behind requireAuth except the webhook, which is mounted separately in server.js)
├── scripts/
│   ├── seedDevData.js              — full destructive reseed: users, communities, challenges, challenge habits, progress, and feed activities generated from the recent seeded challenge checkins
│   └── seedPremiumUserData.js      — additive/idempotent-per-user: rebuilds only premium@test.com's personal habits with a realistic month of data
└── tests/
    └── feed.test.js                — node:test integration tests (in-memory MongoDB): challenge checkin → activity in the right community feed, personal checkin → none, undo removal, membership/ticket auth, SSE stream delivery + reconnect catch-up
```

Naming convention: each resource folder holds `<name>Model.js`, `<name>Controller.js`, and a router file. The router file for `habit` and `communities`/`challenges` is *not* suffixed `Routes.js` (it's `habits.js`, `communities.js`, `challenge.js`) except billing (`stripeRoutes.js`) — check the existing file before assuming a name.

## Data model relationships

```
User ──< HabitProgress >── Habit ──< Checkin
User ──< CommunityMembership >── Community ──< Challenge ──< ChallengeParticipation >── User
                                     Community ──(institution, optional)── Institution
Community ──< Activity ──(challenge, habit, checkin refs + denormalized meta snapshot)
  Activity exists only for challenge-habit checkins; personal checkins never produce one.
Habit.kind === 'personal' → Habit.user set,      Habit.challenge null
Habit.kind === 'challenge' → Habit.challenge set, Habit.user null (shared habit definition; per-user state lives in HabitProgress/Checkin)
```

Key design decision: **streak/completion state is never stored on `Habit` itself.** A challenge habit is a single shared document (e.g. "20 Minute Walk" on the movement challenge), but each participant has their own `Checkin` rows and their own `HabitProgress` row for that same `habit._id`. This is why almost every query in `habitController.js` and `challengeController.js` is scoped by `{ habit: habitId, user: userId }` — forgetting the `user` filter is the most likely bug when touching this code.

`periodKey` (from `periodUtils.js`) is the shared vocabulary across `Checkin`, `HabitProgress`, and the frontend's `analytics.js`: format `"daily:YYYY-MM-DD"` or `"weekly:YYYY-MM-DD"` (Monday-anchored). It's how "already checked in this period" and "is the streak still alive" are computed without re-deriving from raw dates every time. If you add a new period type (e.g. monthly), it must be added consistently in `periodUtils.js`, `Checkin`'s unique index, and the frontend's mirrored `buildPeriodKey()` in `Frontend/src/pages/app/Progress/analytics.js`.

`Checkin` has a unique index on `{ user, habit, periodKey }` — this is what makes "check in twice in the same period" a no-op at the DB layer (`habitController.checkinHabit` also checks explicitly before insert, then falls back to catching the duplicate-key error, code `11000`).

## Permission model

Three independent axes, all enforced **server-side** (frontend gating is UX-only, never trust it):

1. **Authentication** (`requireAuth`): every route except `/api/user/login`, `/api/user/signup`, and the Stripe webhook requires a valid `Authorization: Bearer <jwt>` header.
2. **Subscription tier** (`User.subscription`: `free` | `premium`) and **account type** (`User.accountType`: `user` | `manager`). Managers are created directly in the DB, never through signup. `hasChallengeAccountAccess` / the inline check in `requireCommunityCreatorAcsess.js` both use the same rule: `accountType === 'manager' || subscription === 'premium'` gates community/challenge *creation*. Regular free users can join communities/challenges and track personal habits without limit.
3. **Ownership / membership**: personal habits require `habit.user === req.user._id`; challenge habit actions require an `accepted`/`joined` `ChallengeParticipation`; community/challenge *management* (create/delete) additionally requires being the community's `createdBy` or a membership with `role` in `admin`/`creator` (see `hasCommunityManagementAccess` in `requireChallengeCreatorAccess.js`).

When adding a new mutating route, decide which of these three axes apply and reuse the existing middleware (`requireAuth`, `requireChallengeCreatorAccess`/`requireChallengeDeleteAccess`, `requireCommunityCreatorAccess`) rather than re-implementing the checks inline.

## API surface

All routes are prefixed as mounted in `server.js`. `🔒` = behind `requireAuth`. Response bodies are typically the raw Mongoose document (or `{ error }` on failure); a few return `{ message, habit }` (checkin/undo) or `{ error, emptyFields }` (validation failures).

| Method | Path | Extra guard | Handler |
|---|---|---|---|
| POST | `/api/user/signup` | — | `userController.signupUser` |
| POST | `/api/user/login` | — | `userController.loginUser` |
| GET  | `/api/user/me` 🔒 | — | `userController.getMe` |
| POST | `/api/user/forgot-password` | `DIRECT_PASSWORD_RESET` | `userController.forgotPassword` — demo-only; returns a one-time token for known emails, 404 for unknown emails |
| POST | `/api/user/reset-password/:token` | — | `userController.resetPassword` — validates token hash + expiry, hashes new password, clears token fields |
| GET  | `/api/habits` 🔒 | — | `habitController.getHabits` (personal only) |
| GET  | `/api/habits/:id` 🔒 | owner or joined-challenge | `getHabit` |
| POST | `/api/habits` 🔒 | — | `createHabit` (always creates a *personal* habit) |
| PATCH | `/api/habits/:id` 🔒 | owner | `updateHabit` |
| DELETE | `/api/habits/:id` 🔒 | owner | `deleteHabit` (cascades Checkin + HabitProgress) |
| POST | `/api/habits/:id/checkin` 🔒 | owner or joined-challenge | `checkinHabit` |
| POST | `/api/habits/:id/undo` 🔒 | owner or joined-challenge | `undoCheckin` (removes latest Checkin, recomputes HabitProgress from scratch) |
| GET  | `/api/challenges/:id/leaderboard` 🔒 | — | `getChallengeLeaderboard` |
| POST | `/api/challenges` 🔒 | `requireChallengeCreatorAccess` | `createChallenge` |
| DELETE | `/api/challenges/:id` 🔒 | `requireChallengeDeleteAccess` | `deleteChallenge` (cascades participations + challenge habits + their checkins/progress) |
| GET | `/api/communities/:id/feed` 🔒 | accepted membership | `feedController.getFeed` — cursor-paginated activity feed (`?before=<activityId>&limit=&challenge=<id>`; the challenge param scopes it to one challenge for the ChallengePage mini-feed; revoked items are always excluded) |
| GET | `/api/communities/:id/feed/updates` 🔒 | accepted membership | `feedController.getFeedUpdates` — lightweight polling endpoint (`?since=<feedCursor>&challenge=<id>`); includes revoked rows so clients can remove undone items |
| GET | `/api/communities/:id/feed/stream` | **stream ticket**, not `requireAuth` | `feedController.streamFeed` — legacy SSE feed; still mounted directly in `server.js` for compatibility/tests |
| POST | `/api/feed/ticket` 🔒 | — | `feedController.createTicket` — legacy SSE ticket exchange |
| GET | `/api/communities` 🔒 | — | `getCommunities` (annotated with this user's membership) |
| GET | `/api/communities/:id` 🔒 | — | `getCommunity` |
| GET | `/api/communities/:id/challenges` 🔒 | — | `getCommunityChallenges` |
| POST | `/api/communities` 🔒 | `requireCommunityCreatorAccess` | `createCommunity` (creator auto-joined as `role: creator`) |
| POST | `/api/communities/:id/join` 🔒 | — | `joinCommunity` (idempotent upsert; private communities → `pending`) |
| DELETE | `/api/communities/:id/leave` 🔒 | — | `leaveCommunity` |
| DELETE | `/api/communities/:id` 🔒 | `requireCommunityCreatorAccess` + ownership check in controller | `deleteCommunity` |
| POST | `/api/billing/create-checkout-session` 🔒 | — | `stripeController.createCheckoutSession` |
| POST | `/api/billing/create-portal-session` 🔒 | — | `createPortalSession` |
| POST | `/api/billing/schedule-cancellation` 🔒 | — | `scheduleSubscriptionCancellation` |
| POST | `/api/billing/info` 🔒 | — | `getBillingInfo` |
| POST | `/api/billing/webhook` | Stripe signature, **not** `requireAuth` | `stripeWebhookController.stripeWebhookHandler` — mounted directly in `server.js` with `express.raw()`, before the JSON body parser |

There are no routes yet for challenge *habits* management (adding/removing habits from a challenge) or for approving pending private-community join requests — both membership/participation models already have the fields (`membershipStatus: 'pending'`, participation status) to support this later.

## Conventions to follow when adding a feature

- **New resource** = new folder under `Backend/` with `<name>Model.js` + `<name>Controller.js` + a router file, mounted in `server.js` under `/api/<name>`. Add `router.use(requireAuth)` at the top unless the resource has public routes (mirror `auth/user.js`'s pattern of `router.get('/me', requireAuth, getMe)` for mixed public/private).
- **Validation**: controllers hand-roll required-field checks and return `{ error, emptyFields }` on 400 (see `habitController.createHabit`) — no schema-validation library is used beyond what Mongoose enums/`required` give you. Match this pattern rather than introducing a new one (e.g. Joi/Zod) unless asked.
- **Ownership checks**: always filter Mongoose queries by the owning field (`{ _id: id, user: req.user._id }`) rather than fetching by id alone and checking afterward — this is both the existing style and avoids leaking a 200 with someone else's data before the check runs.
- **Cascading deletes**: when a parent document is deleted, explicitly clean up dependents with `Promise.all([...deleteMany...])` (see `deleteHabit`, `deleteChallenge`, `deleteCommunity`) — there is no Mongoose middleware or DB-level cascade.
- **Dates/periods**: never compare raw `Date` fields across days without going through `periodUtils.js`'s helpers. If frontend logic needs the same computation, mirror it in `Frontend/src/pages/app/Progress/analytics.js` rather than duplicating ad hoc.
- **Config**: add new secrets/URLs to `config.js` with a `process.env.X || '<dev fallback>'` pattern (see `STRIPE_*` keys) so Docker Compose can override them without breaking non-Docker local dev.
- **Direct password reset is demo-only**: `POST /api/user/forgot-password` returns the plaintext one-time token to the browser, so knowledge of an email address is sufficient to take over that account. `DIRECT_PASSWORD_RESET` defaults to enabled outside production and disabled in production. Do not enable it for a real deployment without restoring an ownership-verification channel such as email.
- After changing routes/models/permissions, update the tables above in this file.
