# Flowboard — Product Requirements Document (v3)

> v3 changelog: renamed product Cadence → Flowboard; resolved team-scoped ("sub-topic") taxonomy; added bulk content import; added v1→v2 data-migration decision; added permission-abstraction goal for future role/permission changes.

## 1. What this is

Flowboard is a multi-tenant content planning and workflow tool for marketing teams. v1 (`team-content-planner`) was a single-password, single-workspace CRUD demo. v2 rebuilds it as a real multi-org SaaS-shaped backend: real accounts, real teams, real permissions, and an audit trail — the kind of thing that could plausibly onboard more than one company.

**One-liner:** Flowboard tracks marketing content from idea to posted, across teams and organizations, with real auth and a full history of who changed what.

## 2. Problem statement

v1 solved "one team, one shared password, one Postgres table." That's fine for a single internal user but breaks the moment you want:
- More than one organization using the same deployment
- To know *who* actually created, assigned, or moved a piece of content (not a free-text name)
- To let some people manage content without being able to blow away teams or topics
- Any kind of "what happened to this task over time" reporting
- To seed a new team/org with existing content quickly instead of one-by-one entry

v2's job is to fix all five without turning into a bloated project-management clone.

## 3. Goals

- Real per-person accounts (email + password), no shared secret
- One person can belong to and switch between up to **4 organizations**
- Org-scoped data isolation enforced structurally (via a guard/interceptor), not per-query discipline
- Teams within an org; content belongs to a team
- Topic taxonomy for tagging/reporting — **org-wide by default, optionally scoped to a single team** as a sub-topic
- Full status-change audit trail per content item
- Role-based permissions (`owner` / `admin` / `member`), built behind an abstraction so the permission *model* can change later without a rewrite
- Bulk creation (import) of content ideas, not just bulk status updates
- Everything from the v1 "Future Improvements" wishlist that's actually load-bearing: analytics, search, bulk ops, Swagger docs, migrations, tests, Docker, CI

## 4. Non-goals (explicitly out of scope for v2)

- Billing / subscriptions
- Real-time collaboration (websockets, live cursors, etc.)
- Native mobile app
- File/media attachment storage (flagged as a stretch goal only)
- Cross-org content sharing
- SSO / social login (email+password only for v2)
- Automated, lossless migration of v1 production data (v1's shape is too different — see §9 and TECH_SPEC §9 for the backfill approach instead)

## 5. Personas

| Persona | Description | Core need |
|---|---|---|
| **Owner** | Created the org, or promoted to it | Full control — members, teams, topics, org settings |
| **Admin** | Trusted operator | Manage teams/topics/content, can't touch org settings or remove the owner |
| **Member** | Regular contributor | Create/edit content within their team(s), can't create teams or org-wide topics |

## 6. Core concepts

- **User** — a global identity: one email, one password, no org attached at the account level.
- **Organization** — a tenant. Isolation boundary for everything else.
- **OrganizationMembership** — join of User↔Organization, carries `role` and `status` (`pending`/`active`). Capped at 4 active memberships per user.
- **Team** — a group within an org (e.g. "Blog Team", "TikTok Team"). Content belongs to a team.
- **Topic** — a tag/taxonomy for content (e.g. "Career Advice"). Two flavors:
  - *Org-wide topic* (`teamId = null`) — visible/usable by every team in the org, owner-only to create.
  - *Team sub-topic* (`teamId` set) — usable only on that team's content, doesn't clutter other teams' reporting.
- **ContentIdea** — the actual unit of work: idea → draft → ready → posted, assigned to a user, tagged with a topic, scoped to a team. Can be created individually or via bulk import.
- **ContentStatusHistory** — append-only log of every status transition, who made it, and when.

## 7. Scope for v2 (in/out)

**In:**
- Signup, invite (existing-user vs new-user branching), login, org switching, password reset
- Team & topic CRUD (owner-gated org-wide topic creation; team sub-topic creation — see open decision in TECH_SPEC §8)
- Content CRUD, reworked to real relations, real dates, soft delete
- **Bulk content import** (row-level validation, partial success) in addition to bulk status update
- Status-change audit trail
- Analytics endpoint (by status/type/assignee/team)
- Search, pagination, bulk status update
- Swagger/OpenAPI docs for the whole API
- Migrations replacing `synchronize: true`
- Rate limiting, helmet, CORS, structured logging
- Docker + docker-compose (local Postgres) + GitHub Actions CI
- Unit + e2e tests on core flows
- Permission checks routed through a single `PermissionsService` abstraction so the role/permission model can evolve without touching every controller

**Out (this version):** see Non-goals above.

## 8. Success criteria

- A stranger reading the Swagger docs can understand and exercise the whole API without reading source
- Two different organizations can use the same deployment with zero data leakage between them
- Every status change on a content item is reconstructable after the fact — who, what, when
- `npm run migration:run` + `docker-compose up` gets a fresh contributor to a working local environment in one sitting
- Adding a new role or permission rule later touches the `PermissionsService` and its callers only — not the schema, not every controller
- A team can bulk-import a starter set of content ideas without hand-entering each one

## 9. Key decisions log

| Decision | Resolution |
|---|---|
| Identity model | Global per-email identity, one password. Org membership is a separate relation, not a separate account. |
| Max orgs per user | 4, enforced at invite **acceptance**, not send |
| Topic scope | **Org-wide by default; optionally team-scoped via nullable `teamId` on `Topic`.** Org-wide creation stays owner-gated; team-scoped creation role TBD (TECH_SPEC §8). |
| Roles at launch | `owner` / `admin` / `member` enum exists now even though only `owner` gates org-wide team/topic creation in v2 |
| Invite flow | Existing email → pending membership + notification email. New email → signup token, sets own password, activates membership on completion |
| Auth guard replacement | `AppPasswordGuard` fully removed. Replaced by `JwtAuthGuard` (identity) + `OrgScopeGuard` (tenant isolation) + `RolesGuard`/`PermissionsService` (permissions) |
| Email provider | **AWS SES** as primary, behind an `EmailService` interface so a swap to **Resend** is a single-file change, not a rewrite |
| Permission model | Same abstraction pattern as email: a `PermissionsService` interface fronting the current enum-based checks, so a future RBAC model swaps in behind it |
| Bulk content creation | Added `POST /api/content/import` — partial success, row-level error reporting, capped batch size |
| v1 data migration | **Not** attempted as a reversible schema migration. If v1 has real data worth keeping, it's a separate one-time backfill script (TECH_SPEC §9), run once, outside the migration chain |
| API docs | Swagger/OpenAPI (`@nestjs/swagger`), generated from the same DTOs that drive validation |
| Project name | **Flowboard** (renamed from Cadence) |

## 10. Open items to revisit later

- Which role(s) can create a **team-scoped** sub-topic — owner-only (consistent with org-wide) vs. owner+admin vs. team-scoped ownership concept. See TECH_SPEC §8.
- Max batch size and accepted format (JSON array vs. CSV upload) for bulk content import.
- Whether v1 holds real production data worth the backfill effort, or is disposable — determines if the ETL script in TECH_SPEC §9 gets built at all.
- Whether `PermissionsService` should be introduced now as a real abstraction or deferred until a second permission model is actually needed (see TECH_SPEC §8 for the recommended default).
