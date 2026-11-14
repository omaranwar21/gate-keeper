# Pending backend endpoints

The frontend is built fully against these three read-only, additive endpoints. None of them exist on the backend yet — the admin dashboard, access-log table, and resident picker call them through the generic `/api/[...path]` proxy and currently get a 404, which the UI surfaces as a "pending backend" empty state rather than a crash or a raw error.

Nothing else in the backend needs to change for these: no existing route, guard, or DTO is touched. Implement these the same way the existing `buildings`/`units` list endpoints are implemented (role guard, `PaginationQueryDto`, same `{ data, meta }` envelope) and the frontend lights up with no changes beyond removing the pending-state check.

## 1. `GET /v1/users`

Admin-only (`RoleGuard` + `Role.Admin`), mirrors `GET /v1/buildings`'s shape.

**Query:** `role?: Role`, plus `PaginationQueryDto` (`page`, `perPage`).

**Response:** `PaginatedResult<User>` where `User` omits `passwordHash` — the same shape `POST /v1/users/create` already returns.

**Used by:** the resident picker in `admin/units/[id]` (assigning a resident to a unit). Called as `usersApi.list({ role: 'resident' })`.

## 2. `GET /v1/access-logs`

Admin-only. Joins `AccessLog` to `unit` (+ its `building`), `pass` (id/guestName/type), and `guard` (id/fullName).

**Query:** `date?` (`YYYY-MM-DD`, a Cairo-local calendar day — filter on `scannedAt` converted to `Africa/Cairo`), `buildingId?`, `unitId?`, `result?` (`'allowed' | 'denied'`), plus `page`/`perPage`.

**Response:** `PaginatedResult<AccessLog & { unit: Unit & { building: Building } | null; pass: Pick<GuestPass, 'id'|'guestName'|'type'> | null; guard: Pick<User, 'id'|'fullName'> }>`.

**Used by:** `admin/access-log` — the filtered, paginated table the brief's user story 7 asks for.

## 3. `GET /v1/dashboard/summary`

Admin-only. No query params.

**Response:**

```ts
{
  entriesToday: number;       // AccessLog rows today (Cairo calendar day) where result = 'allowed'
  deniedToday: number;        // same day, result = 'denied'
  activePasses: number;       // GuestPass rows whose derived status is 'active'
  expectedVisitors: Array<{
    passId: string;
    guestName: string;
    unitNumber: string;
    buildingName: string;
    validFrom: string;        // ISO
    validUntil: string;       // ISO
    type: "one_time" | "recurring";
  }>;
}
```

`expectedVisitors` is every pass (one-time or recurring) whose window covers today in Cairo time — the same `derivePassStatus`/time-window logic `guest-passes.service.ts` already uses for the scan decision, applied across all units instead of one resident's own passes.

**Used by:** `admin` (the dashboard's three stat tiles and the "today's expected visitors" list — user story 7).
