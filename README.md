# Flowboard (v2 scaffold)

Multi-tenant content planning and workflow tool for marketing teams. See
`PRD.md`, `USER_STORIES.md`, `TECH_SPEC.md` in the project docs for the full
spec this scaffold implements.

## Status

This is the **structural scaffold**: every entity, module, controller,
guard, and DTO described in TECH_SPEC exists, is wired together, compiles,
and boots against a real Postgres instance. Business logic inside most
service methods is not yet implemented — those methods throw
`NotImplementedException` with a comment pointing at the build-order phase
that fills them in (see TECH_SPEC §7 "Build order").

**Verified so far:**
- `npm run build` — compiles clean
- App boots successfully against Postgres, all modules/routes wire up with
  no DI errors (confirmed locally)
- `npm run migration:generate` — produces a correct `InitialSchema`
  migration from the entities
- `npm run migration:run` — applies that migration to a real Postgres
  database with no errors, including the two partial unique indexes on
  `topics` (TECH_SPEC §2.1)

**Not yet implemented (by design, per build order):**
- Phase 1: signup/login/select-org/invite/accept/forgot-password logic in
  `AuthService`, 4-org cap enforcement, real SES/Resend email sends
- Phase 2: team/topic service logic, `PermissionsService` is fully
  implemented already (it's simple enough to build now, not deferred)
- Phase 3: content CRUD, status-history writes, bulk import, bulk status
  update — all in `ContentService`
- Phase 4: analytics aggregation, CSV export, unit/e2e tests, CI is scaffolded
  but untested since there's no logic yet to test

## Running locally

```bash
cp .env.example .env      # fill in JWT_SECRET at minimum
docker-compose up
# in another shell, once Postgres is healthy:
npm run migration:run
```

Swagger docs: `http://localhost:3000/api/docs`
Health check: `http://localhost:3000/api/health`

## Decisions baked into this scaffold

- `contentNumber` from v1 was dropped (confirmed) — `id` (uuid) is the only
  identifier now.
- `week` representation defaulted to `weekStartDate` (a nullable `date`),
  per the "date marking week-start" option in TECH_SPEC §8 — flagged in
  code as still revisitable before Phase 3 if the int week-number + year
  representation is preferred instead.
- `PermissionsService` was built as a real (if simple) implementation now,
  not deferred, per TECH_SPEC §8's recommendation.
