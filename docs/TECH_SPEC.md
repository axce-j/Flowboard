# Flowboard — Technical Specification (v3)

> v3 changelog: renamed Cadence → Flowboard; `Topic` gains nullable `teamId` (org-wide vs. team sub-topic); new `PermissionsService` abstraction; new bulk content import endpoint; new §9 v1-data-migration strategy (separate from schema migrations); new §10 database design principles.

## 1. Stack

- NestJS + TypeScript (unchanged from v1)
- PostgreSQL + TypeORM (migrations instead of `synchronize`)
- JWT auth (`@nestjs/jwt` + `passport-jwt`)
- `bcrypt` for password hashing
- `@nestjs/swagger` for API docs
- `@nestjs/throttler` for rate limiting
- `helmet` for security headers
- **AWS SES** for email (primary), abstracted behind an `EmailService` interface so **Resend** can be swapped in as a fallback with no call-site changes
- Docker + docker-compose for local Postgres
- GitHub Actions for CI (lint + test on push)

---

## 2. Data model

```
User
 ├─ id (uuid), email (unique), passwordHash, createdAt, updatedAt

Organization
 ├─ id (uuid), name, createdAt, updatedAt

OrganizationMembership
 ├─ id, userId (→User), organizationId (→Organization)
 ├─ role: 'owner' | 'admin' | 'member'
 ├─ status: 'pending' | 'active'
 ├─ invitedAt, joinedAt (nullable)
 └─ UNIQUE(userId, organizationId)

Team
 ├─ id, organizationId (→Organization), name, createdAt

TeamMembership
 ├─ id, userId (→User), teamId (→Team)
 └─ UNIQUE(userId, teamId)

Topic
 ├─ id, organizationId (→Organization), name, createdAt
 ├─ teamId (nullable →Team)   -- NEW: null = org-wide taxonomy, set = team sub-topic
 └─ see §2.1 for uniqueness rules (two partial indexes, not one composite UNIQUE)

ContentIdea
 ├─ id, teamId (→Team), topicId (nullable →Topic)
 ├─ handledBy (→User, FK — replaces v1 free-text string)
 ├─ createdBy (→User, FK — who created it, distinct from who's handling it)
 ├─ title (text), description (text)
 ├─ contentType: 'reel' | 'carousel' | 'other'
 ├─ status: 'idea' | 'draft' | 'ready' | 'posted'
 ├─ scheduledDate (real `date` column — was `text` in v1)
 ├─ week (real `date` or int week-number column — was `text` in v1; decide representation before Phase 3)
 ├─ deletedAt (nullable — soft delete)
 ├─ createdAt, updatedAt

ContentStatusHistory
 ├─ id, contentId (→ContentIdea), fromStatus, toStatus
 ├─ changedBy (→User), changedAt
```

**Org isolation:** `Team`, `Topic` carry `organizationId` directly. `ContentIdea` derives org through `teamId → Team.organizationId` (no duplicated `organizationId` column on content — avoids a second source of truth that could drift).

**4-org cap:** enforced in the service layer at `OrganizationMembership` **acceptance** (transition `pending → active`), not at invite send time.

### 2.1 Topic scoping rules (org-wide vs. team sub-topic)

- `teamId = null` → **org-wide topic**. Usable on content belonging to any team in the org. Creation stays owner-only, as in v2.
- `teamId` set → **team sub-topic**. Usable only on content whose `teamId` matches. Creation role is an open decision (§8) — default to owner-only for launch, same guard as org-wide, just parameterized by team.
- Uniqueness is **two partial unique indexes**, not one composite constraint, because Postgres treats `NULL` as distinct from itself in a plain `UNIQUE(organizationId, teamId, name)`:
  ```sql
  CREATE UNIQUE INDEX topic_orgwide_unique
    ON topic (organizationId, name) WHERE teamId IS NULL;
  CREATE UNIQUE INDEX topic_teamscoped_unique
    ON topic (organizationId, teamId, name) WHERE teamId IS NOT NULL;
  ```
- Content-tagging validation (in `content.service.ts`, both create and update):
  1. `topic.organizationId === content.team.organizationId` (existing rule)
  2. `topic.teamId === null || topic.teamId === content.teamId` (new rule — a team sub-topic can't be applied outside its own team)
- This is additive to the existing schema (nullable column + two indexes) — no breaking change to org-wide topics already in use.

---

## 3. Auth flow

1. **Signup** — `POST /auth/signup` → creates `User` + `Organization` + `OrganizationMembership(owner, active)` atomically (single DB transaction).
2. **Invite (existing user)** — creates `pending` membership, sends notification email, no new password.
3. **Invite (new user)** — creates signup token, email links to set-password page, activates membership on completion.
4. **Login** — `POST /auth/login`:
   - 1 active org → JWT `{ userId, orgId, role }` issued directly
   - 2+ active orgs → pre-org token + org list, requires `POST /auth/select-org`
5. **Guards** (replace `AppPasswordGuard` entirely):
   - `JwtAuthGuard` — validates token, populates `req.user`
   - `OrgScopeGuard` — auto-filters all `Team`/`Topic`/`ContentIdea` queries by `req.user.orgId`
   - `RolesGuard` (`@Roles('owner')` decorator) — thin decorator that delegates the actual decision to `PermissionsService` (see §8) rather than hardcoding role checks per-route

---

## 4. Email service

Interface-first so the provider is swappable:

```typescript
export interface EmailService {
  sendInvite(to: string, orgName: string, link: string): Promise<void>;
  sendPasswordReset(to: string, link: string): Promise<void>;
}
```

- `SesEmailService` — primary implementation, uses AWS SDK v3 `@aws-sdk/client-ses`
- `ResendEmailService` — fallback implementation, same interface
- `ConsoleEmailService` — dev-only, logs instead of sending (avoids needing SES sandbox approval for local dev)
- Provider selected via `EMAIL_PROVIDER` env var, injected via a factory provider in a dedicated `EmailModule`
- SES specifics to handle: sandbox mode (verify sender + a couple of test recipient addresses early), SPF/DKIM via domain verification, bounce handling can be deferred post-v2

---

## 5. API surface (high level)

```
POST   /auth/signup
POST   /auth/login
POST   /auth/select-org
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/invite
POST   /auth/invite/accept

GET    /api/org/members
PATCH  /api/org/members/:id/role
DELETE /api/org/members/:id

POST   /api/teams
GET    /api/teams
POST   /api/teams/:id/members

POST   /api/topics                  (body includes optional teamId — null/omitted = org-wide)
GET    /api/topics                  (returns org-wide topics + sub-topics for teams caller belongs to)

GET    /api/content            (filter: status, contentType, teamId, topicId, handledBy, search; pagination + sort)
GET    /api/content/:id
GET    /api/content/:id/history
POST   /api/content
POST   /api/content/import          (NEW — bulk create, partial success, see §5.1)
PATCH  /api/content/:id
PATCH  /api/content/bulk-status
DELETE /api/content/:id        (soft delete)
GET    /api/content/export     (CSV)

GET    /api/analytics

GET    /api/health
```

All routes except `/auth/*` and `/api/health` sit behind `JwtAuthGuard` + `OrgScopeGuard`. All docs auto-generated at `/api/docs` via `@nestjs/swagger` from the same DTOs used for validation.

### 5.1 Bulk content import

Previously missing from the user stories — only bulk *status update* existed; there was no bulk *create*.

- `POST /api/content/import` — body is a JSON array of items shaped like `CreateContentDto` (title, description, teamId, contentType, topicId?, handledById?, scheduledDate?, week?)
- **Partial success, not all-or-nothing**: each row is validated and inserted independently; the response reports per-row outcome (`{ index, status: 'created' | 'error', id?, errors? }`) rather than aborting the whole batch on one bad row
- Capped batch size (recommend starting at 500 rows/request — revisit under load)
- Each successfully created row gets one synthetic `ContentStatusHistory` entry (`fromStatus: null, toStatus: 'idea'`) so its history stays reconstructable like any manually-created item
- Same org/team/topic validation as single-create (§2.1), applied per row
- Runs as one request-scoped transaction *per row* (not one transaction for the whole batch) — a bad row shouldn't roll back the good ones
- `@Roles(...)`-gated the same way as single create (Member+, scoped to teams they belong to) — bulk import isn't a privilege escalation, just a shape difference

---

## 6. Migration notes — file-by-file, v1 → v2

### `main.ts`
- Add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))` — currently missing entirely, so DTO decorators do nothing today
- Add `app.use(helmet())`
- Add `app.enableCors({ origin: [...] })`
- Add `app.setGlobalPrefix('api')` *or* keep controllers hardcoding `/api` — pick one, don't do both
- Wire up Swagger (`SwaggerModule.setup('api/docs', app, document)`)
- Register the global exception filter

### `app.module.ts`
- Replace bare `entities: [ContentIdea]` with the full entity list (`User`, `Organization`, `OrganizationMembership`, `Team`, `TeamMembership`, `Topic`, `ContentIdea`, `ContentStatusHistory`)
- `synchronize: config.get('NODE_ENV') !== 'production'` → change to `synchronize: false` everywhere once migrations exist; keep a separate `migrationsRun: true` option for deploy
- Add `ConfigModule` validation schema (Joi or class-validator) so missing `DATABASE_URL`/`JWT_SECRET`/`EMAIL_PROVIDER` fail fast at boot instead of surfacing as a runtime 500 later
- Add new modules: `AuthModule`, `OrgModule`, `TeamModule`, `TopicModule`, `EmailModule`, `AnalyticsModule`, `PermissionsModule` (see §8)
- Add `ThrottlerModule.forRoot(...)`
- Remove `TeamMembersModule` (see below)

### `guard/app-password.guard.ts`
- **Delete entirely.** Replaced by `JwtAuthGuard` + `OrgScopeGuard` + `RolesGuard`. No successor file inherits its logic — the whole shared-password model is gone.

### `module/team-members.module.ts` + `controller/team-members.controller.ts`
- **Delete entirely.** v1's `TEAM_MEMBERS` env-var CSV is replaced by real `Team`/`TeamMembership` entities and a proper `TeamModule` with CRUD + membership endpoints. There is no reasonable upgrade path for this file — it's a placeholder being replaced by real data modeling.

### `entities/content.entity.ts`
- `handledBy: text` → `handledBy: User` (`@ManyToOne`), add `createdBy: User`
- Add `teamId: Team` (`@ManyToOne`, required — content always belongs to a team)
- Add `topicId: Topic` (`@ManyToOne`, nullable)
- `scheduledDate: text` → `scheduledDate: date` (real Postgres `date` type)
- `week: text` → decide a real representation (either a `date` marking week-start, or an `int` week-number + `year`) — flag this as a decision to make before Phase 3, not a mechanical rename
- Add `deletedAt: timestamp, nullable` for soft delete
- Consider whether `contentNumber` is still needed now that `id` (uuid) exists — likely droppable, confirm before migrating data

### `entities/topic.entity.ts` (new)
- `organizationId: Organization` (`@ManyToOne`, required)
- `teamId: Team` (`@ManyToOne`, nullable) — see §2.1
- Two partial unique indexes instead of a single `UNIQUE(organizationId, name)` (see §2.1 for exact DDL)

### `dto/content.dto.ts`
- `handledBy?: string` → `handledById?: string` (uuid), validated with `@IsUUID()`
- Add `teamId: string` (`@IsUUID()`, required on create)
- Add `topicId?: string` (`@IsUUID()`, optional)
- Add a separate `ContentQueryDto` for `GET /api/content` covering `page`, `limit`, `sortBy`, `order`, `search`, plus the existing `status`/`contentType` filters — currently these are loose `@Query()` strings with no validation at all
- Add `BulkStatusUpdateDto` for the bulk status endpoint
- Add `ContentImportDto` (`items: CreateContentDto[]`, capped array length) for the new bulk import endpoint

### `service/content.service.ts`
- `findAll` currently builds a raw `where` object from unvalidated query params with no org scoping, pagination, or search — replace with a query builder that:
  - Always injects `organizationId` (via team join) from `req.user.orgId`
  - Applies pagination/sort/search
  - Excludes soft-deleted rows by default
- `create` — set `createdBy` from `req.user.userId`, validate `teamId` belongs to caller's org, validate `topicId` (if present) belongs to same org **and** matches team scoping rule (§2.1)
- `update` — status changes must write a `ContentStatusHistory` row (`fromStatus`, `toStatus`, `changedBy`, `changedAt`) inside the same transaction as the update, not as an afterthought
- `remove` — change from `this.repo.remove(item)` (hard delete) to setting `deletedAt`
- Add `bulkUpdateStatus(ids, status, userId)` — one history row per item, all in one transaction
- Add `bulkImport(items, userId)` — per-row validation + insert, partial success, one seed history row per created item (§5.1)
- Add `findHistory(contentId)` for the audit endpoint

### `controller/content.controller.ts`
- Swap `@UseGuards(AppPasswordGuard)` → `@UseGuards(JwtAuthGuard, OrgScopeGuard)`, add `@Roles(...)` where relevant (e.g. bulk update, delete → owner/admin only)
- Add Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) — cheap, high signal, do this alongside the rest rather than as a separate pass
- Add `GET /:id/history`, `PATCH /bulk-status`, `POST /import`, `GET /export` endpoints
- Replace raw `@Query('status')`, `@Query('contentType')` strings with `@Query() query: ContentQueryDto` bound to the new DTO

### `module/content.module.ts`
- Add the new entities to `TypeOrmModule.forFeature([...])`: `Team`, `Topic`, `User`, `ContentStatusHistory`
- Import `AuthModule` (for guards) if not made global

### New files (no v1 equivalent)
- `entities/`: `user.entity.ts`, `organization.entity.ts`, `organization-membership.entity.ts`, `team.entity.ts`, `team-membership.entity.ts`, `topic.entity.ts`, `content-status-history.entity.ts`
- `auth/`: `auth.module.ts`, `auth.service.ts`, `auth.controller.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`, `org-scope.guard.ts`, `roles.guard.ts`, `roles.decorator.ts`
- `permissions/` (new — see §8): `permissions.module.ts`, `permissions.service.interface.ts`, `enum-permissions.service.ts`
- `email/`: `email.module.ts`, `email.service.interface.ts`, `ses-email.service.ts`, `resend-email.service.ts`, `console-email.service.ts`
- `org/`: `org.module.ts`, `org.controller.ts`, `org.service.ts`
- `team/`, `topic/`: same pattern as `content/` — module/controller/service
- `analytics/`: `analytics.module.ts`, `analytics.controller.ts`, `analytics.service.ts`
- `migrations/`: TypeORM migration files, generated from entity diffs (schema only — see §9 for data)
- `scripts/`: `migrate-v1-data.ts` (one-time backfill, not a TypeORM migration — see §9)
- `docker-compose.yml`, `Dockerfile`
- `.github/workflows/ci.yml`

---

## 7. Build order

**Phase 1 — Identity & Auth foundation**
- [ ] `User`, `Organization`, `OrganizationMembership` entities
- [ ] Signup, invite (both branches), invite-accept endpoints
- [ ] Login + org-selection endpoints, JWT issuance
- [ ] `JwtAuthGuard`, `OrgScopeGuard`, `RolesGuard` — delete `AppPasswordGuard`
- [ ] `EmailModule` with SES primary + Resend/console fallback, wired into invite/reset flows
- [ ] Forgot-password flow
- [ ] Enforce 4-org cap at acceptance
- [ ] Global `ValidationPipe`, exception filter, helmet, CORS, env validation (do these alongside Phase 1, not deferred — they're cheap and everything after depends on validated input)

**Phase 2 — Team & Topic structure**
- [ ] `Team`, `TeamMembership` entities + endpoints — delete `TeamMembersModule`
- [ ] `Topic` entity (with nullable `teamId`, two partial unique indexes) + owner-gated org-wide creation
- [ ] `PermissionsService` scaffolded (thin enum-backed implementation is fine for v2 — see §8)
- [ ] `RolesGuard`/`PermissionsService` applied to team/topic creation

**Phase 3 — Content rework**
- [ ] Decide `week` representation (blocking item, see §8)
- [ ] Migrate `ContentIdea`: `handledBy` → FK, add `teamId`/`topicId`/`createdBy`, real `date` column, `deletedAt`
- [ ] `ContentStatusHistory` table, populated transactionally on status change
- [ ] Org-scoped, paginated, sortable, searchable `findAll`
- [ ] Bulk status update endpoint
- [ ] Bulk content import endpoint (§5.1)

**Phase 4 — Everything else**
- [ ] Analytics endpoint
- [ ] CSV export
- [ ] Swagger docs across all modules
- [ ] Rate limiting
- [ ] Migrations replacing `synchronize`
- [ ] Unit + e2e tests
- [ ] Docker + docker-compose
- [ ] GitHub Actions CI
- [ ] One-time v1 data backfill script, **if** needed (§9) — run once, outside the regular migration chain

---

## 8. Open technical decisions to resolve before/during build

- Exact representation of `week` on `ContentIdea` (date vs int+year)
- Whether status transitions are strictly linear (`idea→draft→ready→posted` only) or allow arbitrary jumps/reversals — affects validation in `update()`
- Whether a `Member` can edit any content on their team or only content they're `handledBy` on
- **Which role can create a team-scoped sub-topic** — default recommendation: owner-only for launch (same guard as org-wide topics, just parameterized by team), revisit if admins need it
- **`PermissionsService` — build now or defer?** Recommendation: build the *interface* now (even if the only implementation is a simple enum switch), because it's the same low-cost, high-payoff pattern already adopted for `EmailService`. It means a future richer permission model (per-resource ACLs, custom roles) is a new implementation behind the same interface, not a rewrite of every controller's `@Roles(...)` checks.
- **Bulk import batch size and input format** — recommend JSON array capped at 500 rows for v2; CSV upload can reuse the same `bulkImport` service method later by parsing to the same shape first
- SES sandbox limits during local/staging dev — plan to use `ConsoleEmailService` locally and request SES production access early since approval can take 1–3 business days

---

## 9. v1 → v2 data migration strategy

This is **not** a TypeORM schema migration — schema migrations only ever carry structure (add column, add table), never business logic like "invent a `User` row for a free-text name." v1's shape is different enough (single shared password, no `Organization`/`Team` entities, text-typed dates, free-text `handledBy`) that going from v1 data to v2 data requires judgment calls a schema migration can't express safely.

**Recommended approach — a separate, one-time script (`scripts/migrate-v1-data.ts`), run once, outside the regular migration chain:**

1. Confirm first whether this is actually needed — if v1 was disposable demo/test data, skip this section entirely and ship v2 schema fresh.
2. If real data exists to preserve:
   - One v1 deployment → one new `Organization` (v1 was single-tenant by construction)
   - One default `Team` (e.g. "General"), seeded from v1's `TEAM_MEMBERS` env-var CSV via `TeamMembership`
   - One `User` per unique name found in v1's free-text `handledBy` field — either matched against a manually-supplied name→email mapping (preferred, avoids guessing emails) or created with placeholder emails that force a password reset on first login
   - `ContentIdea` rows: parse the old `text` `scheduledDate`/`week` into the new real-typed columns; set `handledBy` to the mapped `User`; set `createdBy = handledBy` (v1 never distinguished the two, so this is a documented assumption, not a fact)
   - `ContentStatusHistory` — v1 has no history to backfill; either leave it empty for pre-migration items, or insert one synthetic row per item (`fromStatus: null, toStatus: <current status>, changedBy: <mapped user>, changedAt: <content's createdAt>`) so every item has *some* history row for UI consistency
3. Run in a maintenance window against a fresh backup; the script should be idempotent (safe to re-run) and dry-runnable (report what it *would* do before writing).
4. This script is deleted or archived after the one-time run — it is not part of the ongoing `migrations/` folder and never runs as part of normal deploys.

---

## 10. Database design principles (avoiding unnecessary coupling)

Called out explicitly since the schema needs to survive several rounds of future change (permissions, roles, features) without breaking:

- **Single source of truth over denormalization.** Org isolation on `ContentIdea` is derived through `teamId → Team.organizationId`, never duplicated as its own column. Same logic applied to `Topic.teamId` — it's a plain nullable FK, not a second lookup path.
- **Optional relations are nullable FKs, not separate tables or flags.** `Topic.teamId` nullable, `ContentIdea.topicId` nullable, `ContentIdea.deletedAt` nullable — no parallel "TeamTopic" join table or boolean "isGlobal" flag duplicating what the nullable FK already expresses.
- **No permission logic in the schema.** Role is a plain enum column on `OrganizationMembership`; nothing about *what a role can do* lives in the database. That logic sits entirely in `PermissionsService` (§8), which is exactly what lets the permission model change later without a migration.
- **Migrations carry structure only.** Data backfills (§9) are separate, one-time, non-reversible-by-design scripts — keeping them out of the `migrations/` folder means the schema-migration history stays clean, linear, and safe to run in any environment.
- **Constraints enforced where the data lives, not just in application code.** The two partial unique indexes on `Topic` (§2.1) mean the org-wide/team-scoped uniqueness rule holds even if a future code path forgets to check it — the database is the backstop, application code is the fast path.
- **Additive-first schema changes.** Every structural change proposed here (`Topic.teamId`, `ContentIdea.deletedAt`, etc.) is a new nullable column or new table — nothing requires rewriting existing rows or breaking existing queries, which matters for a schema expected to keep evolving.
