# GateKeeper — Compound Gate Access System

Residents create digital guest passes (QR codes), guards scan them at the gate, and the compound management team oversees everything from a dashboard.

- **Backend:** NestJS 12 + TypeScript, PostgreSQL via Prisma 7 — [`backend/gatekeeper`](backend/gatekeeper)
- **Frontend:** Next.js 16 (App Router) + React 19, Tailwind + shadcn/ui, TanStack Query — [`frontend`](frontend)

---

## Live links

| Part | URL |
| --- | --- |
| Frontend | https://gate-keeper-three.vercel.app/ |
| Backend API (base URL) | https://gate-keeper-d75d.onrender.com/v1 |

> The API runs on Render's free tier, which sleeps after ~15 minutes of inactivity. The first request after that can take up to a minute while it wakes up.

## Demo credentials (live site)

| Role | Email | Password | Can access |
| --- | --- | --- | --- |
| Admin | `admin@gmail.com` | `123456` | Dashboard, buildings/units/residents, access log, settings |
| Resident | `resident-1@gmail.com` | `123456` | My passes: create, QR, revoke |
| Guard | `guard@gmail.com` | `123456` | Scan screen only |

### Seed accounts (local)

`npm run db:seed` creates a separate set of accounts for local development, all with the password **`Password123!`**:

| Role | Email | Notes |
| --- | --- | --- |
| Admin | `admin@gatekeeper.test` | |
| Resident | `resident1@gatekeeper.test` | Belongs to **two** units (one in each building) |
| Resident | `resident2@gatekeeper.test` … `resident5@gatekeeper.test` | One unit each |
| Guard | `guard1@gatekeeper.test`, `guard2@gatekeeper.test` | |

The seed also creates 2 buildings (*Sunrise Tower*, *Marina Residences*), 10 units, and sample passes covering every status (active, used, expired, revoked, recurring) plus allowed/denied access-log entries for today.

---

## Features

**Admin** — buildings & units CRUD, assign/unassign residents, today's expected visitors, summary tiles (entries today, denied attempts today, active passes), analytics charts, a filterable + paginated access log (date range, time, building, unit, result), and a compound-wide pass limit setting.

**Resident** — list of passes across all their units with status (active / used / expired / revoked) and filters, create one-time or recurring passes, QR display + PNG download + copy link, revoke.

**Guard** — mobile-first scan screen: scan with the device camera or paste a code/link, then a full-width green **ALLOWED** / red **DENIED** result with the reason, guest name and unit.

**Every scan attempt** — allowed or denied, including unknown tokens — is written to the access log.

**Bonuses done:** admin-configurable *max active passes per unit per day*, and *Arabic / RTL* support (UI and API error messages).

---

## Running locally

**Prerequisites:** Node.js 22.12+ (Nest 12 packages are ESM-only and load through `require(esm)`), and a PostgreSQL 15+ database.

### 1. Database

Any Postgres works. For example, with Docker:

```bash
docker run -d --name gatekeeper-db -p 5432:5432 -e POSTGRES_USER=gatekeeper -e POSTGRES_PASSWORD=gatekeeper -e POSTGRES_DB=gatekeeper postgres:16
```

### 2. Backend (port 3000)

```bash
cd backend/gatekeeper
cp .env.example .env          # set DATABASE_URL and a long random JWT_SECRET
npm install                   # also runs `prisma generate`
npx prisma migrate deploy     # apply migrations
npm run db:seed               # builds, then seeds demo data
npm run dev                   # http://localhost:3000/v1
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Secret used to sign access tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `1h`) |
| `PORT` | HTTP port (default `3000`) |

### 3. Frontend (port 3001)

```bash
cd frontend
cp .env.example .env.local    # BACKEND_URL=http://localhost:3000, NEXT_PUBLIC_APP_URL=http://localhost:3001
npm install
npm run dev                   # http://localhost:3001
```

| Variable | Purpose |
| --- | --- |
| `BACKEND_URL` | NestJS API URL — **server-side only**, never shipped to the browser |
| `NEXT_PUBLIC_APP_URL` | Public origin of the frontend, used to build the link encoded in each QR |

> The camera scanner needs a secure context. `localhost` counts as one; to test from a phone on your LAN, use an HTTPS tunnel or the deployed site.

### 4. Tests

```bash
cd backend/gatekeeper
npm test            # unit tests (pass-validation scan decision, pass limits, filters, analytics, i18n…)
npm run test:e2e    # integration tests — needs DATABASE_URL pointing at a disposable database
```

The e2e suite builds and boots the real app, drives it over HTTP, and covers authentication and role-guard enforcement, the scan decision (allowed → repeat denied as `already_used`, unknown token → `invalid_token`), and **two concurrent scans of the same one-time pass** (exactly one is allowed).

---

## Data model

Full ER diagram: [`backend/gatekeeper/docs/er-diagram.md`](backend/gatekeeper/docs/er-diagram.md). Schema: [`schema.prisma`](backend/gatekeeper/prisma/schema.prisma).

| Table | Key columns | Notes |
| --- | --- | --- |
| `users` | `email` (unique), `password_hash` (bcrypt), `role` (`admin` \| `resident` \| `guard`) | One role per user |
| `buildings` | `name` (unique) | |
| `units` | `building_id`, `number`, `floor` | `(building_id, number)` unique — "101" can exist in both buildings |
| `unit_residents` | PK `(user_id, unit_id)` | Many-to-many: a resident can have several units, a unit several residents |
| `guest_passes` | `unit_id`, `created_by_id`, `guest_name`, `type` (`one_time` \| `recurring`), `token` (unique), `valid_from`, `valid_until`, `days_of_week[]`, `daily_start_min`, `daily_end_min`, `used_at`, `revoked_at`, `revoked_by_id` | Status is **derived**, not stored |
| `access_logs` | `pass_id?`, `unit_id?`, `guard_id`, `result` (`allowed` \| `denied`), `reason?`, `guest_name` (snapshot), `scanned_at` | One row per scan attempt; `pass_id` is null for unknown tokens |
| `compound_settings` | `max_active_passes_per_unit_per_day?` | Single row (id = 1); null = unlimited |

**Pass status** is computed from columns, with precedence `revoked > used > expired > active`:
`revoked_at` set → revoked; one-time with `used_at` set → used; `now > valid_until` → expired; otherwise active. Storing a status column would need a background job to flip passes to "expired" and could drift from the real state.

Indexes target the hot paths: access log by `scanned_at DESC`, by `(unit_id, scanned_at)` and `(result, scanned_at)`; passes by `(unit_id, valid_from)` and `(valid_from, valid_until)` for "today's expected visitors".

---

## Key decisions & trade-offs

### Backend framework — NestJS

Opinionated module/controller/service structure, first-class guards and decorators for authentication and role checks (`@Roles(...)`, `@Public()`, `@CurrentUser()`), `class-validator` DTOs with a global `ValidationPipe`, and DI that keeps services testable. For a role-heavy CRUD API on a short timebox, that structure is worth more than Fastify's raw speed or Express's freedom. Routes are URI-versioned (`/v1/...`).

### Frontend framework — Next.js (App Router)

Chosen mainly for **where auth lives**: Next.js route handlers act as a backend-for-frontend.

- `POST /api/auth/login` calls the API and stores the JWT in an **`httpOnly`, `Secure`, `SameSite=Lax` cookie** (`gk_session`). JavaScript in the page never sees the token, so XSS can't steal it.
- Every other call goes through a catch-all proxy (`/api/[...path]`) that reads the cookie and forwards it as `Authorization: Bearer` to the NestJS API. The browser only ever talks to the frontend origin.
- `src/proxy.ts` (Next middleware) redirects users to their role's area and away from other roles' pages. This is **UX only** — the real authorization is enforced by the backend on every request.
- Pages are mostly **client components** (forms, camera, live filters, TanStack Query caching); server code is limited to the BFF routes and middleware that handle the session.

### Authorization — never trust an id from the URL

- `JwtAuthGuard` is global (opt out with `@Public()`); `RoleGuard` checks `@Roles(...)` per route.
- Resident endpoints derive scope from the JWT `sub`, never from the request: `GET /units/mine` and `GET /passes/mine` join through `unit_residents`. For `GET/PATCH /passes/:id` and revoke, the service checks the resident is linked to the pass's unit.
- Cross-unit access returns **404, not 403**, so a resident can't tell "doesn't exist" from "exists but isn't yours".
- Residents sharing a unit can see and revoke each other's passes for that unit (judgment call: "my passes" = passes for my units).

### QR token design — random opaque token

`crypto.randomBytes(24).toString('base64url')` (192 bits), stored in a unique `token` column and looked up on scan. It carries no id and can't be guessed or enumerated.

I chose this over a signed payload (JWT/HMAC) because every scan **must hit the database anyway** to check `revoked_at` / `used_at`, which change after the pass is issued. A signature would add nothing except a bigger, denser QR and key-rotation concerns. Revocation is instant because the database is the only source of truth.

The QR encodes a link: `NEXT_PUBLIC_APP_URL/<locale>/guard/scan?token=…`. Scanning it with any camera opens the guard screen with the token filled in. The guard still has to be signed in, so the link is a convenience, not a bypass. QR images are rendered client-side (`qrcode.react`), since encoding a string needs no server secret.

### Race condition on one-time passes — atomic conditional update

The scan doesn't do SELECT-then-UPDATE. It claims the pass in **one statement**:

```ts
updateMany({ where: { id, usedAt: null, revokedAt: null }, data: { usedAt: now } })
```

Postgres evaluates the `WHERE` against the row's current committed state under a row lock. When two guards scan at the same instant, the second statement waits for the first, re-checks, finds `used_at` already set, and updates **0 rows**. `count === 0` → denied with `already_used`. No explicit transaction isolation level or application lock is needed, and it holds across multiple API instances. This is proven by the e2e test that fires two concurrent scans.

Recurring passes have no "used" state, so they skip this path (one entry per allowed day isn't enforced — see *skipped*).

### Race condition on the daily pass limit — per-unit advisory lock

The daily-limit check (below) aggregates multiple rows — every non-revoked pass of the unit, expanded into the Cairo days it occupies — so it can't be collapsed into one conditional `updateMany` the way the scan race was. Instead, `create()` wraps the count-check and the insert in a single Prisma transaction, guarded by a transaction-scoped Postgres advisory lock keyed by the unit id:

```ts
await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${dto.unitId}, 0))`;
```

Two concurrent creates for the same unit take the same lock key, so the second transaction blocks until the first commits or rolls back — by which point its own count-check always sees the first pass's row. The lock releases automatically at commit/rollback (no manual unlock), and it holds across multiple API instances since it's a Postgres-level lock, not an in-process one. Creates for different units use different keys and aren't serialized against each other. Proven by an e2e test that fires two concurrent creates against a unit already at its limit and asserts exactly one succeeds (`201`) and one is rejected (`409`).

### Scan decision — a pure function

`validatePassForScan` ([`pass-validation.ts`](backend/gatekeeper/src/guest-passes/pass-validation.ts)) takes the pass and `now` and returns `allowed` or a reason: `revoked`, `already_used`, `not_yet_valid`, `expired`, `outside_time_window` (wrong weekday or outside the daily hours). It has no DB access, so it's unit-tested in isolation, including Cairo weekday and minute-of-day boundaries. Unknown tokens give `invalid_token`.

`POST /passes/scan` always returns **200** with `{ result, reason, guestName, unit }` (unit number and building). A denial is an expected business outcome, not an HTTP error.

### Time handling — UTC instants + Cairo wall-clock

- All timestamps are `timestamptz` (UTC instants).
- Recurring windows ("Sun–Thu, 08:00–17:00") are stored as weekday numbers + **minutes since midnight in Africa/Cairo**, because they're wall-clock rules, not instants. Converting them to UTC would break across Egypt's DST changes.
- At scan time, `now` is converted to Cairo local weekday/minutes with `Intl.DateTimeFormat({ timeZone: 'Africa/Cairo' })` (no date library needed on the backend). "Today" for the dashboard and filters is the Cairo calendar day ([`cairo-time.ts`](backend/gatekeeper/src/shared/utils/cairo-time.ts)).
- The frontend formats and collects times in Cairo time with `date-fns-tz`, whatever the viewer's device timezone.

### Validation & errors

- Backend: `class-validator` DTOs with `whitelist: true` (unknown fields stripped). Frontend: Zod schemas + `react-hook-form` that mirror the same rules (required fields, window ordering, at least one weekday for recurring, etc.).
- Errors use Nest's standard shape `{ statusCode, message, error }` with correct codes: 400 validation, 401 unauthenticated, 403 wrong role, 404 not found / not yours, 409 conflicts.
- Prisma unique (`P2002`) and FK-restrict (`P2003`) errors map to **409** instead of leaking as 500s (duplicate building name or unit number, deleting a building that still has units, etc.). Uniqueness relies on DB constraints rather than pre-check SELECTs, which avoids TOCTOU races.
- Messages are translated (en/ar) on the backend, picked from the `Content-Language` header.

### Pagination

All list endpoints (`buildings`, `units`, `passes/mine`, `users`, `access-logs`) take `page` / `perPage` and return `{ data, meta: { total, currentPage, perPage, lastPage, prev, next } }`. Filters run as DB-level conditions, so totals stay correct.

### Pass limits (bonus)

Admins set `max active passes per unit per day` in Settings. On create, the service expands every non-revoked pass of the unit into the Cairo days it occupies (a recurring pass covers each matching weekday in its range) and rejects with 409 if any day would exceed the limit. The logic is a pure, unit-tested function ([`pass-limit.ts`](backend/gatekeeper/src/guest-passes/pass-limit.ts)).

### Hosting choice

Free tiers throughout. **Vercel** for the frontend (first-class Next.js support: route handlers and middleware work as-is, with preview deploys). **Render** for the API (a plain long-running Node web service with managed HTTPS; a serverless platform would fight Nest's bootstrap and the Postgres connection pool). **Supabase** for managed Postgres. See *Deployment* below.

---

## Deployment

| Part | Host | Notes |
| --- | --- | --- |
| Frontend (Next.js) | Vercel | HTTPS by default (required for the guard camera) |
| Backend API (NestJS) | Render web service | Root dir `backend/gatekeeper`, HTTPS via Render |
| Database | Supabase (PostgreSQL) | Connection over TLS (`sslmode=require`) |

**Configuration** comes only from environment variables set in each host's dashboard. Nothing secret is committed. See [`backend/gatekeeper/.env.example`](backend/gatekeeper/.env.example) and [`frontend/.env.example`](frontend/.env.example).

**CORS / cookies:** the browser never calls the API directly. It talks only to the frontend's own `/api/*` routes, which proxy server-to-server with the bearer token. That means no CORS configuration is needed on the API, and the session cookie is first-party (`httpOnly`, `Secure`, `SameSite=Lax`) on the frontend domain. No cross-site cookie problems.

**Backend build/start on Render:**

- Build: `npm ci --include=dev && npm run build` (the `postinstall` hook runs `prisma generate`; `--include=dev` because Render sets `NODE_ENV=production`, which would otherwise skip devDependencies).
- Start: `npm run start:prod` (`node dist/main`).

**Migrations in production:** created locally with `npm run db:migrate` (`prisma migrate dev`) and committed under `prisma/migrations/`. Production only ever gets `prisma migrate deploy`, which applies pending migrations in order and never generates or resets anything. Today I run it **manually** from my machine against the Supabase `DATABASE_URL`:

```bash
DATABASE_URL="<supabase-connection-string>" npx prisma migrate deploy
```

Why manual: the API is on Render's **free** plan, which doesn't offer a *Pre-Deploy Command* (that's a paid-plan feature) or shell access. I kept migrations out of the build command too, so a failed build can't leave the schema half-migrated. On a paid plan, or with a CI job (e.g. GitHub Actions running `prisma migrate deploy` before triggering the deploy), this step would be automatic.

**Deploying a new version:**

1. Merge into `main`. Render (API) and Vercel (frontend) both auto-deploy on push to `main`.
2. If the release includes a new migration, run `prisma migrate deploy` against Supabase **before** merging. Keep migrations backward-compatible (additive) so the still-running old version keeps working.
3. To roll back, redeploy the previous commit from the Render / Vercel dashboard.

---

## Skipped / known limitations

- **Real-time updates, facility booking, offline gate, Docker Compose, CI/CD** — not done. Picked pass limits and Arabic/RTL as the bonuses within the timebox.
- **Role changes need a re-login:** `RoleGuard` trusts the role in the JWT (stateless, no DB lookup per request), so a changed role takes effect when the 1h token expires. Accepted for a short-lived token; a token version column or deny-list would fix it.
- **No refresh tokens:** sessions last `JWT_EXPIRES_IN` (1h), then the user signs in again.
- **Recurring passes allow multiple entries per allowed day** (a housekeeper can step out and back in). Limiting to one entry per day would mean recording per-day usage.
- **No rate limiting** on login or scan. `@nestjs/throttler` would be the first addition.
- **One role per user** (a guard can't also be a resident).

## What I'd do next with more time

1. **Real-time** — SSE/WebSocket push for "Your guest Ahmed just entered" and a live dashboard access log.
2. **CI/CD** — GitHub Actions running lint, unit and e2e tests (Postgres service container) on every PR, deploying on merge to `main`.
3. **Docker Compose** for one-command local setup.
4. **Offline gate mode** — cache a short-lived, signed allow-list of today's tokens on the guard device and queue scans for upload. The trade-off: a revoked pass or a one-time pass used at another gate could be accepted until the device reconnects, so it should be time-boxed and visibly flagged.
5. **Security hardening** — refresh-token rotation, audit log for admin actions, token versioning for instant role/session revocation.
6. Add frontend tests (component + Playwright for the three role flows).
